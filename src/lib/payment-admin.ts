/**
 * Admin-side payment verification.
 *
 * Admin RLS policies (`has_role(auth.uid(), 'admin')`) already allow reading
 * and updating every order and the single `payment_settings` row, and the
 * storage policy on `payment-screenshots` lets admins read every screenshot,
 * so these are plain client queries — the same pattern used for vendor
 * approval and advertising.
 */
import { supabase } from "@/integrations/supabase/client";
import { signedScreenshotUrl, type PaymentSettings } from "@/lib/payments";

export type AdminPaymentStatus = "awaiting_verification" | "verified" | "rejected" | "not_required";

export interface AdminPayment {
  id: string;
  receiptNumber: string;
  placedAt: string;
  method: "pickup" | "delivery";
  total: number;
  itemPrice: number;
  discount: number;
  deliveryFee: number;
  notes: string;
  pickupWindow: string | null;
  deliveryAddress: string | null;
  screenshotPath: string | null;
  screenshotUrl: string | null;
  vendorName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  items: { id: string; title: string; quantity: number; unitPrice: number }[];
  paymentStatus: AdminPaymentStatus;
  paymentVerifiedAt: string | null;
  paymentVerifiedBy: string | null;
  paymentVerifiedByName: string | null;
  paymentRejectionReason: string | null;
}

/** @deprecated Use AdminPayment instead. */
export type PendingPayment = AdminPayment;

export async function fetchAdminPayments(): Promise<AdminPayment[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, receipt_number, placed_at, method, total, item_price, discount, delivery_fee, notes, pickup_window, delivery_address, delivery_recipient_name, delivery_phone, delivery_township, delivery_city, payment_screenshot_url, payment_status, payment_verified_at, payment_verified_by, payment_rejection_reason, customer_id, vendors(name), order_items(id, title, quantity, unit_price)",
    )
    .neq("payment_status", "not_required")
    .order("placed_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const customerIds = [...new Set(rows.map((r) => String(r['customer_id'])))];
  const adminIds = [...new Set(rows.map((r) => (r['payment_verified_by'] ? String(r['payment_verified_by']) : null)).filter(Boolean))];

  const [profiles, adminProfiles] = await Promise.all([
    customerIds.length
      ? supabase.from("profiles").select("id, full_name, email, phone").in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    adminIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", adminIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (profiles.error) throw profiles.error;
  if (adminProfiles.error) throw adminProfiles.error;

  const byId = new Map(
    (profiles.data ?? []).map((p) => [p.id, p as { full_name: string; email: string; phone: string | null }]),
  );
  const adminById = new Map(
    (adminProfiles.data ?? []).map((p) => [p.id, p as { full_name: string }]),
  );

  return Promise.all(
    rows.map(async (row) => {
      const path = (row['payment_screenshot_url'] as string) ?? null;
      const profile = byId.get(String(row['customer_id']));
      const adminId = row['payment_verified_by'] ? String(row['payment_verified_by']) : null;
      const adminProfile = adminId ? adminById.get(adminId) : null;
      const vendor = row['vendors'] as { name?: string } | null;
      const address =
        (row['delivery_address'] as string) ??
        [row['delivery_township'], row['delivery_city']].filter(Boolean).join(", ") ??
        null;
      return {
        id: String(row['id']),
        receiptNumber: String(row['receipt_number']),
        placedAt: String(row['placed_at']),
        method: (row['method'] as "pickup" | "delivery") ?? "pickup",
        total: Number(row['total'] ?? 0),
        itemPrice: Number(row['item_price'] ?? 0),
        discount: Number(row['discount'] ?? 0),
        deliveryFee: Number(row['delivery_fee'] ?? 0),
        notes: String(row['notes'] ?? ""),
        pickupWindow: (row['pickup_window'] as string) ?? null,
        deliveryAddress: address || null,
        screenshotPath: path,
        screenshotUrl: path ? await signedScreenshotUrl(path) : null,
        vendorName: vendor?.name ?? "Unknown vendor",
        customerName: profile?.full_name || "Unknown customer",
        customerEmail: profile?.email ?? "—",
        customerPhone: profile?.phone ?? (row['delivery_phone'] as string) ?? null,
        items: ((row['order_items'] as Record<string, unknown>[]) ?? []).map((i) => ({
          id: String(i['id']),
          title: String(i['title']),
          quantity: Number(i['quantity'] ?? 1),
          unitPrice: Number(i['unit_price'] ?? 0),
        })),
        paymentStatus: (row['payment_status'] as AdminPaymentStatus) ?? "awaiting_verification",
        paymentVerifiedAt: (row['payment_verified_at'] as string) ?? null,
        paymentVerifiedBy: adminId,
        paymentVerifiedByName: adminProfile?.full_name ?? null,
        paymentRejectionReason: (row['payment_rejection_reason'] as string) ?? null,
      } satisfies AdminPayment;
    }),
  );
}

/** @deprecated Use fetchAdminPayments instead. */
export const fetchPendingPayments = fetchAdminPayments;

export async function approvePayment(orderId: string, adminId: string) {
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "verified",
      payment_rejection_reason: null,
      payment_verified_at: new Date().toISOString(),
      payment_verified_by: adminId,
    } as never)
    .eq("id", orderId);
  if (error) throw error;
}

export async function rejectPayment(orderId: string, reason?: string) {
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "rejected",
      payment_rejection_reason: reason?.trim() || null,
      payment_verified_at: null,
      payment_verified_by: null,
    } as never)
    .eq("id", orderId);
  if (error) throw error;
}

export async function savePaymentSettings(settings: PaymentSettings) {
  const { data: existing } = await supabase.from("payment_settings").select("id").limit(1).maybeSingle();
  const payload = {
    qr_image_url: settings.qrImageUrl,
    account_name: settings.accountName,
    instructions: settings.instructions,
  };
  const { error } = existing
    ? await supabase.from("payment_settings").update(payload).eq("id", existing.id)
    : await supabase.from("payment_settings").insert(payload);
  if (error) throw error;
}
