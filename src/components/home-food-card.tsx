import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Clock3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { discountPercent, formatPrice, getBusiness, type MysteryBag } from "@/data/mock";
import { formatDuration, useCountdown } from "@/lib/countdown";
import { useAuth } from "@/lib/auth/auth-context";

export function HomeFoodCard({ bag, urgent = false }: { bag: MysteryBag; urgent?: boolean }) {
  const business = getBusiness(bag.businessId);
  const remaining = useCountdown(bag.availableUntil);
  const navigate = useNavigate();
  const { user } = useAuth();
  const add = () => {
    if (user) void navigate({ to: "/checkout", search: { bag: bag.id, qty: 1 } });
    else void navigate({ to: "/login", search: { redirect: `/checkout?bag=${encodeURIComponent(bag.id)}&qty=1` } });
  };
  return <article className="w-[235px] shrink-0 snap-start overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-soft)] sm:w-[260px]">
    <Link to="/bag/$bagId" params={{ bagId: bag.id }} className="group relative block aspect-[4/3] overflow-hidden bg-secondary">
      <img src={bag.image} alt={bag.title} loading="lazy" width={520} height={390} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <span className="absolute left-3 top-3 rounded bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">-{discountPercent(bag)}%</span>
      {urgent && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded bg-card px-2.5 py-1 text-xs font-semibold text-foreground"><Clock3 className="size-3.5 text-destructive" />{remaining === null ? `Until ${bag.availableUntil}` : formatDuration(remaining)}</span>}
    </Link>
    <div className="p-4">
      <Link to="/bag/$bagId" params={{ bagId: bag.id }} className="block truncate text-base font-semibold text-foreground hover:text-primary">{bag.title}</Link>
      <p className="mt-0.5 truncate text-sm text-muted-foreground">{business?.name ?? "Local restaurant"}</p>
      {urgent && <p className="mt-2 text-xs font-medium text-destructive">{bag.quantityLeft} {bag.quantityLeft === 1 ? "bag" : "bags"} remaining</p>}
      <div className="mt-3 flex items-baseline gap-2"><span className="font-semibold text-foreground">{formatPrice(bag.discountedPrice)}</span><span className="text-xs text-muted-foreground line-through">{formatPrice(bag.originalPrice)}</span></div>
      <Button onClick={add} size="sm" className="mt-4 w-full rounded-md" aria-label={`Add ${bag.title} to cart`}>Add to cart <Plus className="size-4" /></Button>
    </div>
  </article>;
}

export function SectionHeading({ title, description, to, search }: { title: string; description: string; to?: "/search"; search?: { closingSoon: boolean } }) {
  return <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3"><div className="min-w-0"><h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{to && <Link to={to} search={search} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">See all <ArrowRight className="size-4" /></Link>}</div>;
}
