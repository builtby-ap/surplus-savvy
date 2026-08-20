import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Bike, MapPin, ShoppingBag, Star, Timer } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/public-layout";
import { BagCard, FulfillmentIcons } from "@/components/bag-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  bagCategoryLabels,
  bagsForBusiness,
  businessTypeLabels,
  categoryImages,
  discountPercent,
  formatPrice,
  getBag,
  getBusiness,
  storefrontImage,
} from "@/data/mock";
import { CLOSING_SOON_MS, formatDuration, useCountdown } from "@/lib/countdown";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bag/$bagId")({
  head: () => ({
    meta: [
      { title: "Mystery bag details — Surplus Rescue" },
      { name: "description", content: "See what's inside this surplus mystery bag, its pickup window, price and how many are left." },
      { property: "og:title", content: "Mystery bag details — Surplus Rescue" },
      { property: "og:description", content: "See what's inside this surplus mystery bag, its pickup window, price and how many are left." },
    ],
  }),
  component: BagDetail,
});

function BagDetail() {
  const { bagId } = useParams({ from: "/bag/$bagId" });
  const bag = getBag(bagId);
  const business = bag ? getBusiness(bag.businessId) : undefined;
  const gallery = bag ? [bag.image, storefrontImage, categoryImages[bag.category]] : [];
  const [active, setActive] = useState(0);
  const remaining = useCountdown(bag?.availableUntil ?? "23:59");

  if (!bag) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold">Food post not found</h1>
          <p className="mt-3 text-muted-foreground">This bag may have been rescued already.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/search">Browse other bags</Link>
          </Button>
        </section>
      </PublicLayout>
    );
  }

  const soldOut = bag.quantityLeft === 0;
  const closingSoon = !soldOut && remaining !== null && remaining > 0 && remaining <= CLOSING_SOON_MS;
  const more = bagsForBusiness(bag.businessId).filter((b) => b.id !== bag.id);

  return (
    <PublicLayout>
      <article className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="surface-card overflow-hidden">
              <img
                src={gallery[active]}
                alt={`${bag.title} from ${business?.name ?? "a local business"}`}
                width={1024}
                height={768}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="mt-3 flex gap-3">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "overflow-hidden rounded-xl border-2 transition-colors",
                    active === i ? "border-primary" : "border-transparent hover:border-border",
                  )}
                >
                  <img src={src} alt="" width={160} height={120} className="size-20 object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {bagCategoryLabels[bag.category]}
              </Badge>
              {closingSoon && (
                <Badge className="rounded-full bg-destructive text-destructive-foreground">
                  <Timer className="size-3.5" /> Closing soon
                </Badge>
              )}
              {soldOut && (
                <Badge className="rounded-full bg-muted text-muted-foreground">Sold out</Badge>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-semibold">{bag.title}</h1>
            <p className="mt-3 text-muted-foreground">{bag.description}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-accent">
                {formatPrice(bag.discountedPrice)}
              </span>
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(bag.originalPrice)}
              </span>
              <Badge className="rounded-full bg-success text-success-foreground">
                -{discountPercent(bag)}%
              </Badge>
            </div>

            <div className="surface-card mt-6 grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Collect between</p>
                <p className="font-medium">
                  {bag.availableFrom}–{bag.availableUntil}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Countdown</p>
                <p className={cn("font-medium", closingSoon && "text-destructive")}>
                  {remaining === null ? "—" : formatDuration(remaining)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quantity left</p>
                <p className="font-medium">
                  {bag.quantityLeft} of {bag.totalQuantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fulfilment</p>
                <div className="flex items-center gap-2 font-medium">
                  <FulfillmentIcons bag={bag} />
                  <span className="text-sm capitalize">
                    {bag.fulfillment === "both" ? "Pickup or delivery" : bag.fulfillment}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold">Pickup instructions</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Head to {business?.name ?? "the shop"} at {business?.address ?? "the listed address"}
                , {business?.neighborhood}. Come to the counter within the collection window, show
                your reservation code and staff will hand over your bag. Please bring your own tote
                if you can.
              </p>
            </div>

            <Button
              size="lg"
              disabled={soldOut}
              onClick={() => toast.success("Food post reserved — pay cash on collection.")}
              className="mt-6 w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {soldOut ? "Sold out" : "Reserve this food post"}
            </Button>

            {business && (
              <Link
                to="/business/$businessId"
                params={{ businessId: business.id }}
                className="surface-card mt-6 flex items-center gap-4 p-4 transition-colors hover:border-primary"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground">
                  {business.logoInitials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{business.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {businessTypeLabels[business.type]} · {business.neighborhood}
                  </p>
                  <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> ~1.2 km away
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-accent text-accent" />
                      {business.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      {business.fulfillment === "delivery" ? (
                        <Bike className="size-3.5" />
                      ) : (
                        <ShoppingBag className="size-3.5" />
                      )}
                    </span>
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            )}
          </div>
        </div>

        {more.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-semibold">More from {business?.name}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {more.map((b) => (
                <BagCard key={b.id} bag={b} />
              ))}
            </div>
          </section>
        )}
      </article>
    </PublicLayout>
  );
}
