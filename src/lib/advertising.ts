/** Vendor advertising requests (advertisements table). */
import { supabase } from "@/integrations/supabase/client";

export type AdStatus = "pending" | "active" | "rejected" | "expired";

export interface Advertisement {
  id: string;
  vendorId: string;
  requestedStartDate: string;
  requestedEndDate: string;
  startDate: string | null;
  endDate: string | null;
  tagline: string | null;
  imageUrl: string | null;
  cost: number | null;
  status: AdStatus;
  adminNote: string | null;
  createdAt: string;
}

const COLUMNS =
  "id, vendor_id, requested_start_date, requested_end_date, start_date, end_date, tagline, image_url, cost, status, admin_note, created_at";

function mapAd(row: Record<string, unknown>): Advertisement {
  return {
    id: row["id"] as string,
    vendorId: row["vendor_id"] as string,
    requestedStartDate: row["requested_start_date"] as string,
    requestedEndDate: row["requested_end_date"] as string,
    startDate: (row["start_date"] as string) ?? null,
    endDate: (row["end_date"] as string) ?? null,
    tagline: (row["tagline"] as string) ?? null,
    imageUrl: (row["image_url"] as string) ?? null,
    cost: row["cost"] === null || row["cost"] === undefined ? null : Number(row["cost"]),
    status: row["status"] as AdStatus,
    adminNote: (row["admin_note"] as string) ?? null,
    createdAt: row["created_at"] as string,
  };
}

/** Most recent advertisement request for a vendor, or null. */
export async function fetchLatestAdvertisement(
  vendorId: string,
): Promise<Advertisement | null> {
  const { data, error } = await supabase
    .from("advertisements")
    .select(COLUMNS as never)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAd(data as unknown as Record<string, unknown>) : null;
}

export interface AdRequestInput {
  vendorId: string;
  startDate: string;
  endDate: string;
  tagline?: string;
  imageUrl?: string | null;
}

export async function requestAdvertisement(input: AdRequestInput): Promise<Advertisement> {
  const { data, error } = await supabase
    .from("advertisements")
    .insert({
      vendor_id: input.vendorId,
      requested_start_date: input.startDate,
      requested_end_date: input.endDate,
      tagline: input.tagline?.trim() ? input.tagline.trim() : null,
      image_url: input.imageUrl || null,
    } as never)
    .select(COLUMNS as never)
    .single();
  if (error) throw new Error(error.message);
  return mapAd(data as unknown as Record<string, unknown>);
}

/** True when an ad's active window has already passed. */
export function isExpired(ad: Advertisement): boolean {
  if (ad.status === "expired") return true;
  if (ad.status !== "active") return false;
  const end = ad.endDate ?? ad.requestedEndDate;
  return new Date(`${end}T23:59:59`).getTime() < Date.now();
}

/** Vendors may submit a new request unless one is pending or still running. */
export function canRequestAgain(ad: Advertisement | null): boolean {
  if (!ad) return true;
  if (ad.status === "pending") return false;
  if (ad.status === "active") return isExpired(ad);
  return true;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export interface AdminAdvertisement extends Advertisement {
  vendorName: string;
  vendorType: string;
  impressions: number;
  clicks: number;
}

const ADMIN_COLUMNS = `${COLUMNS}, impressions, clicks, vendors ( name, type )`;

const statusRank: Record<AdStatus, number> = {
  pending: 0,
  active: 1,
  rejected: 2,
  expired: 3,
};

/** Every advertisement request with the vendor's real name, pending first. */
export async function fetchAdminAdvertisements(): Promise<AdminAdvertisement[]> {
  const { data, error } = await supabase
    .from("advertisements")
    .select(ADMIN_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const r = row as Record<string, unknown>;
      const vendor = (r["vendors"] ?? {}) as { name?: string; type?: string };
      return {
        ...mapAd(r),
        vendorName: vendor.name ?? "Unknown vendor",
        vendorType: vendor.type ?? "—",
        impressions: Number(r["impressions"] ?? 0),
        clicks: Number(r["clicks"] ?? 0),
      };
    })
    .sort((a, b) => {
      const diff = statusRank[a.status] - statusRank[b.status];
      if (diff !== 0) return diff;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export interface ActivateAdInput {
  id: string;
  vendorId: string;
  startDate: string;
  endDate: string;
  cost: number;
  tagline?: string | null;
}

/** Approve a pending request: set final dates + cost and promote the vendor. */
export async function activateAdvertisement(input: ActivateAdInput): Promise<void> {
  const { data: adRow } = await supabase
    .from("advertisements")
    .select("image_url" as never)
    .eq("id", input.id)
    .maybeSingle();
  const adImage = ((adRow as { image_url?: string | null } | null)?.image_url ?? null) || null;

  const { error } = await supabase
    .from("advertisements")
    .update({
      status: "active",
      start_date: input.startDate,
      end_date: input.endDate,
      cost: input.cost,
      admin_note: null,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);

  const { error: vendorError } = await supabase
    .from("vendors")
    .update({
      is_advertised: true,
      ad_tagline: input.tagline?.trim() ? input.tagline.trim() : null,
      ad_priority: 1,
      ad_image_url: adImage,
    } as never)
    .eq("id", input.vendorId);
  if (vendorError) throw new Error(vendorError.message);
}

export async function rejectAdvertisement(id: string, note?: string): Promise<void> {
  const { error } = await supabase
    .from("advertisements")
    .update({ status: "rejected", admin_note: note?.trim() || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** End a running ad early: mark expired and un-promote the vendor. */
export async function endAdvertisement(id: string, vendorId: string): Promise<void> {
  const { error } = await supabase
    .from("advertisements")
    .update({ status: "expired", end_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) throw new Error(error.message);

  const { error: vendorError } = await supabase
    .from("vendors")
    .update({ is_advertised: false, ad_tagline: null, ad_priority: 0, ad_image_url: null } as never)
    .eq("id", vendorId);
  if (vendorError) throw new Error(vendorError.message);
}
