import type { OrderStatus } from "./order-status";

export function recordedStatusTime(status: OrderStatus, placedAt: string, times: Record<string, unknown> = {}): string | undefined {
  const value = times[status.replaceAll("-", "_")] ?? (status === "pending" ? placedAt : undefined);
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : undefined;
}