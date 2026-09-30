import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3, Gift, Leaf, Tag, Truck } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { HomePromoCarousel } from "@/components/home-promo-carousel";
import { HomeFoodCard, SectionHeading } from "@/components/home-food-card";
import { Button } from "@/components/ui/button";
import { bagCategoryLabels, businesses, categoryImages, discountPercent, haversineKm, mysteryBags, type BagCategory, type MysteryBag } from "@/data/mock";
import { vendorUuidById } from "@/data/catalogue";
import { isClosingSoon, useNow } from "@/lib/countdown";
import { getNearbyLocation, saveNearbyLocation, type LatLng } from "@/lib/nearby";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchMyOrders } from "@/lib/customer-orders";
import { safeImage } from "@/lib/image-upload";
import { supabase } from "@/integrations/supabase/client";
import restaurantBanner from "@/assets/restaurant-banner.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Phoe La Min — Discover discounted food near you" },
    { name: "description", content: "Find today's discounted surplus food, last-chance bags, local restaurants and fresh favorites on Phoe La Min." },
    { property: "og:title", content: "Phoe La Min — Discover discounted food near you" },
    { property: "og:description", content: "Great food, smaller prices. Browse today's surplus food and local restaurants." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: MarketplaceHome,
});

const categoryOrder: BagCategory[] = ["mixed_meals", "bakery", "desserts", "produce", "grocery", "snacks", "beverages"];

function FoodRail({ bags, label, urgent = false }: { bags: MysteryBag[]; label: string; urgent?: boolean }) {
  const rail = useRef<HTMLDivElement>(null);
  if (!bags.length) return <p className="rounded-lg border border-border bg-card px-5 py-8 text-sm text-muted-foreground">No {urgent ? "bags closing in the next hour" : "food posts"} available right now. Check back soon.</p>;
  return <div className="relative"><div ref={rail} aria-label={label} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{bags.map((bag) => <HomeFoodCard key={bag.id} bag={bag} urgent={urgent} />)}</div><div className="mt-2 hidden justify-end gap-2 sm:flex"><Button variant="outline" size="icon" className="rounded-full" aria-label={`Scroll ${label} left`} onClick={() => rail.current?.scrollBy({ left: -560, behavior: "smooth" })}><ArrowLeft /></Button><Button variant="outline" size="icon" className="rounded-full" aria-label={`Scroll ${label} right`} onClick={() => rail.current?.scrollBy({ left: 560, behavior: "smooth" })}><ArrowRight /></Button></div></div>;
}

