import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, PiggyBank, Store } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { BagCard } from "@/components/bag-card";
import { ImpactBanner } from "@/components/impact-banner";
import { FeaturedBusinesses } from "@/components/featured-businesses";

import { Button } from "@/components/ui/button";
import {
  businesses,
  businessTypeLabels,
  mysteryBags,
  platformStats,
  storefrontImage,
} from "@/data/mock";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Surplus Rescue — Discounted mystery bags from local food shops" },
      {
        name: "description",
        content:
          "Rescue surplus food from restaurants, bakeries, cafes and grocers near you. Reserve a mystery bag at up to 70% off and pay cash on pickup or delivery.",
      },
      { property: "og:title", content: "Surplus Rescue — Rescue good food for less" },
      {
        property: "og:description",
        content:
          "Browse discounted mystery bags from local food businesses and reserve yours before the pickup window closes.",
      },
    ],
  }),
  component: MarketplaceHome,
});


function MarketplaceHome() {
  const closingSoon = mysteryBags.filter((b) => b.quantityLeft > 0 && b.quantityLeft <= 3).slice(0, 8);

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
                <Link to="/register">List your surplus</Link>
              </Button>
            </div>
          </div>
          <img
            src={storefrontImage}
            alt="A warm neighbourhood cafe storefront at dusk"
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
            { icon: PiggyBank, label: "Saved by customers", value: `$${platformStats.moneySaved.toLocaleString()}`, tone: "text-accent" },
            { icon: Store, label: "Partner businesses", value: `${platformStats.activeBusinesses}`, tone: "text-primary" },
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
        <h2 className="text-xl font-semibold">Businesses rescuing food nearby</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.slice(0, 6).map((b) => (
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
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
