import { useEffect, useState } from "react";
import type { OrderMethod, PlacedOrder } from "./orders";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked-up"
  | "out-for-delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  "picked-up": "Picked up",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const orderStatusDescriptions: Record<OrderStatus, string> = {
  pending: "Waiting for the vendor to accept your order.",
  confirmed: "The vendor accepted your order.",
  preparing: "Your surplus food is being packed.",
  ready: "Your order is packed and waiting.",
  "picked-up": "You collected your order. Enjoy!",
  "out-for-delivery": "A courier is on the way to you.",
  delivered: "Your order was delivered. Enjoy!",
  cancelled: "This order was cancelled.",
  refunded: "This order was refunded.",
};

export const pickupFlow: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "picked-up"];
export const deliveryFlow: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out-for-delivery",
  "delivered",
];

export function flowFor(method: OrderMethod) {
  return method === "delivery" ? deliveryFlow : pickupFlow;
}

export function isTerminal(status: OrderStatus) {
  return status === "cancelled" || status === "refunded";
}

/** Seconds each simulated stage lasts before advancing. */
export const STAGE_SECONDS = 8;

/**
 * Mock "live" tracking: derive the current stage from how long ago the order
 * was placed, advancing one step every few seconds. Cancelled/refunded orders
 * (flagged on the order itself) stay put.
 */
export function deriveStatus(order: PlacedOrder, now: number = Date.now()): OrderStatus {
  const forced = (order as PlacedOrder & { status?: OrderStatus }).status;
  // A vendor-set status always wins over the simulated timeline.
  if (forced) return forced;
  const flow = flowFor(order.method);
  const elapsed = (now - new Date(order.placedAt).getTime()) / 1000;
  const index = Math.min(flow.length - 1, Math.max(0, Math.floor(elapsed / STAGE_SECONDS)));
  return flow[index]!;
}

export function useLiveStatus(order: PlacedOrder | undefined) {
  const [status, setStatus] = useState<OrderStatus | undefined>(() =>
    order ? deriveStatus(order) : undefined,
  );

  useEffect(() => {
    if (!order) {
      setStatus(undefined);
      return;
    }
    setStatus(deriveStatus(order));
    const timer = window.setInterval(() => setStatus(deriveStatus(order)), 1000);
    return () => window.clearInterval(timer);
  }, [order]);

  return status;
}

export function statusBadgeClass(status: OrderStatus) {
  switch (status) {
    case "delivered":
    case "picked-up":
      return "bg-success/15 text-success border-success/30";
    case "cancelled":
    case "refunded":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "ready":
    case "out-for-delivery":
      return "bg-accent/20 text-accent-foreground border-accent/40";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
