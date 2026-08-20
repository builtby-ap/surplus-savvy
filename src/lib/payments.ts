/**
 * MMQR payment support for pickup orders.
 *
 * Pickup orders are prepaid: the customer scans the platform's MMQR code and
 * uploads a screenshot of the completed transfer, which the vendor verifies.
 * Delivery orders stay cash-on-delivery and never touch any of this.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentStatus = "not_required" | "awaiting_verification" | "verified" | "rejected";

export interface PaymentSettings {
  qrImageUrl: string;
  accountName: string;
  instructions: string;
}

export const PAYMENT_BUCKET = "payment-screenshots";

/** The platform's single MMQR settings row. */
export async function fetchPaymentSettings(): Promise<PaymentSettings | null> {
  const { data, error } = await supabase
    .from("payment_settings")
    .select("qr_image_url, account_name, instructions")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    qrImageUrl: String(row['qr_image_url'] ?? ""),
    accountName: String(row['account_name'] ?? ""),
    instructions: String(row['instructions'] ?? ""),
  };
}

export function usePaymentSettings(enabled = true) {
  const [settings, setSettings] = useState<PaymentSettings | null | undefined>(undefined);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetchPaymentSettings()
      .then((s) => alive && setSettings(s))
      .catch(() => alive && setSettings(null));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return settings;
}

/** Uploads to `{userId}/{unique}.ext` in the private bucket, returns the path. */
export async function uploadPaymentScreenshot(file: File, userId: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const unique =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${userId}/${unique}.${ext || "jpg"}`;
  const { error } = await supabase.storage
    .from(PAYMENT_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/** Signed link so a private screenshot can be previewed. */
export async function signedScreenshotUrl(path: string, seconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PAYMENT_BUCKET)
    .createSignedUrl(path, seconds);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Re-submits a rejected payment; the DB function re-opens verification. */
export async function resubmitPayment(orderId: string, screenshotUrl: string) {
  const { error } = await supabase.rpc("resubmit_payment" as never, {
    order_id: orderId,
    screenshot_url: screenshotUrl,
  } as never);
  if (error) throw new Error(error.message);
}
