import { useEffect, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { businessTypeLabels, storefrontImage } from "@/data/mock";

type AdVendor = {
  id: string;
  name: string;
  type: string;
  tagline: string | null;
  image_url: string | null;
  logo_initials: string | null;
  neighborhood: string | null;
};

export function FeaturedBusinesses() {
  const [vendors, setVendors] = useState<AdVendor[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("advertised_vendors_public" as never)
        .select("id,name,type,tagline,image_url,logo_initials,neighborhood,ad_priority")
        .order("ad_priority", { ascending: false })
        .limit(12);
      if (active && data) setVendors(data as unknown as AdVendor[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (vendors.length < 2) return;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const card = el.firstElementChild as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 320;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, 4000);
    return () => window.clearInterval(id);
  }, [vendors.length]);

  if (vendors.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold">Featured businesses</h2>
        <span className="text-xs text-muted-foreground">Promoted partners</span>
      </div>
      <div
        ref={scrollerRef}
        className="mt-4 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {vendors.map((v) => (
          <article
            key={v.id}
            className="surface-card w-[280px] shrink-0 snap-start overflow-hidden sm:w-[320px]"
          >
            <img
              src={v.image_url || storefrontImage}
              alt={`${v.name} storefront`}
              loading="lazy"
              className="h-36 w-full object-cover"
            />
            <div className="flex items-start gap-3 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                {v.logo_initials || v.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {v.name}
                  <BadgeCheck className="size-4 shrink-0 text-accent" />
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {businessTypeLabels[v.type as keyof typeof businessTypeLabels] ?? v.type}
                  {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                </p>
                {v.tagline ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{v.tagline}</p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
