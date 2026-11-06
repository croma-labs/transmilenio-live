/**
 * Turns TransMilenio's published timetable (GTFS.zip) into the compact files
 * the schedule mode reads: one per day type, plus the routes and stops.
 *
 *   npm run timetable                 downloads GTFS.zip and rebuilds data/timetable
 *   npm run timetable -- ./GTFS.zip   uses a file you already have
 *
 * The timetable covers a whole year, so it only needs a rebuild when
 * TransMilenio publishes a new one. Needs `unzip` on the PATH.
 */
import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { gzipSync } from "node:zlib";

const SOURCE = "https://gtfs.transmilenio.gov.co/GTFS.zip";
const OUT = join(process.cwd(), "data", "timetable");
const CACHE = join(process.cwd(), ".cache");

const DAY_TYPES = { weekday: "monday", saturday: "saturday", sunday: "sunday" } as const;
type DayType = keyof typeof DAY_TYPES;

function systemOf(agencyName: string): string {
  const name = agencyName.toLowerCase();
  if (name.includes("cable")) return "transmicable";
  if (name.includes("troncal")) return "troncal";
  if (name.includes("alimentador")) return "alimentador";
  if (name.includes("dual")) return "dual";
  if (name.includes("complementario")) return "zonal_complementario";
  if (name.includes("especial")) return "zonal_especial";
  if (name.includes("urbano") || name.includes("zonal")) return "zonal_urbano";
  return "other";
}

function seconds(clock: string): number {
  const [h, m, s] = clock.split(":").map(Number);
  return (h ?? 0) * 3600 + (m ?? 0) * 60 + (s ?? 0);
}

async function* rows(zip: string, file: string): AsyncGenerator<Record<string, string>> {
  const child = spawn("unzip", ["-p", zip, file]);
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  let header: string[] | null = null;
  for await (const raw of lines) {
    const line = raw.replace(/^﻿/, "");
    if (!line) continue;
    const cells = line.split(",");
    if (!header) {
      header = cells.map((c) => c.trim());
      continue;
    }
    const row: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) row[header[i]!] = (cells[i] ?? "").trim();
    yield row;
  }
}

async function zipPath(): Promise<string> {
  const given = process.argv[2];
  if (given) return given;
  mkdirSync(CACHE, { recursive: true });
  const target = join(CACHE, "GTFS.zip");
  console.log(`Downloading ${SOURCE}`);
  const res = await fetch(SOURCE);
  if (!res.ok || !res.body) throw new Error(`GTFS.zip answered ${res.status}`);
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(target));
  return target;
}

