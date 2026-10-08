/**
 * Supabase-backed customer order history.
 *
 * Reads the customer's own rows from the `orders` table (RLS scopes them to
 * `auth.uid()`), so any status the vendor sets on their dashboard shows up
 * here for the customer too.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fromDbStatus } from "@/lib/vendor-db";
import type { OrderMethod } from "@/lib/orders";
import type { OrderStatus } from "@/lib/order-status";
import type { PaymentStatus } from "@/lib/payments";


export interface CustomerOrderItem {
  id: string;
  title: string;
  quantity: number;
  originalPrice: number;
  unitPrice: number;
}

export interface CustomerOrder {
  id: string;
  receiptNumber: string;
  method: OrderMethod;
  status: OrderStatus;
  notes: string;
  deliveryAddress: string | null;
  pickupWindow: string | null;
  originalPrice: number;
  itemPrice: number;
  discount: number;
  deliveryFee: number;
  total: number;
  placedAt: string;
  updatedAt?: string;
  paymentVerifiedAt?: string | null;
  pickupInstructions?: string[];
  deliveryRecipientName?: string | null;
  deliveryPhone?: string | null;
  deliveryBuildingFloor?: string | null;
  deliveryNote?: string | null;
  vendorId: string;
  vendorName: string;
  vendorType: string;
  vendorAddress: string;
  vendorNeighborhood: string;
  vendorPhone: string;
  paymentStatus: PaymentStatus;
  paymentScreenshotUrl: string | null;
  items: CustomerOrderItem[];
}

const ORDER_COLUMNS =
  "id, receipt_number, method, status, notes, delivery_address, pickup_window, original_price, item_price, discount, delivery_fee, total, placed_at, updated_at, vendor_id, payment_status, payment_screenshot_url, payment_verified_at, delivery_recipient_name, delivery_phone, delivery_building_floor, delivery_note, vendors_public(name, display_alias, type, address, neighborhood, phone), order_items(id, title, quantity, original_price, unit_price, food_posts(pickup_instructions))";


type Row = Record<string, unknown>;

function toOrder(row: Row): CustomerOrder {
  const vendor = (row['vendors_public'] as Row | null) ?? {};
  const items = (row['order_items'] as Row[] | null) ?? [];
  const s = (v: unknown) => (v == null ? "" : String(v));
  const n = (v: unknown) => Number(v ?? 0);
  return {
    id: s(row['id']),
    receiptNumber: s(row['receipt_number']),
    method: (s(row['method']) || "pickup") as OrderMethod,
    status: fromDbStatus(s(row['status']) || "pending"),
    notes: s(row['notes']),
    deliveryAddress: (row['delivery_address'] as string) ?? null,
    pickupWindow: (row['pickup_window'] as string) ?? null,
    originalPrice: n(row['original_price']),
    itemPrice: n(row['item_price']),
    discount: n(row['discount']),
    deliveryFee: n(row['delivery_fee']),
    total: n(row['total']),
    placedAt: s(row['placed_at']) || new Date().toISOString(),
    updatedAt: s(row['updated_at']),
    paymentVerifiedAt: (row['payment_verified_at'] as string) ?? null,
    pickupInstructions: [...new Set(items.map((item) => s((item['food_posts'] as Row | null)?.['pickup_instructions']).trim()).filter(Boolean))],
    deliveryRecipientName: (row['delivery_recipient_name'] as string) ?? null,
    deliveryPhone: (row['delivery_phone'] as string) ?? null,
    deliveryBuildingFloor: (row['delivery_building_floor'] as string) ?? null,
    deliveryNote: (row['delivery_note'] as string) ?? null,
    vendorId: s(row['vendor_id']),
    vendorName: s(vendor['name']) || s(vendor['display_alias']) || "Mystery Vendor",
    vendorType: s(vendor['type']),
    vendorAddress: s(vendor['address']),
    vendorNeighborhood: s(vendor['neighborhood']),
    vendorPhone: s(vendor['phone']),
    paymentStatus: ((row['payment_status'] as PaymentStatus) ?? "not_required") as PaymentStatus,
    paymentScreenshotUrl: (row['payment_screenshot_url'] as string) ?? null,

    items: items.map((i) => ({
      id: s(i['id']),
      title: s(i['title']),
      quantity: n(i['quantity']) || 1,
      originalPrice: n(i['original_price']),
      unitPrice: n(i['unit_price']),
    })),
  };
}

export async function fetchMyOrders(): Promise<CustomerOrder[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("customer_id", userId)
    .order("placed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => toOrder(r as Row));
}

export async function fetchMyOrder(id: string): Promise<CustomerOrder | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toOrder(data as Row);
}

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function looksLikeOrderId(v: string) {
  return isUuid(v);
}

/** Live list of the signed-in customer's orders (realtime + light polling). */
export function useMyOrders(enabled: boolean) {
  const [orders, setOrders] = useState<CustomerOrder[] | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setOrders([]);
      return;
    }
    let alive = true;
    const load = () => {
      fetchMyOrders()
        .then((rows) => alive && setOrders(rows))
        .catch(() => alive && setOrders([]));
    };
    load();
    const channel = supabase
      .channel("customer-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    const timer = window.setInterval(load, 15000);
    return () => {
      alive = false;
      window.clearInterval(timer);
      supabase.removeChannel(channel);
      window.clearInterval(timer);
    };
  }, [enabled]);

  return orders;
}

/** Live single order for the tracking page. */
export function useMyOrder(id: string, enabled: boolean) {
  const [order, setOrder] = useState<CustomerOrder | null | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !isUuid(id)) {
      setOrder(enabled ? null : undefined);
      return;
    }
    let alive = true;
    const load = () => {
      fetchMyOrder(id)
        .then((row) => alive && setOrder(row))
        .catch(() => alive && setOrder(null));
    };
    load();
    const channel = supabase
      .channel(`customer-order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        load,
      )
      .subscribe();
    const timer = window.setInterval(load, 10000);
    return () => {
      alive = false;
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [id, enabled]);

  return order;
}
