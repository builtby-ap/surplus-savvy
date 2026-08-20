import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createFileRoute, ClientOnly, Link, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, Loader2, LocateFixed, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";

import { PublicLayout } from "@/components/layout/public-layout";
import { BagCard } from "@/components/bag-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  bagCategoryLabels,
  businesses,
  cityCenter,
  formatPrice,
  getBusiness,
  haversineKm,
  mysteryBags,
  type BagCategory,
} from "@/data/mock";
import type { VendorPin } from "@/components/map/vendor-map";
import { cn } from "@/lib/utils";
import { getNearbyLocation, saveNearbyLocation } from "@/lib/nearby";



export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string | undefined; category?: string | undefined; closingSoon?: boolean | undefined } => {
    const parsed: { q?: string | undefined; category?: string | undefined; closingSoon?: boolean | undefined } = {};
    if (typeof search["q"] === "string") parsed.q = search["q"];
    if (typeof search["category"] === "string") parsed.category = search["category"];
    if (search["closingSoon"] === true || search["closingSoon"] === "true") parsed.closingSoon = true;
    return parsed;
  },

  head: () => ({

    meta: [
      { title: "Browse mystery bags — Phoe La Min" },
      { name: "description", content: "Filter surplus mystery bags by category, price, delivery or pickup and city, and reserve before the window closes." },
      { property: "og:title", content: "Browse mystery bags — Phoe La Min" },
      { property: "og:description", content: "Filter surplus mystery bags by category, price, delivery or pickup and city." },
    ],
  }),
  component: BrowsePage,
});

const categories = Object.keys(bagCategoryLabels) as BagCategory[];

type Method = "all" | "pickup" | "delivery";
type View = "grid" | "map";

const VendorMap = lazy(() => import("@/components/map/vendor-map"));

