/** Vendor-managed food posts, persisted in localStorage and seeded from mock data. */
import {
  categoryImages,
  mysteryBags,
  type BagCategory,
  type FulfillmentType,
} from "@/data/mock";

export interface VendorPost {
  id: string;
  businessId: string;
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

export type VendorPostInput = Omit<VendorPost, "id" | "businessId">;

const KEY_PREFIX = "phoeLaMin_vendor_posts_";
const isBrowser = () => typeof window !== "undefined";
const keyFor = (businessId: string) => `${KEY_PREFIX}${businessId}`;

/** HH:MM extracted from the mock ISO timestamps. */
function toTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "18:00"
    : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function seed(businessId: string): VendorPost[] {
  return mysteryBags
    .filter((bag) => bag.businessId === businessId)
    .map((bag) => ({
      id: bag.id,
      businessId: bag.businessId,
      title: bag.title,
      description: bag.description,
      category: bag.category,
      originalPrice: bag.originalPrice,
      discountedPrice: bag.discountedPrice,
      quantityLeft: bag.quantityLeft,
      totalQuantity: bag.totalQuantity,
      image: bag.image,
      availableFrom: toTime(bag.availableFrom),
      availableUntil: toTime(bag.availableUntil),
      fulfillment: bag.fulfillment,
      pickupInstructions: "Come to the counter and give your receipt number to a staff member.",
      isAvailable: bag.quantityLeft > 0,
    }));
}

function persist(businessId: string, posts: VendorPost[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(keyFor(businessId), JSON.stringify(posts));
}

export function listVendorPosts(businessId: string): VendorPost[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(keyFor(businessId));
    if (raw) return JSON.parse(raw) as VendorPost[];
  } catch {
    /* fall through to seeding */
  }
  const seeded = seed(businessId);
  persist(businessId, seeded);
  return seeded;
}

export function saveVendorPost(
  businessId: string,
  input: VendorPostInput,
  id?: string,
): VendorPost[] {
  const posts = listVendorPosts(businessId);
  const next = id
    ? posts.map((p) => (p.id === id ? { ...p, ...input } : p))
    : [
        {
          ...input,
          id: `vp-${Date.now()}`,
          businessId,
          image: input.image || categoryImages[input.category],
        },
        ...posts,
      ];
  persist(businessId, next);
  return next;
}

export function deleteVendorPost(businessId: string, id: string): VendorPost[] {
  const next = listVendorPosts(businessId).filter((p) => p.id !== id);
  persist(businessId, next);
  return next;
}

export function toggleVendorPost(businessId: string, id: string, isAvailable: boolean) {
  const next = listVendorPosts(businessId).map((p) => (p.id === id ? { ...p, isAvailable } : p));
  persist(businessId, next);
  return next;
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
