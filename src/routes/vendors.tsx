import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Store } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { businessTypeLabels, storefrontImage } from "@/data/mock";
import { safeImage } from "@/lib/image-upload";

export const Route = createFileRoute("/vendors")({
  head: () => ({ meta: [
    { title: "All Partner Businesses — Phoe La Min" },
    { name: "description", content: "Browse every partner restaurant and food maker on Phoe La Min and search by shop name." },
    { property: "og:title", content: "All Partner Businesses — Phoe La Min" },
    { property: "og:description", content: "Browse every partner restaurant and food maker on Phoe La Min and search by shop name." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: VendorsPage,
});

interface VendorRow {
  id: string;
  legacy_id: string | null;
  name: string | null;
  type: string | null;
  neighborhood: string | null;
  rating: number | null;
  image_url: string | null;
}

function VendorsPage() {
  const [query, setQuery] = useState("");
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-listing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors_public")
        .select("id,legacy_id,name,type,neighborhood,rating,image_url")
        .eq("verification_status", "approved");
      if (error) throw error;
      return (data ?? []) as unknown as VendorRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => (v.name ?? "").toLowerCase().includes(q));
  }, [vendors, query]);

  return <PublicLayout>
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-10">
      <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">All Partner Businesses</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every restaurant and food maker sharing surplus food on Phoe La Min</p>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by shop name"
          aria-label="Search businesses by shop name"
          className="rounded-full pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 rounded-lg border border-border bg-card px-5 py-8 text-sm text-muted-foreground">
          {query.trim() ? `No businesses match “${query.trim()}”. Try another name.` : "No partner businesses yet. Check back soon."}
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-4 gap-x-2 gap-y-6 sm:grid-cols-8 sm:gap-x-3">
          {filtered.map((vendor) => (
            <Link
              key={vendor.id}
              to="/business/$businessId"
              params={{ businessId: vendor.legacy_id ?? vendor.id }}
              className="group min-w-0 text-center"
            >
              <span className="mx-auto block aspect-square max-w-24 overflow-hidden rounded-full border-2 border-border bg-secondary transition-colors group-hover:border-primary">
                {vendor.image_url ? (
                  <img
                    src={safeImage(vendor.image_url, storefrontImage)}
                    alt={vendor.name ?? ""}
                    loading="lazy"
                    onError={(event) => {
                      const fallback = storefrontImage;
                      if (event.currentTarget.src !== new URL(fallback, window.location.href).href) event.currentTarget.src = fallback;
                    }}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-lg font-semibold text-muted-foreground"><Store className="size-6" /></span>
                )}
              </span>
              <span className="mt-2 block text-xs font-semibold leading-snug text-foreground sm:text-sm">{vendor.name ?? "Mystery Vendor"}</span>
              {vendor.type ? <span className="mt-0.5 block text-[11px] text-muted-foreground">{businessTypeLabels[vendor.type as keyof typeof businessTypeLabels] ?? vendor.type}</span> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  </PublicLayout>;
}
