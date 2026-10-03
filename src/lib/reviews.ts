/** Supabase-backed customer reviews. RLS + triggers enforce eligibility and moderation. */
import { supabase } from "@/integrations/supabase/client";
import { fileToStoredImage } from "@/lib/image-upload";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any };

export type ReviewStatus = "published" | "reported" | "hidden" | "removed";

export interface Review {
  id: string;
  customerId: string;
  vendorId: string;
  vendorName?: string;
  orderId: string;
  overall: number;
  foodQuality: number | null;
  value: number | null;
  portion: number | null;
  text: string;
  reviewerName: string;
  bagTitle: string | null;
  status: ReviewStatus;
  createdAt: string;
  photos: string[];
  helpfulBy: string[];
  reports: { reason: string; description: string | null; createdAt: string }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
const COLS =
  "id, customer_id, vendor_id, order_id, overall_rating, food_quality_rating, value_rating, portion_rating, review_text, reviewer_name, bag_title, status, created_at, review_photos(image_url), review_helpful(customer_id)";

function toReview(r: Row): Review {
  const n = (v: unknown) => (v == null ? null : Number(v));
  return {
    id: String(r.id),
    customerId: String(r.customer_id),
    vendorId: String(r.vendor_id),
    vendorName: (r.vendors as Row | null)?.name as string | undefined,
    orderId: String(r.order_id),
    overall: Number(r.overall_rating),
    foodQuality: n(r.food_quality_rating),
    value: n(r.value_rating),
    portion: n(r.portion_rating),
    text: String(r.review_text ?? ""),
    reviewerName: String(r.reviewer_name ?? "Food rescuer"),
    bagTitle: (r.bag_title as string) ?? null,
    status: r.status as ReviewStatus,
    createdAt: String(r.created_at),
    photos: ((r.review_photos as Row[]) ?? []).map((p) => String(p.image_url)),
    helpfulBy: ((r.review_helpful as Row[]) ?? []).map((h) => String(h.customer_id)),
    reports: ((r.review_reports as Row[]) ?? []).map((x) => ({
      reason: String(x.reason),
      description: (x.description as string) ?? null,
      createdAt: String(x.created_at),
    })),
  };
}

export async function fetchVendorReviews(vendorId: string): Promise<Review[]> {
  const { data, error } = await db
    .from("reviews")
    .select(COLS)
    .eq("vendor_id", vendorId)
    .in("status", ["published", "reported"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(toReview);
}

/** Summary from published reviews only. */
export function summarize(reviews: Review[]) {
  const pub = reviews.filter((r) => r.status === "published");
  const counts = [0, 0, 0, 0, 0];
  pub.forEach((r) => { counts[r.overall - 1] = (counts[r.overall - 1] ?? 0) + 1; });
  const avg = pub.length ? pub.reduce((s, r) => s + r.overall, 0) / pub.length : 0;
  return { count: pub.length, average: avg, counts };
}

export interface EligibleOrder {
  id: string;
  receiptNumber: string;
  placedAt: string;
  reviewed: boolean;
}

/** The signed-in customer's completed orders from this vendor. */
export async function fetchEligibleOrders(vendorId: string, userId: string): Promise<EligibleOrder[]> {
  const [{ data: orders }, { data: mine }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, receipt_number, placed_at")
      .eq("customer_id", userId)
      .eq("vendor_id", vendorId)
      .in("status", ["picked_up", "delivered"])
      .order("placed_at", { ascending: false }),
    db.from("reviews").select("order_id").eq("customer_id", userId).eq("vendor_id", vendorId),
  ]);
  const reviewed = new Set(((mine ?? []) as Row[]).map((r) => String(r.order_id)));
  return (orders ?? []).map((o) => ({
    id: o.id,
    receiptNumber: o.receipt_number,
    placedAt: o.placed_at,
    reviewed: reviewed.has(o.id),
  }));
}

export async function submitReview(input: {
  vendorId: string;
  orderId: string;
  overall: number;
  foodQuality: number | null;
  value: number | null;
  portion: number | null;
  text: string;
  photos: File[];
}) {
  const { data, error } = await db
    .from("reviews")
    .insert({
      vendor_id: input.vendorId,
      order_id: input.orderId,
      overall_rating: input.overall,
      food_quality_rating: input.foodQuality,
      value_rating: input.value,
      portion_rating: input.portion,
      review_text: input.text.trim(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const reviewId = String((data as Row).id);
  for (const file of input.photos.slice(0, 3)) {
    const url = await fileToStoredImage(file, 900, 0.72);
    await db.from("review_photos").insert({ review_id: reviewId, image_url: url });
  }
  return reviewId;
}

export async function toggleHelpful(reviewId: string, userId: string, on: boolean) {
  const q = on
    ? db.from("review_helpful").insert({ review_id: reviewId, customer_id: userId })
    : db.from("review_helpful").delete().eq("review_id", reviewId).eq("customer_id", userId);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

export async function reportReview(reviewId: string, userId: string, reason: string, description: string) {
  const { error } = await db
    .from("review_reports")
    .insert({ review_id: reviewId, customer_id: userId, reason, description: description || null });
  if (error) throw new Error(error.message.includes("duplicate") ? "You already reported this review." : error.message);
}

/* ---------- Admin ---------- */

export async function fetchAllReviews(): Promise<Review[]> {
  const { data, error } = await db
    .from("reviews")
    .select(`${COLS}, vendors(name), review_reports(reason, description, created_at)`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(toReview);
}

export async function setReviewStatus(reviewId: string, status: ReviewStatus) {
  const { error } = await db.from("reviews").update({ status }).eq("id", reviewId);
  if (error) throw new Error(error.message);
  if (status !== "reported") {
    await db
      .from("review_reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("review_id", reviewId)
      .eq("status", "open");
  }
}
