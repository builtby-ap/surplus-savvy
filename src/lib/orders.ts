export type OrderMethod = "pickup" | "delivery";

export interface PlacedOrder {
  id: string;
  receiptNumber: string;
  bagId: string;
  businessId: string;
  method: OrderMethod;
  notes: string;
  quantity: number;
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
    return raw ? (JSON.parse(raw) as PlacedOrder[]) : [];
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
