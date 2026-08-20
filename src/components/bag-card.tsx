import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Star } from "lucide-react";
import {
  bagCategoryLabels,
  discountPercent,
  formatPrice,
  getBusiness,
  type MysteryBag,
} from "@/data/mock";
import { Badge } from "@/components/ui/badge";

export function BagCard({ bag, eager = false }: { bag: MysteryBag; eager?: boolean }) {
  const business = getBusiness(bag.businessId);
  const soldOut = bag.quantityLeft === 0;
  const low = bag.quantityLeft > 0 && bag.quantityLeft <= 3;

  return (
    <Link
      to="/bag/$bagId"
      params={{ bagId: bag.id }}
      className="surface-card group block overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={bag.image}
          alt={`${bag.title} from ${business?.name ?? "a local business"}`}
          loading={eager ? "eager" : "lazy"}
          width={1024}
          height={768}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3 rounded-full bg-accent text-accent-foreground">
          -{discountPercent(bag)}%
        </Badge>
        {soldOut ? (
          <Badge className="absolute right-3 top-3 rounded-full bg-muted text-muted-foreground">
            Sold out
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
        <p className="text-xs text-muted-foreground">{bagCategoryLabels[bag.category]}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {bag.availableFrom}–{bag.availableUntil}
          </span>
          <span className="flex items-center gap-1 truncate">
            <MapPin className="size-3.5" />
            {business?.neighborhood}
          </span>
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-lg font-semibold text-accent">
            {formatPrice(bag.discountedPrice)}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(bag.originalPrice)}
          </span>
        </div>
      </div>
    </Link>
  );
}
