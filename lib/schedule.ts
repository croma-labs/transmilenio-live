import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import type { DayType, System } from "@/lib/schemas";
import type { Result } from "@/lib/trace";
import type { Bus, Fleet, RouteInfo } from "@/lib/types";

// Built by scripts/build-timetable.ts from TransMilenio's GTFS.zip.
const DIR = join(process.cwd(), "data", "timetable");

interface Meta {
  builtAt: string;
  exceptions: Record<string, DayType>;
  routes: [string, string | null, string | null, System][];
  stops: [number, number, string][];
}

interface Day {
  trips: number;
  route: Uint16Array;
  first: Int32Array;
  offset: Int32Array;
  stop: Uint16Array;
  time: Int32Array;
}

let metaLoad: Promise<Meta> | null = null;
const dayLoads = new Map<DayType, Promise<Day>>();

function meta(): Promise<Meta> {
  metaLoad ??= readFile(join(DIR, "meta.json"), "utf8").then((text) => JSON.parse(text) as Meta);
  return metaLoad;
}

function day(type: DayType): Promise<Day> {
  let load = dayLoads.get(type);
  if (!load) {
    load = readFile(join(DIR, `${type}.bin.gz`)).then((gz) => decode(gunzipSync(gz)));
    dayLoads.set(type, load);
  }
  return load;
}

function decode(buf: Buffer): Day {
  const trips = buf.readUInt32LE(0);
  const total = buf.readUInt32LE(4);
  let o = 8;
  const route = new Uint16Array(trips);
  const offset = new Int32Array(trips + 1);
  const first = new Int32Array(trips);
  for (let t = 0; t < trips; t++, o += 2) route[t] = buf.readUInt16LE(o);
  for (let t = 0; t < trips; t++, o += 2) offset[t + 1] = offset[t]! + buf.readUInt16LE(o);
  for (let t = 0; t < trips; t++, o += 4) first[t] = buf.readUInt32LE(o);
  const stop = new Uint16Array(total);
  const time = new Int32Array(total);
  for (let t = 0; t < trips; t++) {
    let clock = first[t]!;
    for (let k = offset[t]!; k < offset[t + 1]!; k++, o += 4) {
      stop[k] = buf.readUInt16LE(o);
      clock += buf.readUInt16LE(o + 2);
      time[k] = clock;
    }
  }
  return { trips, route, first, offset, stop, time };
}

/** Today's date and minute on Bogotá's clock. */
export function bogotaNow(): { date: string; minute: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minute: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Which timetable a date runs: holidays run Sunday's. */
export async function dayTypeOf(date: string): Promise<DayType> {
  const holiday = (await meta()).exceptions[date];
  if (holiday) return holiday;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return weekday === 0 ? "sunday" : weekday === 6 ? "saturday" : "weekday";
}

/**
 * Where every bus would be at `minute` if it ran exactly to the published
 * timetable: each trip placed between the two stops it is scheduled between,
 * on a straight line. Trips that run past midnight count for the early hours.
 */
export async function scheduledFleet(type: DayType, minute: number): Promise<Result<Fleet>> {
  const [m, d] = await Promise.all([meta(), day(type)]);
  const buses: Bus[] = [];
  const routes: Record<string, RouteInfo> = {};
  for (const at of [minute * 60, minute * 60 + 86_400]) {
    for (let t = 0; t < d.trips; t++) {
      const a = d.offset[t]!;
      const b = d.offset[t + 1]! - 1;
      if (at < d.time[a]! || at > d.time[b]!) continue;
      let lo = a;
      let hi = b;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (d.time[mid]! <= at) lo = mid;
        else hi = mid;
      }
      const from = m.stops[d.stop[lo]!]!;
      const to = m.stops[d.stop[hi]!]!;
      const span = d.time[hi]! - d.time[lo]!;
      const f = span > 0 ? (at - d.time[lo]!) / span : 1;
      const [routeId, code, name, system] = m.routes[d.route[t]!]!;
      routes[routeId] ??= { code, name, system };
      buses.push({
        id: `${type}-${t}`,
        lat: Math.round((from[0] + (to[0] - from[0]) * f) * 1e5) / 1e5,
        lon: Math.round((from[1] + (to[1] - from[1]) * f) * 1e5) / 1e5,
        route: routeId,
        stop: f >= 1 ? from[2] : to[2],
        status: f >= 1 || f === 0 ? "stopped_at" : "in_transit_to",
        label: null,
        plate: null,
        reportedAt: null,
      });
    }
  }
  const { date } = bogotaNow();
  const clock = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
  return {
    ok: true,
    data: { asOf: `${date}T${clock}:00-05:00`, live: false, scheduled: { day: type, minute }, total: buses.length, buses, routes },
    traces: [],
  };
}
