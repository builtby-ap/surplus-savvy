/**
 * Platform-wide mock analytics for the admin dashboards.
 *
 * Generates a deterministic synthetic order history across every partner
 * business (localStorage only holds the signed-in user's recent orders, so it
 * cannot represent the whole marketplace), and blends in real local orders.
 */
import {
  bagCategoryLabels,
  businesses,
  bagsForBusiness,
  getBag,
  type BagCategory,
} from "@/data/mock";
import { listPlacedOrders, type PlacedOrder } from "@/lib/orders";
import { listVendors, type VendorRecord } from "@/lib/vendor-registry";
import { AUTH_KEYS } from "@/lib/auth/auth-service";

/** Rough mock factors, matching the customer impact dashboard. */
export const MEALS_PER_ITEM = 1.4;
export const KG_FOOD_PER_ITEM = 1.1;
export const KG_CO2_PER_ITEM = 2.5;

export interface PlatformOrder {
  id: string;
  businessId: string;
  placedAt: string;
  units: number;
  revenue: number;
  discount: number;
  category: BagCategory;
  city: string;
}

/** Small deterministic PRNG so the numbers stay stable between renders. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONTHS = 6;

function syntheticOrders(): PlatformOrder[] {
  const rand = mulberry32(20260820);
  const now = new Date();
  const out: PlatformOrder[] = [];
  businesses.forEach((business, bIndex) => {
    const bags = bagsForBusiness(business.id);
    if (bags.length === 0) return;
    for (let m = MONTHS - 1; m >= 0; m--) {
      // Volume grows gently month over month.
      const base = 8 + bIndex * 2 + (MONTHS - m) * 3;
      const count = Math.round(base * (0.7 + rand() * 0.7));
      for (let i = 0; i < count; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const daysInMonth = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth() + 1,
          0,
        ).getDate();
        const day = 1 + Math.floor(rand() * (m === 0 ? now.getDate() : daysInMonth));
        const bag = bags[Math.floor(rand() * bags.length)]!;
        const units = rand() > 0.75 ? 2 : 1;
        out.push({
          id: `pf-${business.id}-${m}-${i}`,
          businessId: business.id,
          placedAt: new Date(
            monthStart.getFullYear(),
            monthStart.getMonth(),
            day,
            10 + Math.floor(rand() * 9),
          ).toISOString(),
          units,
          revenue: bag.discountedPrice * units,
          discount: (bag.originalPrice - bag.discountedPrice) * units,
          category: bag.category,
          city: business.neighborhood,
        });
      }
    }
  });
  return out;
}

function fromLocalOrders(orders: PlacedOrder[]): PlatformOrder[] {
  return orders.flatMap((order) =>
    order.items.map((item, index) => {
      const bag = getBag(item.bagId);
      const business = businesses.find((b) => b.id === item.businessId);
      return {
        id: `${order.id}-${index}`,
        businessId: item.businessId,
        placedAt: order.placedAt,
        units: item.quantity,
        revenue: item.unitPrice * item.quantity,
        discount: (item.originalPrice - item.unitPrice) * item.quantity,
        category: (bag?.category ?? "bakery") as BagCategory,
        city: business?.neighborhood ?? "Other",
      };
    }),
  );
}

export function platformOrders(): PlatformOrder[] {
  return [...syntheticOrders(), ...fromLocalOrders(listPlacedOrders())];
}

/** Registered customer accounts, padded with a mock installed base. */
export function customerCount(): number {
  const baseline = 1284;
  if (typeof window === "undefined") return baseline;
  try {
    const raw = window.localStorage.getItem(AUTH_KEYS.accounts);
    const accounts = raw ? (JSON.parse(raw) as Array<{ role?: string }>) : [];
    return baseline + accounts.filter((a) => a.role === "customer").length;
  } catch {
    return baseline;
  }
}

export interface PlatformTotals {
  customers: number;
  vendors: number;
  approvedVendors: number;
  pendingVendors: number;
  orders: number;
  units: number;
  revenue: number;
  saved: number;
  meals: number;
  foodKg: number;
  co2Kg: number;
}

export function platformTotals(
  orders: PlatformOrder[],
  vendors: VendorRecord[] = listVendors(),
  customers?: number,
): PlatformTotals {
  const units = orders.reduce((s, o) => s + o.units, 0);
  return {
    customers: customers ?? customerCount(),
    vendors: vendors.length,
    approvedVendors: vendors.filter((v) => v.status === "approved").length,
    pendingVendors: vendors.filter((v) => v.status === "pending").length,
    orders: orders.length,
    units,
    revenue: orders.reduce((s, o) => s + o.revenue, 0),
    saved: orders.reduce((s, o) => s + o.discount, 0),
    meals: Math.round(units * MEALS_PER_ITEM),
    foodKg: units * KG_FOOD_PER_ITEM,
    co2Kg: units * KG_CO2_PER_ITEM,
  };
}

export interface MonthlyPoint {
  key: string;
  month: string;
  orders: number;
  revenue: number;
  vendors: number;
  customers: number;
}

export function monthlyTrends(
  orders: PlatformOrder[],
  vendors: VendorRecord[] = listVendors(),
): MonthlyPoint[] {
  const now = new Date();
  const buckets: MonthlyPoint[] = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleDateString(undefined, { month: "short" }),
      orders: 0,
      revenue: 0,
      vendors: 0,
      customers: 0,
    };
  });
  const find = (iso: string) => {
    const d = new Date(iso);
    return buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
  };
  for (const order of orders) {
    const bucket = find(order.placedAt);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += order.revenue;
  }
  for (const vendor of vendors) {
    const bucket = find(vendor.submittedAt);
    if (bucket) bucket.vendors += 1;
  }
  // Mock customer sign-ups scale with order volume that month.
  buckets.forEach((b, i) => {
    b.customers = Math.round(b.orders * 0.9 + 12 + i * 4);
  });
  return buckets;
}

export interface Breakdown {
  key: string;
  label: string;
  orders: number;
  units: number;
  revenue: number;
}

function breakdown(
  orders: PlatformOrder[],
  keyOf: (o: PlatformOrder) => string,
  labelOf: (key: string) => string,
): Breakdown[] {
  const map = new Map<string, Breakdown>();
  for (const order of orders) {
    const key = keyOf(order);
    const entry = map.get(key) ?? { key, label: labelOf(key), orders: 0, units: 0, revenue: 0 };
    entry.orders += 1;
    entry.units += order.units;
    entry.revenue += order.revenue;
    map.set(key, entry);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

export function categoryBreakdown(orders: PlatformOrder[]) {
  return breakdown(
    orders,
    (o) => o.category,
    (key) => bagCategoryLabels[key as BagCategory] ?? key,
  );
}

export function cityBreakdown(orders: PlatformOrder[]) {
  return breakdown(
    orders,
    (o) => o.city,
    (key) => key,
  );
}
