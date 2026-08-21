import { createServerFn } from "@tanstack/react-start";

export const getVerifiedVendorCount = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("vendors")
      .select("*", { count: "exact", head: true })
      .eq("verified", true);
    if (error) throw error;
    return count ?? 0;
  },
);
