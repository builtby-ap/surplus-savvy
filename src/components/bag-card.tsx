import { Link } from "@tanstack/react-router";
import { Bike, MapPin, ShoppingBag, Star, Timer } from "lucide-react";
import {
  bagCategoryLabels,
  businessTypeLabels,
  categoryImages,
  discountPercent,
  formatPrice,
  getBusiness,
  type MysteryBag,
} from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { CLOSING_SOON_MS, formatDuration, useCountdown } from "@/lib/countdown";
import { cn } from "@/lib/utils";

export function FulfillmentIcons({ bag }: { bag: MysteryBag }) {
  const pickup = bag.fulfillment === "pickup" || bag.fulfillment === "both";
  const delivery = bag.fulfillment === "delivery" || bag.fulfillment === "both";
  return (
    <span className="flex items-center gap-2 text-muted-foreground">
      {pickup && (
        <span className="flex items-center gap-1" title="Pickup available">
          <ShoppingBag className="size-3.5" aria-hidden />
          <span className="sr-only">Pickup available</span>
        </span>
      )}
      {delivery && (
        <span className="flex items-center gap-1" title="Delivery available">
          <Bike className="size-3.5" aria-hidden />
          <span className="sr-only">Delivery available</span>
        </span>
      )}
    </span>
  );
}

export function BagCard({ bag, eager = false, unavailable = false }: { bag: MysteryBag; eager?: boolean; unavailable?: boolean }) {
  const business = getBusiness(bag.businessId);
  const soldOut = bag.quantityLeft === 0;
  const disabled = soldOut || unavailable;
  const low = bag.quantityLeft > 0 && bag.quantityLeft <= 3;
  const remaining = useCountdown(bag.availableUntil, 30000);
  const closingSoon = !disabled && remaining !== null && remaining > 0 && remaining <= CLOSING_SOON_MS;

  const inner = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={bag.image}
          onError={(event) => { const fallback = categoryImages[bag.category]; if (event.currentTarget.src !== new URL(fallback, window.location.href).href) event.currentTarget.src = fallback; }}
          alt={`${bag.title} from ${business?.name ?? "a local business"}`}
          loading={eager ? "eager" : "lazy"}
          width={1024}
          height={768}
          className={cn(
            "size-full object-cover transition-transform duration-500",
            disabled ? "grayscale" : "group-hover:scale-105",
          )}
        />
        <Badge className="absolute left-3 top-3 rounded-full bg-accent text-accent-foreground">
          -{discountPercent(bag)}%
        </Badge>
        {disabled ? (
          <Badge className="absolute right-3 top-3 rounded-full bg-muted text-muted-foreground">
            {soldOut ? "Sold out" : "Unavailable"}
          </Badge>
        ) : low ? (
          <Badge className="absolute right-3 top-3 rounded-full bg-warning text-warning-foreground">
            {bag.quantityLeft} left
          </Badge>
        ) : (
          <Badge className="absolute right-3 top-3 rounded-full bg-success text-success-foreground">
            {bag.quantityLeft} available
          </Badge>
        )}
        {closingSoon && (
          <Badge className="absolute bottom-3 left-3 rounded-full bg-destructive text-destructive-foreground">
            <Timer className="size-3.5" /> Closing soon
          </Badge>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-primary">{business?.name}</p>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-accent text-accent" />
            {bag.rating.toFixed(1)}
          </span>
        </div>
        <h3 className="truncate text-base font-semibold">{bag.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {business && (
            <Badge variant="outline" className="rounded-full text-[11px] font-normal">
              {businessTypeLabels[business.type]}
            </Badge>
          )}
          <Badge variant="secondary" className="rounded-full text-[11px] font-normal">
            {bagCategoryLabels[bag.category]}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Timer className="size-3.5" />
            {disabled
              ? soldOut ? "Sold out" : "Unavailable"
              : remaining === null
                ? `Until ${bag.availableUntil}`
                : formatDuration(remaining)}
          </span>
          <FulfillmentIcons bag={bag} />
        </div>
        <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {business?.neighborhood}
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-semibold text-accent">
            {formatPrice(bag.discountedPrice)}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(bag.originalPrice)}
          </span>
          <span className="text-xs font-medium text-success">-{discountPercent(bag)}%</span>
        </div>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div
        aria-disabled="true"
        className="surface-card pointer-events-none block overflow-hidden opacity-60"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to="/bag/$bagId"
      params={{ bagId: bag.id }}
      className="surface-card group block overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      {inner}
    </Link>
  );
}
