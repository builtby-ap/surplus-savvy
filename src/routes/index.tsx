import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Leaf,
  MapPin,
  Package,
  PiggyBank,
  Search,
  ShoppingCart,
  Store,
} from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/layout/public-layout";
import { BagCard } from "@/components/bag-card";
import { ImpactBanner } from "@/components/impact-banner";
import { FeaturedBusinesses } from "@/components/featured-businesses";
import heroAsset from "@/assets/hero-phoelamin.jpeg.asset.json";
import { isClosingSoon, useNow } from "@/lib/countdown";
import { getNearbyLocation, saveNearbyLocation, type LatLng } from "@/lib/nearby";
import { getVerifiedVendorCount } from "@/lib/vendors.functions";

import { Button } from "@/components/ui/button";
import {
  businesses,
  businessTypeLabels,
  formatMoneySaved,
  haversineKm,
  mysteryBags,
  platformStats,
} from "@/data/mock";

const verifiedVendorCountQueryOptions = {
  queryKey: ["verified-vendor-count"],
  queryFn: ({ signal }: { signal?: AbortSignal }) =>
    getVerifiedVendorCount({ abortSignal: signal }),
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Phoe La Min — Discounted mystery bags from local food shops" },
      {
        name: "description",
        content:
          "Rescue surplus food from restaurants, bakeries, cafes and grocers near you. Reserve a mystery bag at up to 70% off and pay cash on pickup or delivery.",
      },
      { property: "og:title", content: "Phoe La Min — Rescue good food for less" },
      {
        property: "og:description",
        content:
          "Browse discounted mystery bags from local food businesses and reserve yours before the pickup window closes.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(verifiedVendorCountQueryOptions);
  },
  component: MarketplaceHome,
});


