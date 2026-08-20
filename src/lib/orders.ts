export type OrderMethod = "pickup" | "delivery";

export interface OrderItem {
  bagId: string;
  businessId: string;
  title: string;
  quantity: number;
  originalPrice: number;
  unitPrice: number;
}

export interface PlacedOrder {
  id: string;
  receiptNumber: string;
  items: OrderItem[];
  /** Primary vendor (first item's vendor) — kept for quick lookups. */
  businessId: string;
  businessIds: string[];
  method: OrderMethod;
  notes: string;
  originalPrice: number;
  itemPrice: number;
  discount: number;
  deliveryFee: number;
  total: number;
  deliveryAddress?: string;
  pickupWindow?: string;
  placedAt: string;
}

const STORAGE_KEY = "surplus-rescue:orders";

function readAll(): PlacedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PlacedOrder[]) : [];
    return Array.isArray(parsed) ? parsed.filter((o) => Array.isArray(o?.items)) : [];
  } catch {
    return [];
  }
}

function writeAll(orders: PlacedOrder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function saveOrder(order: PlacedOrder) {
  writeAll([order, ...readAll()].slice(0, 50));
}

export function getPlacedOrder(id: string) {
  return readAll().find((o) => o.id === id);
}

export function listPlacedOrders() {
  return readAll();
}

export function newOrderIds() {
  const n = Math.floor(100000 + Math.random() * 899999);
  return { id: `ord-${n}`, receiptNumber: `SR-${n}` };
}
