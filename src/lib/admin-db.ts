/**
 * Supabase-backed data access for the admin dashboard.
 *
 * Admin RLS policies (`has_role(auth.uid(), 'admin')`) already allow reading
 * and updating every vendor, profile and order, so these are plain client
 * queries that return the shapes the existing admin UI already renders.
 */
import { supabase } from "@/integrations/supabase/client";
import { businessTypeLabels, type BagCategory, type BusinessType } from "@/data/mock";
import type { VendorRecord, VendorStatus } from "@/lib/vendor-registry";
import type { PlatformUser, UserStatus } from "@/lib/platform-users";
import type { PlatformOrder } from "@/lib/platform-stats";
import type { UserRole } from "@/lib/auth/types";

export async function fetchAdminVendors(): Promise<VendorRecord[]> {
  const { data, error } = await supabase
    .from("vendors")
    .select(
      "id, legacy_id, name, type, address, neighborhood, email, phone, verification_status, rejection_reason, created_at, business_license_name, fda_approval_name",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((v) => ({
    id: v.id,
    ...(v.legacy_id ? { businessId: v.legacy_id } : {}),
    name: v.name,
    type: businessTypeLabels[v.type as BusinessType] ?? v.type,
    address: [v.address, v.neighborhood].filter(Boolean).join(", "),
    email: v.email ?? "—",
    phone: v.phone ?? "—",
    status: v.verification_status as VendorStatus,
    submittedAt: v.created_at,
    ...(v.rejection_reason ? { rejectionReason: v.rejection_reason } : {}),
    documents: {
      businessLicense: v.business_license_name ?? "business-license.pdf",
      fdaApproval: v.fda_approval_name ?? "fda-approval.pdf",
    },
  }));
}

export async function updateVendorStatus(
  vendorId: string,
  status: VendorStatus,
  rejectionReason?: string,
): Promise<VendorRecord[]> {
  const { error } = await supabase
    .from("vendors")
    .update({
      verification_status: status,
      rejection_reason: status === "rejected" ? (rejectionReason ?? null) : null,
    })
    .eq("id", vendorId);
  if (error) throw error;
  return fetchAdminVendors();
}

export async function fetchAdminUsers(): Promise<PlatformUser[]> {
  const [profileRes, roleRes, orderRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("orders").select("customer_id, total"),
  ]);
  if (profileRes.error) throw profileRes.error;

  const roleByUser = new Map<string, UserRole>();
  for (const row of roleRes.data ?? []) {
    roleByUser.set(row.user_id, row.role === "food_vendor" ? "vendor" : (row.role as UserRole));
  }
  const activity = new Map<string, { orders: number; spent: number }>();
  for (const o of orderRes.data ?? []) {
    const entry = activity.get(o.customer_id) ?? { orders: 0, spent: 0 };
    entry.orders += 1;
    entry.spent += Number(o.total);
    activity.set(o.customer_id, entry);
  }

  return (profileRes.data ?? []).map((p) => {
    const stats = activity.get(p.id) ?? { orders: 0, spent: 0 };
    return {
      id: p.id,
      fullName: p.full_name || p.email || "Unnamed user",
      email: p.email,
      ...(p.phone ? { phone: p.phone } : {}),
      role: roleByUser.get(p.id) ?? "customer",
      provider: "password" as const,
      status: p.status as UserStatus,
      joinedAt: p.created_at,
      orders: stats.orders,
      spent: stats.spent,
      seeded: false,
    };
  });
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
): Promise<PlatformUser[]> {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (error) throw error;
  return fetchAdminUsers();
}

/** Real marketplace orders, flattened per item for the analytics helpers. */
export async function fetchPlatformOrders(): Promise<PlatformOrder[]> {
  const [itemRes, vendorRes, postRes] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, order_id, vendor_id, food_post_id, quantity, unit_price, original_price"),
    supabase.from("vendors").select("id, neighborhood"),
    supabase.from("food_posts").select("id, category"),
  ]);
  if (itemRes.error) throw itemRes.error;

  const { data: orders } = await supabase.from("orders").select("id, placed_at");
  const placedAt = new Map((orders ?? []).map((o) => [o.id, o.placed_at]));
  const city = new Map((vendorRes.data ?? []).map((v) => [v.id, v.neighborhood || "Other"]));
  const category = new Map((postRes.data ?? []).map((p) => [p.id, p.category as BagCategory]));

  return (itemRes.data ?? []).map((item) => ({
    id: item.id,
    businessId: item.vendor_id,
    placedAt: placedAt.get(item.order_id) ?? new Date().toISOString(),
    units: item.quantity,
    revenue: Number(item.unit_price) * item.quantity,
    discount: (Number(item.original_price) - Number(item.unit_price)) * item.quantity,
    category: (item.food_post_id ? category.get(item.food_post_id) : undefined) ?? "mixed_meals",
    city: city.get(item.vendor_id) ?? "Other",
  }));
}
