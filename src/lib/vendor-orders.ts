/** Vendor-side order helpers: demo seeding, status transitions, pending counts. */
import { bagsForBusiness, getDeliveryTerms, getBusiness } from "@/data/mock";
import { deriveStatus, flowFor, type OrderStatus } from "./order-status";
import {
  listOrdersForBusiness,
  saveOrder,
  setOrderStatus,
  type OrderMethod,
  type PlacedOrder,
} from "./orders";

function buildOrder(
  businessId: string,
  n: number,
  bagIds: string[],
  method: OrderMethod,
  minutesAgo: number,
  status: OrderStatus,
  notes = "",
): PlacedOrder | null {
  const bags = bagsForBusiness(businessId).filter((b) => bagIds.includes(b.id));
  if (bags.length === 0) return null;
  const items = bags.map((bag) => ({
    bagId: bag.id,
    businessId: bag.businessId,
    title: bag.title,
    quantity: 1,
    originalPrice: bag.originalPrice,
    unitPrice: bag.discountedPrice,
  }));
  const originalPrice = items.reduce((s, i) => s + i.originalPrice * i.quantity, 0);
  const itemPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const business = getBusiness(businessId);
  const deliveryFee =
    method === "delivery" && business ? getDeliveryTerms(business).deliveryFee : 0;
  return {
    id: `ord-v${businessId}-${n}`,
    receiptNumber: `SR-80${n}00${n}`,
    items,
    businessId,
    businessIds: [businessId],
    method,
    notes,
    originalPrice,
    itemPrice,
    discount: originalPrice - itemPrice,
    deliveryFee,
    total: itemPrice + deliveryFee,
    ...(method === "delivery"
      ? { deliveryAddress: "42 Camden High Street, London" }
      : { pickupWindow: "17:30 – 19:00" }),
    placedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    status,
  } as PlacedOrder;
}

/** Seeds a handful of incoming orders the first time a vendor opens the page. */
export function ensureVendorDemoOrders(businessId: string) {
  if (typeof window === "undefined") return;
  if (listOrdersForBusiness(businessId).length > 0) return;
  const bags = bagsForBusiness(businessId);
  if (bags.length === 0) return;
  const ids = bags.map((b) => b.id);
  const pick = (i: number) => ids[i % ids.length]!;
  [
    buildOrder(businessId, 1, [pick(0)], "pickup", 4, "pending", "Please pack nuts separately."),
    buildOrder(businessId, 2, [pick(1)], "delivery", 12, "pending"),
    buildOrder(businessId, 3, [pick(0), pick(2)], "pickup", 40, "preparing"),
    buildOrder(businessId, 4, [pick(1)], "delivery", 180, "delivered"),
  ]
    .filter((o): o is PlacedOrder => Boolean(o))
    .forEach(saveOrder);
}

export function statusOf(order: PlacedOrder): OrderStatus {
  return deriveStatus(order);
}

/** Next stage a vendor can advance an order to, or null when finished. */
export function nextStatus(order: PlacedOrder): OrderStatus | null {
  const flow = flowFor(order.method);
  const current = statusOf(order);
  const index = flow.indexOf(current);
  if (index < 0 || index >= flow.length - 1) return null;
  return flow[index + 1]!;
}

export function acceptOrder(id: string) {
  setOrderStatus(id, "confirmed");
}

export function rejectOrder(id: string) {
  setOrderStatus(id, "cancelled");
}

export function advanceOrder(order: PlacedOrder) {
  const next = nextStatus(order);
  if (next) setOrderStatus(order.id, next);
  return next;
}

export function pendingCountForBusiness(businessId: string) {
  return listOrdersForBusiness(businessId).filter((o) => statusOf(o) === "pending").length;
}
