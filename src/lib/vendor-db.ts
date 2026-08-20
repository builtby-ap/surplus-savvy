/**
 * Supabase-backed vendor dashboard data access.
 *
 * Everything here is scoped to the signed-in vendor's own store through the
 * vendors / food_posts / orders row-level security policies.
 */
import { supabase } from "@/integrations/supabase/client";
import { safeImage } from "@/lib/image-upload";
import type { BagCategory, FulfillmentType } from "@/data/mock";
import { categoryImages } from "@/data/mock";
import type { OrderMethod } from "@/lib/orders";
import type { OrderStatus } from "@/lib/order-status";

/* ---------------------------------------------------------------- vendor */

export interface VendorProfile {
  id: string;
  name: string;
  displayAlias: string;
  type: string;
  description: string;
  address: string;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  logoInitials: string;
  imageUrl: string;
  fulfillment: FulfillmentType;
  deliveryFee: number;
  deliveryMinimum: number;
  verificationStatus: string;
  rejectionReason: string | null;
}

const VENDOR_COLUMNS =
  "id, name, display_alias, type, description, address, neighborhood, city, latitude, longitude, phone, email, logo_initials, image_url, fulfillment, delivery_fee, delivery_minimum, verification_status, rejection_reason";

type VendorRow = Record<string, unknown>;

function toProfile(row: VendorRow): VendorProfile {
  const n = (v: unknown) => Number(v ?? 0);
  const s = (v: unknown) => (v == null ? "" : String(v));
  return {
    id: s(row['id']),
    name: s(row['name']),
    displayAlias: s(row['display_alias']),
    type: s(row['type']),
    description: s(row['description']),
    address: s(row['address']),
    neighborhood: s(row['neighborhood']),
    city: s(row['city']),
    latitude: n(row['latitude']),
    longitude: n(row['longitude']),
    phone: s(row['phone']),
    email: s(row['email']),
    logoInitials: s(row['logo_initials']),
    imageUrl: s(row['image_url']),
    fulfillment: (s(row['fulfillment']) || "pickup") as FulfillmentType,
    deliveryFee: n(row['delivery_fee']),
    deliveryMinimum: n(row['delivery_minimum']),
    verificationStatus: s(row['verification_status']),
    rejectionReason: row['rejection_reason'] ? String(row['rejection_reason']) : null,
  };
}

/** The vendors row owned by the signed-in user, if any. */
export async function fetchMyVendor(): Promise<VendorProfile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const ownerId = auth.user?.id;
  if (!ownerId) return null;
  const { data, error } = await supabase
    .from("vendors")
    .select(VENDOR_COLUMNS)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error || !data) return null;
  return toProfile(data as VendorRow);
}

export type VendorProfileInput = Partial<
  Pick<
    VendorProfile,
    | "name"
    | "type"
    | "description"
    | "address"
    | "neighborhood"
    | "city"
    | "latitude"
    | "longitude"
    | "phone"
    | "email"
    | "fulfillment"
    | "deliveryFee"
    | "deliveryMinimum"
    | "imageUrl"
  >
>;

function profilePatch(input: VendorProfileInput) {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch['name'] = input.name;
  if (input.type !== undefined) patch['type'] = input.type;
  if (input.description !== undefined) patch['description'] = input.description;
  if (input.address !== undefined) patch['address'] = input.address;
  if (input.neighborhood !== undefined) patch['neighborhood'] = input.neighborhood;
  if (input.city !== undefined) patch['city'] = input.city;
  if (input.latitude !== undefined) patch['latitude'] = input.latitude;
  if (input.longitude !== undefined) patch['longitude'] = input.longitude;
  if (input.phone !== undefined) patch['phone'] = input.phone;
  if (input.email !== undefined) patch['email'] = input.email;
  if (input.fulfillment !== undefined) patch['fulfillment'] = input.fulfillment;
  if (input.deliveryFee !== undefined) patch['delivery_fee'] = input.deliveryFee;
  if (input.deliveryMinimum !== undefined) patch['delivery_minimum'] = input.deliveryMinimum;
  if (input.imageUrl !== undefined) patch['image_url'] = input.imageUrl;
  return patch;
}

/** Updates the signed-in vendor's own store row (RLS enforces ownership). */
export async function updateMyVendor(
  vendorId: string,
  input: VendorProfileInput,
): Promise<VendorProfile> {
  const { data, error } = await supabase
    .from("vendors")
    .update(profilePatch(input) as never)
    .eq("id", vendorId)
    .select(VENDOR_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toProfile(data as VendorRow);
}

/** Creates the vendors row for the current user; always starts as pending. */
export async function createMyVendor(
  input: VendorProfileInput & { name: string },
): Promise<VendorProfile> {
  const { data: auth } = await supabase.auth.getUser();
  const ownerId = auth.user?.id;
  if (!ownerId) throw new Error("You need to be signed in.");
  const initials = input.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      owner_id: ownerId,
      logo_initials: initials,
      verification_status: "pending",
      ...profilePatch(input),
    } as never)
    .select(VENDOR_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toProfile(data as VendorRow);
}

/* ----------------------------------------------------------- food posts */

export interface VendorPost {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: BagCategory;
  originalPrice: number;
  discountedPrice: number;
  quantityLeft: number;
  totalQuantity: number;
  image: string;
  availableFrom: string;
  availableUntil: string;
  fulfillment: FulfillmentType;
  pickupInstructions: string;
  isAvailable: boolean;
}

export type VendorPostInput = Omit<VendorPost, "id" | "vendorId">;

const POST_COLUMNS =
  "id, vendor_id, title, description, category, original_price, discounted_price, quantity_left, total_quantity, image_url, available_from, available_until, fulfillment, pickup_instructions, is_available, created_at";

