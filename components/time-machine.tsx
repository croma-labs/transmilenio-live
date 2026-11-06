"use client";

import { PauseIcon, PlayIcon, RadioIcon } from "lucide-react";

import { Section } from "@/components/panels";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DAY_LABEL, minuteClock } from "@/lib/format";
import { DAY_TYPES, type DayType } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export type Mode = "live" | "schedule";

/** Switches the map between the live feed and the published timetable, and scrubs the timetable through the day. */
export function TimeMachine({
  mode,
  onMode,
  day,
  onDay,
  minute,
  onMinute,
  playing,
  onPlaying,
}: {
  mode: Mode;
  onMode: (mode: Mode) => void;
  day: DayType | null;
  onDay: (day: DayType) => void;
  minute: number;
  onMinute: (minute: number) => void;
  playing: boolean;
  onPlaying: (playing: boolean) => void;
}) {
  return (
    <Section title="Línea de tiempo" aside={mode === "schedule" ? <span className="eyebrow-sm">espacio · ← →</span> : null}>
      <div className="grid grid-cols-2 gap-1.5">
        <Button size="sm" variant={mode === "live" ? "default" : "outline"} onClick={() => onMode("live")}>
          <RadioIcon />
          En vivo
        </Button>
        <Button size="sm" variant={mode === "schedule" ? "default" : "outline"} onClick={() => onMode("schedule")}>
          Horario programado
        </Button>
      </div>

      {mode === "schedule" ? (
        <div className="mt-4">
          <div className="flex items-end justify-between">
            <span className="font-mono text-[40px] leading-none font-semibold tracking-tight tabular-nums">{minuteClock(minute)}</span>
            <Button size="icon" variant="outline" aria-label={playing ? "Pausar" : "Reproducir el día"} onClick={() => onPlaying(!playing)}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </Button>
          </div>
          <Slider
            className="mt-4"
            min={0}
            max={1439}
            step={1}
            value={[minute]}
            aria-label="Hora del día"
            onValueChange={(value) => {
              onPlaying(false);
              onMinute(Array.isArray(value) ? (value[0] ?? 0) : value);
            }}
          />
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground tabular-nums">
            {["00", "06", "12", "18", "24"].map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DAY_TYPES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDay(d)}
                className={cn(
                  "border px-2 py-1 font-mono text-[10.5px] transition-colors",
                  d === day ? "border-foreground text-foreground" : "border-line text-muted-foreground hover:text-foreground",
                )}
              >
                {DAY_LABEL[d]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-snug text-muted-foreground">
            Dónde estaría cada bus si cumpliera el horario que publica TransMilenio. No es la posición real.
          </p>
        </div>
      ) : null}
    </Section>
  );
}
