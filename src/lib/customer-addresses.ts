/**
 * Supabase-backed customer delivery address book.
 * Source of truth is the `customer_addresses` table (RLS scopes rows to auth.uid()).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  township: string;
  city: string;
  buildingFloor: string;
  deliveryNote: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export type CustomerAddressInput = Omit<CustomerAddress, "id">;

export const addressLabels = ["Home", "Work", "Other"] as const;

export const emptyAddress: CustomerAddressInput = {
  label: "Home",
  recipientName: "",
  phone: "",
  addressLine: "",
  township: "",
  city: "Yangon",
  buildingFloor: "",
  deliveryNote: "",
  latitude: null,
  longitude: null,
  isDefault: false,
};

const COLUMNS =
  "id, label, recipient_name, phone, address_line, township, city, building_floor, delivery_note, latitude, longitude, is_default";

type Row = Record<string, unknown>;

function toAddress(row: Row): CustomerAddress {
  const s = (v: unknown) => (v == null ? "" : String(v));
  return {
    id: s(row["id"]),
    label: s(row["label"]) || "Home",
    recipientName: s(row["recipient_name"]),
    phone: s(row["phone"]),
    addressLine: s(row["address_line"]),
    township: s(row["township"]),
    city: s(row["city"]),
    buildingFloor: s(row["building_floor"]),
    deliveryNote: s(row["delivery_note"]),
    latitude: row["latitude"] == null ? null : Number(row["latitude"]),
    longitude: row["longitude"] == null ? null : Number(row["longitude"]),
    isDefault: Boolean(row["is_default"]),
  };
}

function toRow(input: CustomerAddressInput) {
  return {
    label: input.label,
    recipient_name: input.recipientName.trim(),
    phone: input.phone.trim(),
    address_line: input.addressLine.trim(),
    township: input.township.trim(),
    city: input.city.trim(),
    building_floor: input.buildingFloor.trim() || null,
    delivery_note: input.deliveryNote.trim() || null,
    latitude: input.latitude,
    longitude: input.longitude,
    is_default: input.isDefault,
  };
}

export function formatAddress(a: {
  addressLine: string;
  buildingFloor?: string;
  township: string;
  city: string;
}) {
  return [a.buildingFloor, a.addressLine, a.township, a.city]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

/** Required-field check used by both checkout and the address book. */
export function validateAddress(input: CustomerAddressInput): string | null {
  if (!input.recipientName.trim()) return "Recipient name is required.";
  if (!input.phone.trim()) return "Phone number is required.";
  if (!input.addressLine.trim()) return "Address is required.";
  if (!input.township.trim()) return "Township is required.";
  if (!input.city.trim()) return "City is required.";
  return null;
}

export async function fetchMyAddresses(): Promise<CustomerAddress[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("customer_addresses")
    .select(COLUMNS)
    .eq("customer_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => toAddress(r as Row));
}

export async function createAddress(input: CustomerAddressInput): Promise<CustomerAddress> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Please sign in to save an address.");
  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({ ...toRow(input), customer_id: userId } as never)
    .select(COLUMNS)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not save address.");
  return toAddress(data as Row);
}

export async function updateAddress(
  id: string,
  input: CustomerAddressInput,
): Promise<CustomerAddress> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .update(toRow(input) as never)
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not update address.");
  return toAddress(data as Row);
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** DB trigger clears the previous default automatically. */
export async function makeDefaultAddress(id: string): Promise<void> {
  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function useMyAddresses(enabled: boolean) {
  const [addresses, setAddresses] = useState<CustomerAddress[] | undefined>(undefined);

  const reload = useCallback(async () => {
    if (!enabled) {
      setAddresses([]);
      return [] as CustomerAddress[];
    }
    try {
      const rows = await fetchMyAddresses();
      setAddresses(rows);
      return rows;
    } catch {
      setAddresses([]);
      return [] as CustomerAddress[];
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { addresses, reload };
}
