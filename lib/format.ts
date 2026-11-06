/** `HH:MM:SS` on Bogotá's clock, from an ISO timestamp the API returns in `-05:00`. */
export function clockOf(iso: string): string {
  const m = /T(\d{2}:\d{2}:\d{2})/.exec(iso);
  return m?.[1] ?? iso;
}

export function formatMs(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function statusText(status: string | null): string {
  if (status === "stopped_at") return "Detenido en";
  if (status === "incoming_at") return "Llegando a";
  return "Va hacia";
}

export function delayText(seconds: number | null): string {
  if (seconds == null) return "Sin horario";
  const minutes = Math.round(seconds / 60);
  if (minutes === 0) return "A tiempo";
  return minutes > 0 ? `${minutes} min tarde` : `${-minutes} min antes`;
}

/** How old the newest report may be before the feed counts as stopped, the same bar the API uses. */
const STALE_AFTER_MS = 5 * 60_000;

/** The API's `live` when it sends one; otherwise judged from `as_of`. */
export function isLiveData(asOf: string, live: boolean | undefined): boolean {
  return live ?? Date.now() - Date.parse(asOf) <= STALE_AFTER_MS;
}

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "las 19:11 del 5 de noviembre", on Bogotá's clock, from an ISO timestamp in `-05:00`. */
export function sinceText(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})/.exec(iso);
  if (!m) return iso;
  return `las ${m[4]} del ${Number(m[3])} de ${MONTHS[Number(m[2]) - 1]}`;
}

/** The current minute of the day on Bogotá's clock. */
export function bogotaMinute(at = new Date()): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return Number(parts.hour) * 60 + Number(parts.minute);
}

/** `07:05` from a minute of the day. */
export function minuteClock(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export const DAY_LABEL = { weekday: "Entre semana", saturday: "Sábado", sunday: "Domingo y festivo" } as const;
