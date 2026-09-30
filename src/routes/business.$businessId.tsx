import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Bike, MapPin, ShoppingBag, Star } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { BagCard } from "@/components/bag-card";
import { Button } from "@/components/ui/button";
import { businessTypeLabels, categoryImages, getBusiness, storefrontImage, type BagCategory, type FulfillmentType, type MysteryBag } from "@/data/mock";
import { vendorUuidById } from "@/data/catalogue";
import { safeImage } from "@/lib/image-upload";
import { supabase } from "@/integrations/supabase/client";

type ProfilePost = { bag: MysteryBag; isAvailable: boolean };

export const Route = createFileRoute("/business/$businessId")({
  head: () => ({
    meta: [
      { title: "Business profile — Phoe La Min" },
      { name: "description", content: "See a local food business, its story, ratings and the surplus bags it has available today." },
      { property: "og:title", content: "Business profile — Phoe La Min" },
      { property: "og:description", content: "See a local food business, its story, ratings and the surplus bags it has available today." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessProfile,
});

function BusinessProfile() {
  const { businessId } = useParams({ from: "/business/$businessId" });
  const business = getBusiness(businessId);
  const vendorId = vendorUuidById.get(businessId);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!vendorId) return;
    let active = true;
    setLoading(true);
    setError(false);
    void supabase.from("food_posts")
      .select("id,legacy_id,vendor_id,title,description,category,original_price,discounted_price,quantity_left,total_quantity,available_from,available_until,fulfillment,image_url,rating,is_available")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError(true);
        } else {
          setPosts((data ?? []).map((row) => {
            const category = row.category as BagCategory;
            return {
              isAvailable: Boolean(row.is_available),
              bag: {
                id: row.legacy_id ?? row.id,
                businessId,
                title: row.title,
                description: row.description,
                category,
                originalPrice: Number(row.original_price),
                discountedPrice: Number(row.discounted_price),
                quantityLeft: row.quantity_left,
                totalQuantity: row.total_quantity,
                availableFrom: row.available_from.slice(0, 5),
                availableUntil: row.available_until.slice(0, 5),
                fulfillment: row.fulfillment as FulfillmentType,
                image: safeImage(row.image_url, categoryImages[category] ?? storefrontImage),
                rating: Number(row.rating ?? 0),
              },
            };
          }));
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [businessId, vendorId]);

  if (!business) return <PublicLayout><div className="mx-auto max-w-6xl px-4 py-20 text-center"><h1 className="text-3xl font-semibold">Business not found</h1><p className="mt-3 text-muted-foreground">This place isn't available to browse.</p><Button asChild className="mt-6"><Link to="/search">Browse food</Link></Button></div></PublicLayout>;

  const available = posts.filter(({ bag, isAvailable }) => isAvailable && bag.quantityLeft > 0);
  const unavailable = posts.filter(({ bag, isAvailable }) => !isAvailable || bag.quantityLeft <= 0);
  const cover = available[0]?.bag.image ?? posts[0]?.bag.image ?? business.image;

  return (
    <PublicLayout>
      <div className="relative h-52 overflow-hidden bg-secondary sm:h-72 lg:h-80">
        <img src={cover} alt={`Food from ${business.name}`} className="size-full object-cover" />
        <div className="absolute inset-0 bg-foreground/35" />
        <div className="absolute inset-x-0 top-0 mx-auto max-w-6xl px-4 pt-5"><Link to="/search" className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] hover:text-primary"><ArrowLeft className="size-4" /> Browse food</Link></div>
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <header className="border-b border-border pb-8 pt-7 sm:pt-9">
          <div className="flex items-start gap-4 sm:gap-6">
            <span className="grid size-16 shrink-0 place-items-center rounded-lg border border-border bg-primary text-xl font-bold text-primary-foreground sm:size-20 sm:text-2xl">{business.logoInitials}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase text-success">{businessTypeLabels[business.type]}</p>
              <h1 className="mt-1 text-3xl font-semibold text-foreground sm:text-4xl">{business.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{business.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {business.rating > 0 && <span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-accent text-accent" /><strong className="text-foreground">{business.rating.toFixed(1)}</strong>{business.reviewCount > 0 && ` (${business.reviewCount} reviews)`}</span>}
                {(business.address || business.neighborhood) && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{[business.address, business.neighborhood].filter(Boolean).join(", ")}</span>}
                <span className="inline-flex items-center gap-1.5">{business.fulfillment === "delivery" ? <Bike className="size-4 text-primary" /> : <ShoppingBag className="size-4 text-primary" />}{business.fulfillment === "both" ? "Pickup & delivery" : business.fulfillment === "delivery" ? "Delivery" : "Pickup"}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="py-10" aria-labelledby="available-bags">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-bold uppercase text-success">Rescue something good</p><h2 id="available-bags" className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Available mystery bags</h2></div>{!loading && !error && <span className="text-sm text-muted-foreground">{available.length} available</span>}</div>
          {loading ? <p role="status" className="py-8 text-sm text-muted-foreground">Loading mystery bags…</p> : error ? <p role="alert" className="py-8 text-sm text-muted-foreground">Mystery bags couldn't load. Please try again later.</p> : available.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{available.map(({ bag }) => <BagCard key={bag.id} bag={bag} />)}</div> : <div className="border-y border-border py-10 text-sm text-muted-foreground">No mystery bags available from this business right now. Check back soon.</div>}
        </section>

        {!loading && !error && unavailable.length > 0 && <section className="border-t border-border py-10" aria-labelledby="unavailable-bags"><h2 id="unavailable-bags" className="text-2xl font-semibold text-foreground">Currently unavailable</h2><p className="mt-1 mb-6 text-sm text-muted-foreground">These bags can't be reserved right now.</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{unavailable.map(({ bag }) => <BagCard key={bag.id} bag={bag} unavailable />)}</div></section>}
      </div>
    </PublicLayout>
  );
}