async function main() {
  const zip = await zipPath();

  const systems = new Map<string, string>();
  for await (const r of rows(zip, "agency.txt")) systems.set(r.agency_id!, systemOf(r.agency_name ?? ""));

  const routeIndex = new Map<string, number>();
  const routes: [string, string | null, string | null, string][] = [];
  for await (const r of rows(zip, "routes.txt")) {
    routeIndex.set(r.route_id!, routes.length);
    routes.push([r.route_id!, r.route_short_name || null, r.route_long_name || null, systems.get(r.agency_id!) ?? "other"]);
  }

  const stopIndex = new Map<string, number>();
  const stops: [number, number, string][] = [];
  for await (const r of rows(zip, "stops.txt")) {
    const lat = Number(r.stop_lat);
    const lon = Number(r.stop_lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    stopIndex.set(r.stop_id!, stops.length);
    stops.push([Math.round(lat * 1e6) / 1e6, Math.round(lon * 1e6) / 1e6, (r.stop_name || r.stop_id!).replace(/\s+/g, " ")]);
  }

  // Which day types each service runs on, and the dates that move a day to another type (holidays).
  const serviceDays = new Map<string, Set<DayType>>();
  for await (const r of rows(zip, "calendar.txt")) {
    const days = new Set<DayType>();
    for (const [type, column] of Object.entries(DAY_TYPES) as [DayType, string][]) if (r[column] === "1") days.add(type);
    serviceDays.set(r.service_id!, days);
  }
  const exceptions: Record<string, DayType> = {};
  for await (const r of rows(zip, "calendar_dates.txt")) {
    if (r.exception_type !== "1") continue;
    const days = serviceDays.get(r.service_id!);
    const type = days?.size === 1 ? [...days][0] : undefined;
    if (type) exceptions[`${r.date!.slice(0, 4)}-${r.date!.slice(4, 6)}-${r.date!.slice(6, 8)}`] = type;
  }

  // Frequency-based trips (TransMiCable cabins every few seconds) are not drawn as buses.
  const frequencyTrips = new Set<string>();
  for await (const r of rows(zip, "frequencies.txt")) frequencyTrips.add(r.trip_id!);

  const tripIndex = new Map<string, number>();
  const tripRoute: number[] = [];
  const tripService: string[] = [];
  for await (const r of rows(zip, "trips.txt")) {
    const route = routeIndex.get(r.route_id!);
    if (route === undefined || frequencyTrips.has(r.trip_id!)) continue;
    tripIndex.set(r.trip_id!, tripRoute.length);
    tripRoute.push(route);
    tripService.push(r.service_id!);
  }
  console.log(`${routes.length} routes, ${stops.length} stops, ${tripRoute.length} trips`);

  // stop_times is not grouped by trip, so collect it all, then bucket by trip and order by sequence.
  let size = 0;
  let cap = 10_000_000;
  let rowTrip = new Int32Array(cap);
  let rowSeq = new Int32Array(cap);
  let rowTime = new Int32Array(cap);
  let rowStop = new Uint16Array(cap);
  for await (const r of rows(zip, "stop_times.txt")) {
    const trip = tripIndex.get(r.trip_id!);
    const stop = stopIndex.get(r.stop_id!);
    const clock = r.arrival_time || r.departure_time;
    if (trip === undefined || stop === undefined || !clock) continue;
    if (size === cap) {
      cap *= 2;
      const grow = <T extends Int32Array | Uint16Array>(a: T, make: (n: number) => T) => {
        const next = make(cap);
        next.set(a);
        return next;
      };
      rowTrip = grow(rowTrip, (n) => new Int32Array(n));
      rowSeq = grow(rowSeq, (n) => new Int32Array(n));
      rowTime = grow(rowTime, (n) => new Int32Array(n));
      rowStop = grow(rowStop, (n) => new Uint16Array(n));
    }
    rowTrip[size] = trip;
    rowSeq[size] = Number(r.stop_sequence);
    rowTime[size] = seconds(clock);
    rowStop[size] = stop;
    size++;
    if (size % 2_000_000 === 0) console.log(`  ${size.toLocaleString()} stop times`);
  }

  const trips = tripRoute.length;
  const start = new Int32Array(trips + 1);
  for (let i = 0; i < size; i++) start[rowTrip[i]! + 1]!++;
  for (let t = 0; t < trips; t++) start[t + 1]! += start[t]!;
  const fill = start.slice(0, trips);
  const order = new Int32Array(size);
  for (let i = 0; i < size; i++) order[fill[rowTrip[i]!]!++] = i;
  for (let t = 0; t < trips; t++) {
    const a = start[t]!;
    const b = start[t + 1]!;
    for (let i = a + 1; i < b; i++) {
      const v = order[i]!;
      let j = i - 1;
      while (j >= a && rowSeq[order[j]!]! > rowSeq[v]!) {
        order[j + 1] = order[j]!;
        j--;
      }
      order[j + 1] = v;
    }
  }

  mkdirSync(OUT, { recursive: true });
  const counts: Record<DayType, number> = { weekday: 0, saturday: 0, sunday: 0 };
  for (const type of Object.keys(DAY_TYPES) as DayType[]) {
    const picked: number[] = [];
    for (let t = 0; t < trips; t++) if (start[t + 1]! - start[t]! >= 2 && serviceDays.get(tripService[t]!)?.has(type)) picked.push(t);
    let total = 0;
    for (const t of picked) total += start[t + 1]! - start[t]!;

    // Layout: [trips, stopTimes] u32 · route u16[trips] · stops-per-trip u16[trips] · first time u32[trips] · per stop time (stop u16, seconds since the previous stop u16).
    const buf = Buffer.alloc(8 + picked.length * 8 + total * 4);
    let o = 0;
    buf.writeUInt32LE(picked.length, o);
    buf.writeUInt32LE(total, o + 4);
    o = 8;
    for (const t of picked) o = buf.writeUInt16LE(tripRoute[t]!, o);
    for (const t of picked) o = buf.writeUInt16LE(start[t + 1]! - start[t]!, o);
    for (const t of picked) o = buf.writeUInt32LE(rowTime[order[start[t]!]!]!, o);
    for (const t of picked) {
      let prev = rowTime[order[start[t]!]!]!;
      for (let k = start[t]!; k < start[t + 1]!; k++) {
        const i = order[k]!;
        const time = Math.max(prev, rowTime[i]!);
        o = buf.writeUInt16LE(rowStop[i]!, o);
        o = buf.writeUInt16LE(Math.min(65_535, time - prev), o);
        prev = time;
      }
    }
    writeFileSync(join(OUT, `${type}.bin.gz`), gzipSync(buf, { level: 9 }));
    counts[type] = picked.length;
    console.log(`${type}: ${picked.length.toLocaleString()} trips, ${total.toLocaleString()} stop times`);
  }

  const meta = { source: SOURCE, builtAt: new Date().toISOString(), trips: counts, exceptions, routes, stops };
  writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta));
  console.log(`Wrote ${OUT}`);
  if (!existsSync(join(OUT, "meta.json"))) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