function MarketplaceHome() {
  const now = useNow(1000);
  const { user } = useAuth();
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [orderedCategories, setOrderedCategories] = useState<string[]>([]);
  const [promotedImages, setPromotedImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = getNearbyLocation();
    if (saved) setCoords(saved);
    if (typeof navigator !== "undefined" && navigator.geolocation) navigator.geolocation.getCurrentPosition((position) => {
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setCoords(next); saveNearbyLocation(next);
    }, () => {}, { timeout: 8000 });
  }, []);
  useEffect(() => {
    let active = true;
    void supabase.from("advertised_vendors_public" as never).select("id,image_url").limit(20).then(({ data }) => {
      if (active && data) setPromotedImages(Object.fromEntries((data as unknown as { id: string; image_url: string | null }[]).filter((v) => v.image_url).map((v) => [v.id, v.image_url])) as Record<string, string>);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (user?.role !== "customer") return;
    let active = true;
    void fetchMyOrders().then((orders) => {
      if (!active) return;
      const ranked = orders.flatMap((order) => order.items.map((item) => mysteryBags.find((bag) => bag.title === item.title)?.category)).filter((c): c is BagCategory => Boolean(c));
      setOrderedCategories(ranked);
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.id, user?.role]);

  const available = mysteryBags.filter((bag) => bag.quantityLeft > 0 && (!now || bag.availableUntil > `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`));
  const distance = (bag: MysteryBag) => {
    const vendor = businesses.find((b) => b.id === bag.businessId);
    return coords && vendor && vendor.lat && vendor.lng ? haversineKm(coords, vendor) : null;
  };
  const deals = [...available].filter((bag) => discountPercent(bag) >= 50).sort((a, b) => {
    const da = distance(a), db = distance(b);
    return da !== null && db !== null ? da - db : discountPercent(b) - discountPercent(a);
  }).slice(0, 12);
  const closingSoon = now ? available.filter((bag) => isClosingSoon(bag.availableUntil, now)).sort((a, b) => a.availableUntil.localeCompare(b.availableUntil)).slice(0, 10) : [];
  const recommended = [...available].sort((a, b) => {
    const score = (bag: MysteryBag) => orderedCategories.filter((category) => category === bag.category).length * 10 + bag.rating + discountPercent(bag) / 100;
    return score(b) - score(a);
  }).slice(0, 8);
  const places = useMemo(() => [...businesses].filter((b) => b.verified).sort((a, b) => coords ? haversineKm(coords, a) - haversineKm(coords, b) : b.rating - a.rating).slice(0, 8), [coords]);

  return <PublicLayout>
    <HomePromoCarousel />
    <div className="border-b border-border bg-card"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs font-semibold text-foreground sm:text-sm"><span className="flex items-center gap-2"><Tag className="size-4 text-destructive" />50%+ off good food</span><span className="flex items-center gap-2"><Clock3 className="size-4 text-accent" />Fresh deals every day</span><span className="flex items-center gap-2"><Leaf className="size-4 text-success" />Good food, less waste</span></div></div>

    <div className="mx-auto max-w-6xl space-y-14 px-4 pb-8 pt-10 sm:space-y-18 sm:pt-14">
      <section aria-labelledby="categories-title"><SectionHeading id="categories-title" title="What are you craving?" description="A little something for every appetite" /><div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">{categoryOrder.map((category) => <Link key={category} to="/search" search={{ category }} className="group min-w-0 text-center"><span className="mx-auto block aspect-square max-w-28 overflow-hidden rounded-full border-2 border-border bg-secondary transition-colors group-hover:border-primary"><img src={categoryImages[category]} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-110" /></span><span className="mt-2 block text-xs font-semibold text-foreground sm:text-sm">{bagCategoryLabels[category]}</span></Link>)}</div></section>

      <section aria-labelledby="deals-title"><SectionHeading id="deals-title" title="Good Deals Near You" description="Great finds at 50% off or more" to="/search" /><FoodRail bags={deals} label="Good deals" /></section>
    </div>

    <section className="border-y border-border bg-secondary/70 py-12 sm:py-16"><div className="mx-auto max-w-6xl px-4"><div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3"><div className="min-w-0"><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-destructive"><Clock3 className="size-4" />Last chance</div><h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Closing Soon</h2><p className="mt-1 text-sm text-muted-foreground">These bags have less than an hour left</p></div><Link to="/search" search={{ closingSoon: true }} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">See all <ArrowRight className="size-4" /></Link></div><FoodRail bags={closingSoon} label="Closing soon" urgent /></div></section>

    <div className="mx-auto max-w-6xl space-y-14 px-4 py-14 sm:space-y-18">
      <section aria-labelledby="places-title"><SectionHeading id="places-title" title="Discover New Places" description="Local restaurants and food makers worth getting to know" to="/search" /><div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-8 sm:gap-x-3">{places.map((place) => { const uuid = vendorUuidById.get(place.id); const cover = uuid ? promotedImages[uuid] : undefined; return <Link key={place.id} to="/business/$businessId" params={{ businessId: place.id }} className="group min-w-0 text-center"><span className="mx-auto block aspect-square max-w-24 overflow-hidden rounded-full border-2 border-border bg-secondary transition-colors group-hover:border-primary"><img src={safeImage(cover, restaurantBanner)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-110" /></span><span className="mt-2 block text-xs font-semibold leading-snug text-foreground sm:text-sm">{place.name}</span></Link>; })}</div></section>

      <section aria-labelledby="picked-title"><SectionHeading id="picked-title" title="Picked for You" description={orderedCategories.length ? "More of the food you enjoy" : "Popular rescues you might love"} to="/search" /><FoodRail bags={recommended} label="Picked for you" /></section>

      <section aria-labelledby="special-title"><SectionHeading id="special-title" title="A Little Something Extra" description="More ways to find your next great meal" /><div className="grid gap-4 md:grid-cols-3"><Link to="/search" className="relative flex min-h-48 flex-col justify-between overflow-hidden rounded-lg bg-primary p-6 text-primary-foreground"><Truck className="size-7" /><div><p className="text-xs font-semibold uppercase text-accent">At your doorstep</p><h3 className="mt-1 text-2xl font-semibold text-primary-foreground">Food that comes to you</h3><p className="mt-2 text-sm text-primary-foreground/85">Explore bags with delivery available.</p></div><ArrowRight className="absolute bottom-6 right-6 size-5" /></Link><Link to="/search" search={{ closingSoon: true }} className="relative flex min-h-48 flex-col justify-between overflow-hidden rounded-lg bg-destructive p-6 text-destructive-foreground"><Clock3 className="size-7" /><div><p className="text-xs font-semibold uppercase">Today's final picks</p><h3 className="mt-1 text-2xl font-semibold text-destructive-foreground">Catch them before they're gone</h3><p className="mt-2 text-sm text-destructive-foreground/90">Last-chance food, priced to rescue.</p></div><ArrowRight className="absolute bottom-6 right-6 size-5" /></Link><Link to="/search" className="relative flex min-h-48 flex-col justify-between overflow-hidden rounded-lg bg-success p-6 text-success-foreground"><Gift className="size-7" /><div><p className="text-xs font-semibold uppercase">Small price, big joy</p><h3 className="mt-1 text-2xl font-semibold text-success-foreground">Discover a surprise</h3><p className="mt-2 text-sm text-success-foreground/90">See what local kitchens have saved today.</p></div><ArrowRight className="absolute bottom-6 right-6 size-5" /></Link></div></section>
      <section className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Something not right?</h2><p className="mt-1 text-sm text-muted-foreground">Found a problem with a Secret Bag, food quality, or your order? Let us know and our team will review it.</p></div><Button asChild className="shrink-0 rounded-full"><a href={`mailto:support@phoelamin.com?subject=${encodeURIComponent("Phoelamin — Secret Bag Report")}&body=${encodeURIComponent("Hello Phoelamin Team,\n\nI would like to report an issue regarding a Secret Bag.\n\nSecret Bag:\nVendor:\nOrder ID (if applicable):\nIssue:\nAdditional details:\n\nThank you.")}`}>Report to Phoelamin</a></Button></section>
    </div>
  </PublicLayout>;
}
