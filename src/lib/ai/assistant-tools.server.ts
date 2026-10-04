/**
 * Role-scoped data tools for the Phoe La Min assistant.
 * Every query runs with the signed-in user's own Supabase session, so
 * database access rules (RLS) are the final authority on what is visible.
 */
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AssistantRole = "customer" | "vendor" | "admin";
type Db = SupabaseClient<Database>;

const mmk = (v: number | string | null | undefined) =>
  `${Math.round(Number(v ?? 0)).toLocaleString("en-US")} MMK`;

function km(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}

const categories = ["mixed_meals", "rice_meals", "noodles", "fast_food", "bbq_grills", "bakery", "desserts_cakes", "cafe_tea", "beverages"] as const;

async function publicVendors(db: Db) {
  const { data, error } = await db
    .from("vendors_public")
    .select("id, legacy_id, name, type, description, address, neighborhood, rating, fulfillment, latitude, longitude")
    .eq("verification_status", "approved");
  if (error) throw new Error(error.message);
  return data ?? [];
}

function customerTools(db: Db, location: { lat: number; lng: number } | null): ToolSet {
  return {
    search_food: tool({
      description:
        "Search currently available surplus food posts (mystery bags) on the marketplace. Use for questions about food, prices, discounts, availability, categories, or food near the customer.",
      inputSchema: z.object({
        query: z.string().nullable().describe("Keyword in the food title/description or vendor name"),
        category: z.enum(categories).nullable(),
        maxPrice: z.number().nullable().describe("Maximum discounted price in MMK"),
        minDiscountPercent: z.number().nullable(),
        nearMe: z.boolean().describe("True when the customer asks for food near them"),
        radiusKm: z.number().nullable().describe("Search radius in km, default 5"),
      }),
      execute: async ({ query, category, maxPrice, minDiscountPercent, nearMe, radiusKm }) => {
        if (nearMe && !location) {
          return { error: "Customer location is not available. Ask them to allow location access on the homepage or browse map." };
        }
        const vendors = await publicVendors(db);
        const vById = new Map(vendors.map((v) => [v.id, v]));
        let q = db
          .from("food_posts")
          .select("id, legacy_id, vendor_id, title, description, category, original_price, discounted_price, quantity_left, available_from, available_until, fulfillment")
          .eq("is_available", true)
          .gt("quantity_left", 0)
          .limit(200);
        if (category) q = q.eq("category", category);
        if (maxPrice != null) q = q.lte("discounted_price", maxPrice);
        const { data, error } = await q;
        if (error) return { error: error.message };
        const term = query?.trim().toLowerCase();
        const radius = radiusKm ?? 5;
        const rows = (data ?? [])
          .map((p) => {
            const v = vById.get(p.vendor_id);
            if (!v) return null;
            const orig = Number(p.original_price);
            const disc = Number(p.discounted_price);
            const pct = orig > 0 ? Math.round((1 - disc / orig) * 100) : 0;
            const distance =
              location && v.latitude != null && v.longitude != null
                ? Math.round(km(location.lat, location.lng, v.latitude, v.longitude) * 10) / 10
                : null;
            return {
              bagId: p.legacy_id ?? p.id,
              food: p.title,
              description: p.description.slice(0, 160),
              category: p.category,
              price: mmk(disc),
              originalPrice: mmk(orig),
              discountPercent: pct,
              quantityLeft: p.quantity_left,
              availableWindow: `${p.available_from.slice(0, 5)}–${p.available_until.slice(0, 5)}`,
              fulfillment: p.fulfillment,
              vendor: v.name,
              vendorType: v.type,
              location: [v.address, v.neighborhood].filter(Boolean).join(", "),
              distanceKm: distance,
              link: `/bag/${p.legacy_id ?? p.id}`,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .filter((r) => !term || `${r.food} ${r.description} ${r.vendor}`.toLowerCase().includes(term))
          .filter((r) => minDiscountPercent == null || r.discountPercent >= minDiscountPercent)
          .filter((r) => !nearMe || (r.distanceKm != null && r.distanceKm <= radius));
        rows.sort((a, b) => (nearMe ? (a.distanceKm ?? 999) - (b.distanceKm ?? 999) : b.discountPercent - a.discountPercent));
        return { count: rows.length, results: rows.slice(0, 12), locationUsed: nearMe ? location : null };
      },
    }),
    list_vendors: tool({
      description: "List approved partner businesses (vendors) with their type, location and rating.",
      inputSchema: z.object({ query: z.string().nullable().describe("Part of the shop name, type or neighborhood") }),
      execute: async ({ query }) => {
        const vendors = await publicVendors(db);
        const term = query?.trim().toLowerCase();
        const rows = vendors
          .filter((v) => !term || `${v.name} ${v.type} ${v.neighborhood} ${v.address}`.toLowerCase().includes(term))
          .map((v) => ({
            name: v.name,
            type: v.type,
            description: (v.description ?? "").slice(0, 160),
            location: [v.address, v.neighborhood].filter(Boolean).join(", "),
            rating: Number(v.rating ?? 0),
            fulfillment: v.fulfillment,
            distanceKm:
              location && v.latitude != null && v.longitude != null
                ? Math.round(km(location.lat, location.lng, v.latitude, v.longitude) * 10) / 10
                : null,
            link: `/business/${v.legacy_id ?? v.id}`,
          }));
        return { count: rows.length, results: rows.slice(0, 20) };
      },
    }),
    my_orders: tool({
      description: "The signed-in customer's own recent orders with status and payment status.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await db
          .from("orders")
          .select("receipt_number, status, payment_status, method, total, placed_at, payment_rejection_reason")
          .order("placed_at", { ascending: false })
          .limit(10);
        if (error) return { error: error.message };
        return { orders: (data ?? []).map((o) => ({ ...o, total: mmk(o.total) })) };
      },
    }),
  };
}

function vendorTools(db: Db, userId: string): ToolSet {
  const myVendor = async () => {
    const { data } = await db
      .from("vendors")
      .select("id, name, display_alias, verification_status, rejection_reason, address, neighborhood, fulfillment, meals_rescued, rating")
      .eq("owner_id", userId)
      .maybeSingle();
    return data;
  };
  return {
    my_store: tool({
      description: "The vendor's own store profile and verification status.",
      inputSchema: z.object({}),
      execute: async () => (await myVendor()) ?? { error: "No store found for this account." },
    }),
    my_food_posts: tool({
      description: "The vendor's own food posts (secret bags), including unavailable ones.",
      inputSchema: z.object({ onlyAvailable: z.boolean() }),
      execute: async ({ onlyAvailable }) => {
        const v = await myVendor();
        if (!v) return { error: "No store found for this account." };
        let q = db
          .from("food_posts")
          .select("title, category, original_price, discounted_price, quantity_left, total_quantity, available_from, available_until, is_available, fulfillment")
          .eq("vendor_id", v.id)
          .order("created_at", { ascending: false })
          .limit(50);
        if (onlyAvailable) q = q.eq("is_available", true);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return {
          posts: (data ?? []).map((p) => ({
            ...p,
            original_price: mmk(p.original_price),
            discounted_price: mmk(p.discounted_price),
          })),
        };
      },
    }),
    my_orders: tool({
      description: "Incoming orders for the vendor's store (only orders with payment not required or verified).",
      inputSchema: z.object({ status: z.string().nullable() }),
      execute: async ({ status }) => {
        const v = await myVendor();
        if (!v) return { error: "No store found for this account." };
        let q = db
          .from("orders")
          .select("receipt_number, status, method, total, pickup_window, placed_at, payment_status")
          .eq("vendor_id", v.id)
          .in("payment_status", ["not_required", "verified"])
          .order("placed_at", { ascending: false })
          .limit(30);
        if (status) q = q.eq("status", status as Database["public"]["Enums"]["order_status"]);
        const { data, error } = await q;
        if (error) return { error: error.message };
        const rows = data ?? [];
        return {
          count: rows.length,
          revenue: mmk(rows.reduce((s, o) => s + Number(o.total), 0)),
          orders: rows.map((o) => ({ ...o, total: mmk(o.total) })),
        };
      },
    }),
  };
}

function adminTools(db: Db): ToolSet {
  return {
    platform_overview: tool({
      description: "Platform-wide totals: users, vendors by status, food posts, orders, revenue, pending payments and ads.",
      inputSchema: z.object({}),
      execute: async () => {
        const [profiles, vendors, posts, orders, ads] = await Promise.all([
          db.from("profiles").select("id", { count: "exact", head: true }),
          db.from("vendors").select("verification_status"),
          db.from("food_posts").select("is_available"),
          db.from("orders").select("total, status, payment_status, placed_at"),
          db.from("advertisements").select("status, cost"),
        ]);
        const count = <T extends Record<string, unknown>>(rows: T[] | null, key: keyof T) =>
          (rows ?? []).reduce<Record<string, number>>((acc, r) => {
            const k = String(r[key]);
            acc[k] = (acc[k] ?? 0) + 1;
            return acc;
          }, {});
        const o = orders.data ?? [];
        const valid = o.filter((x) => x.status !== "cancelled" && x.status !== "rejected");
        return {
          users: profiles.count ?? 0,
          vendorsByStatus: count(vendors.data, "verification_status"),
          foodPosts: { total: posts.data?.length ?? 0, available: (posts.data ?? []).filter((p) => p.is_available).length },
          orders: { total: o.length, byStatus: count(o, "status"), byPaymentStatus: count(o, "payment_status") },
          revenue: mmk(valid.reduce((s, x) => s + Number(x.total), 0)),
          advertisements: count(ads.data, "status"),
          adRevenue: mmk((ads.data ?? []).filter((a) => a.status !== "rejected").reduce((s, a) => s + Number(a.cost ?? 0), 0)),
        };
      },
    }),
    list_vendors_admin: tool({
      description: "All vendors with verification status and contact details (admin only).",
      inputSchema: z.object({ status: z.enum(["pending", "approved", "rejected", "deactivated"]).nullable() }),
      execute: async ({ status }) => {
        let q = db.from("vendors").select("name, type, neighborhood, email, phone, verification_status, created_at").order("created_at", { ascending: false }).limit(50);
        if (status) q = q.eq("verification_status", status);
        const { data, error } = await q;
        return error ? { error: error.message } : { count: data?.length ?? 0, vendors: data };
      },
    }),
    list_users_admin: tool({
      description: "Registered users with their role and account status (admin only).",
      inputSchema: z.object({ query: z.string().nullable() }),
      execute: async ({ query }) => {
        const [p, r] = await Promise.all([
          db.from("profiles").select("id, full_name, email, status, created_at").order("created_at", { ascending: false }).limit(200),
          db.from("user_roles").select("user_id, role"),
        ]);
        if (p.error) return { error: p.error.message };
        const roles = new Map((r.data ?? []).map((x) => [x.user_id, x.role]));
        const term = query?.toLowerCase().trim();
        const users = (p.data ?? [])
          .filter((u) => !term || `${u.full_name} ${u.email}`.toLowerCase().includes(term))
          .map(({ id, ...u }) => ({ ...u, role: roles.get(id) ?? "customer" }));
        return { count: users.length, users: users.slice(0, 30) };
      },
    }),
    recent_orders_admin: tool({
      description: "Recent marketplace orders across all vendors (admin only).",
      inputSchema: z.object({ paymentStatus: z.enum(["not_required", "awaiting_verification", "verified", "rejected"]).nullable() }),
      execute: async ({ paymentStatus }) => {
        let q = db.from("orders").select("receipt_number, status, payment_status, method, total, placed_at, vendor_id").order("placed_at", { ascending: false }).limit(30);
        if (paymentStatus) q = q.eq("payment_status", paymentStatus);
        const [{ data, error }, v] = await Promise.all([q, db.from("vendors").select("id, name")]);
        if (error) return { error: error.message };
        const names = new Map((v.data ?? []).map((x) => [x.id, x.name]));
        return { orders: (data ?? []).map(({ vendor_id, ...o }) => ({ ...o, vendor: names.get(vendor_id) ?? "—", total: mmk(o.total) })) };
      },
    }),
  };
}

export function toolsForRole(role: AssistantRole, db: Db, userId: string, location: { lat: number; lng: number } | null) {
  if (role === "admin") return adminTools(db);
  if (role === "vendor") return vendorTools(db, userId);
  return customerTools(db, location);
}

const PROCESS_GUIDE = `
WEBSITE PROCESSES (Phoe La Min, Myanmar, currency MMK):
- Customers register at /register (name, email, phone, password) or sign in with Google at /login.
- Browsing: homepage shows deals, closing-soon items (within 1 hour of closing), partner businesses; /search shows all food with a map view and list view; /vendors lists partner businesses.
- Buying: one mystery bag per order (no cart). Open a bag, choose quantity, then checkout. Choose pickup or delivery (delivery only when the vendor supports it; saved delivery addresses are managed under Account > Addresses).
- Payment: pickup orders require paying via the MMQR code shown at checkout and uploading a payment screenshot. An admin verifies the screenshot; if rejected, the customer can re-upload from the order page. Delivery orders do not need payment proof.
- Orders: tracked under Account > Orders with a status timeline (pending, confirmed, preparing, ready, picked up / out for delivery / delivered, or cancelled/rejected). The e-receipt shows the vendor phone for pickup orders.
- Vendors register at /vendor/register with shop name, category, phone, email, address/map location, logo, description, business license and FDA approval documents. Admins review; status is shown at /vendor/application-status.
- Approved vendors use the dashboard: Analytics, Orders (only orders whose payment is not required or verified), Secret Bags (create/edit posts: title, category, original & selling price, quantity, batch size, pickup window, fulfillment), Store Profile (logo, description, location, hours) and an "Advertise your store" request (admin sets cost and approves).
- Admins approve/reject vendors, manage users, verify payment screenshots, manage MMQR payment settings, review advertising requests and view analytics.
- Problems can be reported by email to support@phoelamin.com.
`;

export function systemPrompt(role: AssistantRole, name: string, hasLocation: boolean) {
  const scope =
    role === "admin"
      ? "The user is an ADMIN. You may discuss platform management, users, vendors, food posts, orders, payments, sales and revenue using the admin tools."
      : role === "vendor"
        ? "The user is a FOOD VENDOR. Only discuss their own store, their own food posts, their own orders and vendor-related website functions. Never reveal other vendors' sales, orders, customers, platform revenue, user lists or admin information. Vendors do not use the customer marketplace."
        : `The user is a CUSTOMER. Discuss food, prices, discounts, vendors, locations, availability, how to buy, and their own orders. Never reveal other users' data, vendor sales/revenue, vendor contact details beyond what tools return, or admin information. Customer location is ${hasLocation ? "available — use nearMe for 'near me' questions" : "not available — if they ask for nearby food, explain they need to allow location access on the homepage or map"}.`;
  return `You are the Phoe La Min Assistant, a helpful guide for a surplus-food rescue marketplace in Myanmar. You are talking to ${name || "a user"}.
${scope}
RULES:
- Use ONLY information from your tools and the process guide below. Never invent food, prices, vendors, locations, revenue or statistics.
- If data is not available, say clearly that it is not available.
- If the user asks for something their role is not allowed to see, politely refuse without revealing any of it.
- Prices are in MMK. When listing food, show food name, price and original price/discount, vendor, location, distance (if known), pickup window and quantity left, and include a markdown link using the provided link path.
- Be concise and friendly; use short markdown lists.
${PROCESS_GUIDE}`;
}
