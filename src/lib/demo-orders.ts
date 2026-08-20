import { getBag } from "@/data/mock";
import type { OrderStatus } from "./order-status";
import { listPlacedOrders, saveOrder, type OrderMethod, type PlacedOrder } from "./orders";

/** Only this seeded account gets sample order history. */
const DEMO_CUSTOMER_EMAIL = "customer@example.com";

function build(
  customerId: string,
  n: number,
  bagIds: string[],
  method: OrderMethod,
  minutesAgo: number,
  status?: OrderStatus,
): PlacedOrder {
  const items = bagIds
    .map((id) => getBag(id))
    .filter(Boolean)
    .map((bag) => ({
      bagId: bag!.id,
      businessId: bag!.businessId,
      title: bag!.title,
      quantity: 1,
      originalPrice: bag!.originalPrice,
      unitPrice: bag!.discountedPrice,
    }));
  const originalPrice = items.reduce((s, i) => s + i.originalPrice * i.quantity, 0);
  const itemPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryFee = method === "delivery" ? 2.5 : 0;
  return {
    id: `ord-demo${n}`,
    customerId,
    receiptNumber: `SR-90000${n}`,
    items,
    businessId: items[0]!.businessId,
    businessIds: [...new Set(items.map((i) => i.businessId))],
    method,
    notes: "",
    originalPrice,
    itemPrice,
    discount: originalPrice - itemPrice,
    deliveryFee,
    total: itemPrice + deliveryFee,
    ...(method === "delivery" ? { deliveryAddress: "18 Rosewood Lane, London" } : { pickupWindow: "18:00 – 19:30" }),
    placedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    ...(status ? { status } : {}),
  } as PlacedOrder;
}

/**
 * Seeds sample orders for the demo customer account only.
 * Real (newly registered) accounts start with an empty order history.
 */
export function ensureDemoOrders(customer?: { id: string; email: string } | null) {
  if (typeof window === "undefined") return;
  if (!customer || customer.email.trim().toLowerCase() !== DEMO_CUSTOMER_EMAIL) return;
  if (listPlacedOrders(customer.id).length > 0) return;
  const id = customer.id;
  [
    build(id, 3, ["m9"], "pickup", 60 * 30, "refunded"),
    build(id, 2, ["m3", "m7"], "delivery", 60 * 6, "cancelled"),
    build(id, 1, ["m1", "m20"], "pickup", 0),
  ].forEach(saveOrder);
}