const hhmm = (v: string) => (v ?? "").slice(0, 5);

function toPost(row: VendorRow): VendorPost {
  const category = String(row['category'] ?? "mixed_meals") as BagCategory;
  return {
    id: String(row['id']),
    vendorId: String(row['vendor_id']),
    title: String(row['title'] ?? ""),
    description: String(row['description'] ?? ""),
    category,
    originalPrice: Number(row['original_price'] ?? 0),
    discountedPrice: Number(row['discounted_price'] ?? 0),
    quantityLeft: Number(row['quantity_left'] ?? 0),
    totalQuantity: Number(row['total_quantity'] ?? 0),
    image: safeImage(row['image_url'] as string | null, categoryImages[category]),
    availableFrom: hhmm(String(row['available_from'] ?? "17:00")),
    availableUntil: hhmm(String(row['available_until'] ?? "19:00")),
    fulfillment: String(row['fulfillment'] ?? "pickup") as FulfillmentType,
    pickupInstructions: String(row['pickup_instructions'] ?? ""),
    isAvailable: Boolean(row['is_available']),
  };
}

function postPatch(input: VendorPostInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    original_price: input.originalPrice,
    discounted_price: input.discountedPrice,
    quantity_left: input.quantityLeft,
    total_quantity: input.totalQuantity,
    image_url: safeImage(input.image, categoryImages[input.category]),
    available_from: `${input.availableFrom}:00`,
    available_until: `${input.availableUntil}:00`,
    fulfillment: input.fulfillment,
    pickup_instructions: input.pickupInstructions,
    is_available: input.isAvailable,
  };
}

export async function fetchVendorPosts(vendorId: string): Promise<VendorPost[]> {
  const { data, error } = await supabase
    .from("food_posts")
    .select(POST_COLUMNS)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toPost(row as VendorRow));
}

export async function createVendorPost(vendorId: string, input: VendorPostInput) {
  const { error } = await supabase
    .from("food_posts")
    .insert({ vendor_id: vendorId, ...postPatch(input) } as never);
  if (error) throw new Error(error.message);
}

export async function updateVendorPost(id: string, input: VendorPostInput) {
  const { error } = await supabase
    .from("food_posts")
    .update(postPatch(input) as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteVendorPost(id: string) {
  const { error } = await supabase.from("food_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setVendorPostAvailability(id: string, isAvailable: boolean) {
  const { error } = await supabase
    .from("food_posts")
    .update({ is_available: isAvailable } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export const emptyVendorPost = (): VendorPostInput => ({
  title: "",
  description: "",
  category: "mixed_meals",
  originalPrice: 0,
  discountedPrice: 0,
  quantityLeft: 1,
  totalQuantity: 1,
  image: categoryImages.mixed_meals,
  availableFrom: "17:00",
  availableUntil: "19:00",
  fulfillment: "both",
  pickupInstructions: "",
  isAvailable: true,
});

/* --------------------------------------------------------------- orders */

export interface VendorOrderItem {
  id: string;
  foodPostId: string | null;
  title: string;
  quantity: number;
  originalPrice: number;
  unitPrice: number;
}

export interface VendorOrder {
  id: string;
  receiptNumber: string;
  method: OrderMethod;
  status: OrderStatus;
  notes: string;
  deliveryAddress: string | null;
  pickupWindow: string | null;
  itemPrice: number;
  deliveryFee: number;
  total: number;
  placedAt: string;
  items: VendorOrderItem[];
}

/** DB enum value -> app status. */
export function fromDbStatus(value: string): OrderStatus {
  switch (value) {
    case "picked_up":
      return "picked-up";
    case "out_for_delivery":
      return "out-for-delivery";
    case "rejected":
      return "cancelled";
    default:
      return value as OrderStatus;
  }
}

/** App status -> DB enum value. */
export function toDbStatus(status: OrderStatus): string {
  switch (status) {
    case "picked-up":
      return "picked_up";
    case "out-for-delivery":
      return "out_for_delivery";
    case "refunded":
      return "cancelled";
    default:
      return status;
  }
}

export async function fetchVendorOrders(vendorId: string): Promise<VendorOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, receipt_number, method, status, notes, delivery_address, pickup_window, item_price, delivery_fee, total, placed_at, payment_status, order_items(id, food_post_id, title, quantity, original_price, unit_price)",
    )
    .eq("vendor_id", vendorId)
    .in("payment_status", ["not_required", "verified"])
    .order("placed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const r = row as VendorRow;
    const items = (r['order_items'] as VendorRow[] | null) ?? [];
    return {
      id: String(r['id']),
      receiptNumber: String(r['receipt_number'] ?? ""),
      method: String(r['method'] ?? "pickup") as OrderMethod,
      status: fromDbStatus(String(r['status'] ?? "pending")),
      notes: String(r['notes'] ?? ""),
      deliveryAddress: (r['delivery_address'] as string) ?? null,
      pickupWindow: (r['pickup_window'] as string) ?? null,
      itemPrice: Number(r['item_price'] ?? 0),
      deliveryFee: Number(r['delivery_fee'] ?? 0),
      total: Number(r['total'] ?? 0),
      placedAt: String(r['placed_at'] ?? new Date().toISOString()),
      items: items.map((i) => ({
        id: String(i['id']),
        foodPostId: (i['food_post_id'] as string) ?? null,
        title: String(i['title'] ?? ""),
        quantity: Number(i['quantity'] ?? 1),
        originalPrice: Number(i['original_price'] ?? 0),
        unitPrice: Number(i['unit_price'] ?? 0),
      })),
    } satisfies VendorOrder;
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus | "rejected") {
  const value = status === "rejected" ? "rejected" : toDbStatus(status);
  const { error } = await supabase
    .from("orders")
    .update({ status: value } as never)
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}