function MarketplaceHome() {
  const { data: verifiedVendorCount } = useSuspenseQuery(verifiedVendorCountQueryOptions);
  const now = useNow(30000);
  const closingSoon = useMemo(
    () =>
      now
        ? mysteryBags.filter((b) => b.quantityLeft > 0 && isClosingSoon(b.availableUntil, now)).slice(0, 8)
        : [],
    [now],
  );

  const [coords, setCoords] = useState<LatLng | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "ready" | "denied">("idle");

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(loc);
        saveNearbyLocation(loc);
        setGeoState("ready");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    const saved = getNearbyLocation();
    if (saved) {
      setCoords(saved);
      setGeoState("ready");
      return;
    }
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearbyBusinesses = useMemo(() => {
    const list = businesses.map((business) => ({
      business,
      distanceKm: coords ? haversineKm(coords, { lat: business.lat, lng: business.lng }) : null,
    }));
    if (coords) list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    return list.slice(0, 6);
  }, [coords]);


  return (


    <PublicLayout>
      <ImpactBanner />
      <section className="warm-hero">

        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              <Leaf className="size-3.5" /> {platformStats.mealsRescued.toLocaleString()} meals rescued
            </span>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              Great food, rescued and priced to go.
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Local restaurants, bakeries, markets and grocers pack their surplus into mystery
              bags. Reserve one, pay cash on pickup or delivery, and save up to 70%.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/search">
                  Browse bags near you <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/register">Join us now</Link>
              </Button>
            </div>
          </div>
          <img
            src={heroAsset.url}
            alt="Phoe La Min mascot holding a golden tray with a bunny and reusable bag"
            width={1024}
            height={640}
            className="rounded-3xl object-cover shadow-[var(--shadow-lifted)]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Leaf, label: "CO₂ saved", value: `${(platformStats.co2SavedKg / 1000).toFixed(1)}t`, tone: "text-success" },
            { icon: PiggyBank, label: "Saved by customers", value: formatMoneySaved(platformStats.moneySaved), tone: "text-accent" },
            { icon: Store, label: "Partner businesses", value: `${verifiedVendorCount}`, tone: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="surface-card flex items-center gap-4 p-5">
              <stat.icon className={`size-6 ${stat.tone}`} />
              <div>
                <p className="text-xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeaturedBusinesses />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold">Closing soon</h2>
          <Link
            to="/search"
            search={{ closingSoon: true }}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            See all
          </Link>
        </div>
        {closingSoon.length > 0 ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {closingSoon.map((bag, i) => (
              <BagCard key={bag.id} bag={bag} eager={i < 4} />
            ))}
          </div>
        ) : (
          <div className="surface-card mt-4 p-8 text-center text-sm text-muted-foreground">
            No bags are closing soon right now.{" "}
            <Link to="/search" className="text-primary underline-offset-4 hover:underline">
              Browse all available bags
            </Link>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold">How Phoelamin Works</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Rescue good food in four simple steps
          </p>
        </div>

        <div className="relative mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Search,
                title: "Discover",
                subtitle: "Find Surplus Food Near You",
                description:
                  "Use your location to discover nearby Secret Bags from participating food businesses.",
                tone: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: Package,
                title: "Choose",
                subtitle: "Pick Your Secret Bag",
                description:
                  "Browse discounted surplus food, check the details, and choose the Secret Bag you want to rescue.",
                tone: "text-accent",
                bg: "bg-accent/10",
              },
              {
                icon: ShoppingCart,
                title: "Reserve",
                subtitle: "Place Your Order",
                description:
                  "Add the Secret Bag to your cart, choose pickup or delivery, select your address if delivery is selected, and place your order.",
                tone: "text-destructive",
                bg: "bg-destructive/10",
              },
              {
                icon: Leaf,
                title: "Rescue & Make an Impact",
                subtitle: "Enjoy Food, Reduce Waste",
                description:
                  "Collect or receive your rescued food and see how much food waste, CO₂, and money you helped save.",
                tone: "text-success",
                bg: "bg-success/10",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="surface-card group relative flex flex-col items-center p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)]"
              >
                <span className="absolute left-4 top-4 text-xs font-semibold text-muted-foreground">
                  0{i + 1}
                </span>
                <div
                  className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${step.bg}`}
                >
                  <step.icon className={`size-7 ${step.tone}`} />
                </div>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {step.subtitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>

                {i < 3 && (
                  <>
                    <ArrowRight className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-muted-foreground/40 lg:block" />
                    <ArrowDown className="absolute -bottom-3 left-1/2 block size-5 -translate-x-1/2 text-muted-foreground/40 sm:hidden" />
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 hidden items-center justify-center gap-2 text-sm font-medium text-muted-foreground sm:flex lg:hidden">
            <span>Discover</span>
            <ArrowRight className="size-4" />
            <span>Choose</span>
            <ArrowRight className="size-4" />
            <span>Reserve</span>
            <ArrowRight className="size-4" />
            <span>Rescue</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Businesses rescuing food nearby</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {geoState === "ready" ? (
              <span className="inline-flex items-center gap-1 text-success">
                <MapPin className="size-3.5" /> Sorted by your location
              </span>
            ) : geoState === "loading" ? (
              <span>Finding your location…</span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={requestLocation}
              >
                <MapPin className="size-3.5" /> Use my location
              </Button>
            )}
          </div>
        </div>
        {geoState === "denied" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Location unavailable — showing businesses across the city.
          </p>
        ) : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nearbyBusinesses.map(({ business: b, distanceKm }) => (
            <Link
              key={b.id}
              to="/business/$businessId"
              params={{ businessId: b.id }}
              className="surface-card flex items-center gap-4 p-4 transition-colors hover:border-primary"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                {b.logoInitials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{b.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {businessTypeLabels[b.type]} · {b.neighborhood}
                  {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km away` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="surface-card flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Something not right?</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Found a problem with a Secret Bag, food quality, or your order? Let us know and our team will review it.
            </p>
          </div>
          <Button
            asChild
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a
              href={`mailto:support@phoelamin.com?subject=${encodeURIComponent(
                "Phoelamin — Secret Bag Report",
              )}&body=${encodeURIComponent(
                `Hello Phoelamin Team,

I would like to report an issue regarding a Secret Bag.

Secret Bag:
Vendor:
Order ID (if applicable):
Issue:
Additional details:

Thank you.`,
              )}`}
            >
              Report to Phoelamin
            </a>
          </Button>
        </div>
      </section>

    </PublicLayout>
  );
}
