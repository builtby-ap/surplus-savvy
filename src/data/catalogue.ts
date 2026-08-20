/**
 * Hydrates the marketplace catalogue from Supabase into the existing
 * `businesses` / `mysteryBags` arrays, so every page keeps working
 * unchanged while the data now comes from the database.
 */
import { supabase } from "@/integrations/supabase/client";
import { safeImage } from "@/lib/image-upload";
import {
  businesses,
  mysteryBags,
  categoryImages,
  storefrontImage,
  type BagCategory,
  type Business,
  type BusinessType,
  type FulfillmentType,
  type MysteryBag,
} from "./mock";

let lastSignature = "";

/** legacy_id (or uuid) -> database uuid, so writes can target real rows. */
export const vendorUuidById = new Map<string, string>();
export const postUuidById = new Map<string, string>();

/** First emoji of the alias, used in place of a real logo. */
function aliasBadge(alias: string) {
  const first = Array.from(alias)[0] ?? "";
  return /[\p{Emoji}]/u.test(first) ? first : "?";
}

function hhmm(value: string) {
  return value.slice(0, 5);
}

/**
 * Refetches vendors + food posts from Supabase. Returns true when the data
 * actually changed, so callers can re-render the marketplace.
 */
export async function loadCatalogue(): Promise<boolean> {
  try {
    const [vendorRes, postRes] = await Promise.all([
      supabase
        .from("vendors_public")
        .select(
          "id, legacy_id, display_alias, type, description, address, neighborhood, rating, review_count, fulfillment, meals_rescued, verified, latitude, longitude",
        )
        .eq("verification_status", "approved"),
      supabase
        .from("food_posts")
        .select(
          "id, legacy_id, vendor_id, title, description, category, original_price, discounted_price, quantity_left, total_quantity, available_from, available_until, fulfillment, image_url, rating",
        )
        .eq("is_available", true),
    ]);

    const vendorRows = vendorRes.data ?? [];
    const postRows = postRes.data ?? [];
    if (vendorRows.length === 0) return false;

    const idByUuid = new Map<string, string>();
    const nextBusinesses: Business[] = vendorRows.map((v) => {
      const uuid = String(v.id ?? "");
      const id = v.legacy_id ?? uuid;
      idByUuid.set(uuid, id);
      vendorUuidById.set(id, uuid);
      return {
        id,
        name: v.display_alias ?? "Mystery Vendor",
        type: v.type as BusinessType,
        description: v.description ?? "",
        address: v.address ?? "",
        neighborhood: v.neighborhood ?? "",
        rating: Number(v.rating ?? 0),
        reviewCount: v.review_count ?? 0,
        image: storefrontImage,
        logoInitials: aliasBadge(v.display_alias ?? ""),
        fulfillment: (v.fulfillment ?? "pickup") as FulfillmentType,
        mealsRescued: v.meals_rescued ?? 0,
        verified: Boolean(v.verified),
        lat: v.latitude ?? 0,
        lng: v.longitude ?? 0,
      };
    });

    const nextBags: MysteryBag[] = postRows
      .filter((p) => idByUuid.has(p.vendor_id))
      .map((p) => {
        const category = p.category as BagCategory;
        const postId = p.legacy_id ?? p.id;
        postUuidById.set(postId, p.id);
        return {
          id: postId,
          businessId: idByUuid.get(p.vendor_id) as string,
          title: p.title,
          category,
          description: p.description,
          originalPrice: Number(p.original_price),
          discountedPrice: Number(p.discounted_price),
          quantityLeft: p.quantity_left,
          totalQuantity: p.total_quantity,
          availableFrom: hhmm(p.available_from),
          availableUntil: hhmm(p.available_until),
          fulfillment: p.fulfillment as FulfillmentType,
          image: safeImage(p.image_url, categoryImages[category] ?? storefrontImage),
          rating: Number(p.rating ?? 0),
        };
      });

    businesses.splice(0, businesses.length, ...nextBusinesses);
    mysteryBags.splice(0, mysteryBags.length, ...nextBags);

    const signature = JSON.stringify([nextBusinesses, nextBags]);
    const changed = signature !== lastSignature;
    lastSignature = signature;
    return changed;
  } catch {
    return false;
  }
}