function BrowsePage() {
  const initial = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  // Derived from the live Supabase-backed catalogue.
  const cities = useMemo(
    () => Array.from(new Set(businesses.map((b) => b.neighborhood))).sort(),
    [],
  );
  const priceCeiling = useMemo(
    () => Math.ceil(Math.max(1, ...mysteryBags.map((b) => b.discountedPrice))),
    [],
  );
  const [query, setQuery] = useState(initial.q ?? "");
  const [category, setCategory] = useState<string>(initial.category ?? "all");
  const [maxPrice, setMaxPrice] = useState<number>(priceCeiling);
  const [method, setMethod] = useState<Method>("all");
  const [city, setCity] = useState<string>("all");
  const [closingSoon, setClosingSoon] = useState<boolean>(initial.closingSoon ?? false);
  const [view, setView] = useState<View>("grid");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [locating, setLocating] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [manualQuery, setManualQuery] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    setMaxPrice(priceCeiling);
  }, [priceCeiling]);

  // Reuse the last location the customer picked, so distances stay consistent.
  useEffect(() => {
    const saved = getNearbyLocation();
    if (saved) setUserLocation(saved);
  }, []);

  useEffect(() => {
    saveNearbyLocation(userLocation);
  }, [userLocation]);

  useEffect(() => {
    setClosingSoon(initial.closingSoon ?? false);
  }, [initial.closingSoon]);

  const useMyLocation = () => {
    if (userLocation) {
      setUserLocation(null);
      setLocationLabel("");
      return;
    }
    setLocating(true);
    const finish = (loc: { lat: number; lng: number }, label: string, note: string) => {
      setUserLocation(loc);
      setLocationLabel(label);
      setLocating(false);
      toast.success(note);
    };
    if (!navigator.geolocation) {
      setLocating(false);
      setManualOpen(true);
      toast.error("This browser can't share your location — search for a place instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        finish(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          "Your current location",
          "Showing secret bags near you",
        ),
      () => {
        setLocating(false);
        setManualOpen(true);
        toast.error("Location permission denied — search for a place instead.");
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  /** Manual fallback when geolocation is unavailable or denied. */
  async function searchLocation(e: React.FormEvent) {
    e.preventDefault();
    const q = manualQuery.trim();
    if (!q) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      );
      const rows = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      const hit = rows[0];
      if (!hit) {
        toast.error("No place found — try a nearby township or landmark.");
        return;
      }
      setUserLocation({ lat: Number(hit.lat), lng: Number(hit.lon) });
      setLocationLabel(hit.display_name.split(",").slice(0, 2).join(",").trim());
      toast.success("Showing secret bags near that location");
    } catch {
      toast.error("Couldn't look up that place. Please try again.");
    } finally {
      setGeocoding(false);
    }
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mysteryBags.filter((bag) => {
      const business = getBusiness(bag.businessId);
      if (category !== "all" && bag.category !== category) return false;
      if (bag.discountedPrice > maxPrice) return false;
      if (method !== "all" && bag.fulfillment !== method && bag.fulfillment !== "both") return false;
      if (city !== "all" && business?.neighborhood !== city) return false;
      if (closingSoon && (bag.quantityLeft === 0 || bag.quantityLeft > 3)) return false;
      if (userLocation && business && haversineKm(userLocation, business) > radiusKm) return false;
      if (
        q &&
        !`${bag.title} ${bag.description} ${business?.name ?? ""}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, category, maxPrice, method, city, closingSoon, userLocation, radiusKm]);



  const sorted = useMemo(() => {
    if (!userLocation) return results;
    return [...results].sort((a, b) => {
      const ba = getBusiness(a.businessId);
      const bb = getBusiness(b.businessId);
      if (!ba || !bb) return 0;
      return haversineKm(userLocation, ba) - haversineKm(userLocation, bb);
    });
  }, [results, userLocation]);

  const pins = useMemo<VendorPin[]>(() => {
    const origin = userLocation ?? cityCenter;
    const byBusiness = new Map<string, VendorPin>();
    for (const bag of sorted) {
      if (bag.quantityLeft === 0) continue;
      const business = getBusiness(bag.businessId);
      if (!business) continue;
      const existing = byBusiness.get(business.id);
      if (existing) existing.bags.push(bag);
      else
        byBusiness.set(business.id, {
          business,
          bags: [bag],
          distanceKm: haversineKm(origin, business),
        });
    }
    return [...byBusiness.values()].sort((a, b) => a.distanceKm - b.distanceKm);
  }, [sorted, userLocation]);

  const available = sorted.filter((b) => b.quantityLeft > 0);
  const soldOut = sorted.filter((b) => b.quantityLeft === 0);

  const addToCart = (bag: (typeof mysteryBags)[number]) => {
    toast.success(`${bag.title} added — reserve it now.`);
    void navigate({ to: "/checkout", search: { bag: bag.id } });
  };

  const reset = () => {
    setQuery("");
    setCategory("all");
    setMaxPrice(priceCeiling);
    setMethod("all");
    setCity("all");
    setClosingSoon(false);
    setRadiusKm(5);
    void navigate({ to: "/search", search: () => ({}) });
    setUserLocation(null);
    setLocationLabel("");
  };




  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Browse food posts</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Surplus bags from local kitchens, bakeries and markets — reserve before the pickup
          window closes.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="surface-card h-fit space-y-6 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={reset} className="h-7 px-2 text-xs">
                Reset
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q">Search</Label>
              <Input
                id="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Bag, vendor or dish"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2">
                {(["all", ...categories] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "rounded-full border border-border px-3 py-1 text-xs transition-colors",
                      category === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary hover:text-primary",
                    )}
                  >
                    {c === "all" ? "All" : bagCategoryLabels[c as BagCategory]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Max price: {formatPrice(maxPrice)}</Label>
              <Slider
                value={[maxPrice]}
                min={1}
                max={priceCeiling}
                step={0.5}
                onValueChange={(v) => setMaxPrice(v[0] ?? priceCeiling)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fulfilment</Label>
              <div className="flex flex-wrap gap-2">
                {([
                  ["all", "Any"],
                  ["pickup", "Pickup"],
                  ["delivery", "Delivery"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    className={cn(
                      "rounded-full border border-border px-3 py-1 text-xs transition-colors",
                      method === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary hover:text-primary",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Availability</Label>
              <div className="flex flex-wrap gap-2">
                {([
                  [false, "All"],
                  [true, "Closing soon"],
                ] as const).map(([value, label]) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => {
                      setClosingSoon(value);
                      void navigate({ to: "/search", search: (prev) => ({ ...prev, closingSoon: value || undefined }) });
                    }}

                    className={cn(
                      "rounded-full border border-border px-3 py-1 text-xs transition-colors",
                      closingSoon === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary hover:text-primary",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">

              <Label htmlFor="city">City / area</Label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All areas</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Search radius</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 5, 10, 20].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setRadiusKm(km)}
                    className={cn(
                      "rounded-full border border-border px-3 py-1 text-xs transition-colors",
                      radiusKm === km
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary hover:text-primary",
                    )}
                  >
                    {km} km
                  </button>
                ))}
              </div>
              {!userLocation && (
                <p className="text-xs text-muted-foreground">
                  Set a location to filter by radius.
                </p>
              )}
            </div>

            <Button
              type="button"
              variant={userLocation ? "default" : "outline"}
              className="w-full"
              onClick={useMyLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <LocateFixed className="size-4" aria-hidden />
              )}
              {userLocation ? "Clear my location" : "Use my location"}
            </Button>

            {userLocation && locationLabel && (
              <p className="text-xs text-muted-foreground">Near {locationLabel}</p>
            )}

            <div className="space-y-2">
              {!manualOpen ? (
                <button
                  type="button"
                  onClick={() => setManualOpen(true)}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  Or search a location
                </button>
              ) : (
                <form onSubmit={searchLocation} className="space-y-2">
                  <Label htmlFor="place">Search a location</Label>
                  <Input
                    id="place"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Township, street or landmark"
                  />
                  <Button type="submit" variant="outline" className="w-full" disabled={geocoding}>
                    {geocoding ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                    Set location
                  </Button>
                </form>
              )}
            </div>
          </aside>


          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {results.length} food post{results.length === 1 ? "" : "s"} match your filters
                {userLocation ? ` · within ${radiusKm} km · sorted by distance` : ""}
              </p>
              <div className="flex rounded-full border border-border p-1">
                {([
                  ["grid", "Grid", LayoutGrid],
                  ["map", "Map", MapIcon],
                ] as const).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setView(value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      view === value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-primary",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {view === "map" ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
                <div className="surface-card overflow-hidden p-0">
                  <ClientOnly
                    fallback={
                      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground sm:h-[560px]">
                        Loading map…
                      </div>
                    }
                  >
                    <Suspense
                      fallback={
                        <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground sm:h-[560px]">
                          Loading map…
                        </div>
                      }
                    >
                      <VendorMap
                        pins={pins}
                        userLocation={userLocation}
                        radiusKm={radiusKm}
                        onAddToCart={addToCart}
                      />
                    </Suspense>
                  </ClientOnly>
                  <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                    {pins.length} vendor{pins.length === 1 ? "" : "s"} with available food posts
                    {userLocation ? ` within ${radiusKm} km` : ""}
                  </p>
                </div>

                <div className="surface-card max-h-[560px] space-y-3 overflow-y-auto p-4">
                  <h2 className="text-sm font-semibold">
                    Nearby secret bags ({available.length})
                  </h2>
                  {available.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nothing in this radius yet — try a wider radius.
                    </p>
                  )}
                  {available.map((bag) => {
                    const b = getBusiness(bag.businessId);
                    const dist = userLocation && b ? haversineKm(userLocation, b) : null;
                    return (
                      <div
                        key={bag.id}
                        className="flex gap-3 rounded-2xl border border-border p-2"
                      >
                        <img
                          src={bag.image}
                          alt={bag.title}
                          loading="lazy"
                          className="size-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-primary">{b?.name}</p>
                          <p className="truncate text-sm font-medium">{bag.title}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-accent">
                              {formatPrice(bag.discountedPrice)}
                            </span>{" "}
                            <span className="line-through">{formatPrice(bag.originalPrice)}</span>
                            {dist !== null ? ` · ${dist.toFixed(1)} km` : ""}
                          </p>
                          <div className="mt-1.5 flex gap-1.5">
                            <Button asChild size="sm" variant="outline" className="h-8 flex-1 text-xs">
                              <Link to="/bag/$bagId" params={{ bagId: bag.id }}>
                                Details
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 flex-1 bg-accent text-xs text-accent-foreground hover:bg-accent/90"
                              onClick={() => addToCart(bag)}
                            >
                              Add to cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            ) : results.length === 0 ? (
              <div className="surface-card mt-4 p-10 text-center text-sm text-muted-foreground">
                Nothing matches yet — try widening your price range or area.
              </div>
            ) : (
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...available, ...soldOut].map((bag, i) => (
                  <BagCard key={bag.id} bag={bag} eager={i < 3} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
