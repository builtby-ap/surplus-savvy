/** Loads the signed-in user's own vendor store row from Supabase. */
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchMyVendor, type VendorProfile } from "@/lib/vendor-db";

export function useMyVendor() {
  const { user, isLoading: authLoading } = useAuth();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await fetchMyVendor();
    setVendor(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setVendor(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
  }, [authLoading, user, refresh]);

  return { vendor, vendorId: vendor?.id ?? null, loading, refresh, setVendor };
}
