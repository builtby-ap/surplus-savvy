import { useEffect, useState } from "react";

/** Milliseconds from now until the given "HH:MM" time today. Food posts last one day only,
 * so a time already past returns 0 (closed) instead of rolling over to tomorrow. */
export function msUntil(hhmm: string, now: Date = new Date()) {
  const parts = hhmm.split(":");
  const hours = Number(parts[0] ?? 0);
  const minutes = Number(parts[1] ?? 0);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return Math.max(0, target.getTime() - now.getTime());
}

export function formatDuration(ms: number) {
  if (ms <= 0) return "Closed";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((ms % 60000) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s left`;
  return `${seconds}s left`;
}

/** Live-updating countdown to an "HH:MM" time. Returns ms remaining (0 on the server). */
export function useCountdown(hhmm: string, intervalMs = 1000) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(msUntil(hhmm));
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [hhmm, intervalMs]);

  return remaining;
}

export const CLOSING_SOON_MS = 60 * 60 * 1000;

/** True when the post closes within the next hour (and has not already closed). */
export function isClosingSoon(hhmm: string, now: Date = new Date()) {
  const ms = msUntil(hhmm, now);
  return ms > 0 && ms <= CLOSING_SOON_MS;
}

/** Live-updating "now" tick, for time-based filtering. Null before hydration. */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
