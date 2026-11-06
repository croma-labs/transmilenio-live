import type { z } from "zod";

import type { arrivalsResult, DayType, System } from "@/lib/schemas";

/** One bus as the map draws it: positions change every snapshot, the rest rarely. */
export interface Bus {
  id: string;
  lat: number;
  lon: number;
  route: string | null;
  stop: string | null;
  status: string | null;
  label: string | null;
  plate: string | null;
  reportedAt: string | null;
}

export interface RouteInfo {
  code: string | null;
  name: string | null;
  system: System;
}

export interface Fleet {
  asOf: string;
  /** False when TransMilenio has published nothing new for over 5 minutes: the buses are its last published positions. */
  live: boolean;
  /** Set when the buses come from the published timetable instead of the live feed. */
  scheduled?: { day: DayType; minute: number };
  total: number;
  buses: Bus[];
  routes: Record<string, RouteInfo>;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  routes: string[];
}

export type Arrivals = z.infer<typeof arrivalsResult>;

export interface RouteLine {
  routeId: string;
  code: string | null;
  name: string | null;
  system: System;
  lengthM: number | null;
  coordinates: number[][];
  stops: { id: string; name: string | null; lat: number; lon: number }[];
}
