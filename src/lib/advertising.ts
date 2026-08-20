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
  cost: number | null;
  status: AdStatus;
  adminNote: string | null;
  createdAt: string;
}

const COLUMNS =
  "id, vendor_id, requested_start_date, requested_end_date, start_date, end_date, tagline, cost, status, admin_note, created_at";

function mapAd(row: Record<string, unknown>): Advertisement {
  return {
    id: row["id"] as string,
    vendorId: row["vendor_id"] as string,
    requestedStartDate: row["requested_start_date"] as string,
    requestedEndDate: row["requested_end_date"] as string,
    startDate: (row["start_date"] as string) ?? null,
    endDate: (row["end_date"] as string) ?? null,
    tagline: (row["tagline"] as string) ?? null,
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
    .select(COLUMNS)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAd(data as Record<string, unknown>) : null;
}

export interface AdRequestInput {
  vendorId: string;
  startDate: string;
  endDate: string;
  tagline?: string;
}

export async function requestAdvertisement(input: AdRequestInput): Promise<Advertisement> {
  const { data, error } = await supabase
    .from("advertisements")
    .insert({
      vendor_id: input.vendorId,
      requested_start_date: input.startDate,
      requested_end_date: input.endDate,
      tagline: input.tagline?.trim() ? input.tagline.trim() : null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapAd(data as Record<string, unknown>);
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
