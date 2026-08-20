import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bike, Info, MapPin, ShoppingBag, Timer } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/public-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  bagCategoryLabels,
  businessTypeLabels,
  formatPrice,
  getBag,
  getBusiness,
  getDeliveryTerms,
} from "@/data/mock";
import { newOrderIds, saveOrder, type OrderItem, type OrderMethod } from "@/lib/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    bag: typeof search["bag"] === "string" ? (search["bag"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Checkout — Surplus Rescue" },
      { name: "description", content: "Reserve a single surplus food post, choose pickup or delivery and pay cash on collection." },
      { property: "og:title", content: "Checkout — Surplus Rescue" },
      { property: "og:description", content: "Reserve a single surplus food post, choose pickup or delivery and pay cash on collection." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { bag: bagParam } = Route.useSearch();
  const navigate = useNavigate();

  const entry = useMemo(() => {
    const bag = getBag(bagParam);
    const business = bag ? getBusiness(bag.businessId) : undefined;
    if (!bag || !business) return null;
    return { bag, business, terms: getDeliveryTerms(business) };
  }, [bagParam]);

  const [method, setMethod] = useState<OrderMethod>("pickup");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("12 Larkspur Terrace, Old Town");
  const [placing, setPlacing] = useState(false);

  if (!entry) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold">No food post selected</h1>
          <p className="mt-3 text-muted-foreground">
            Each secret bag is unique to its vendor, so you reserve one food post at a time.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/search">Browse food posts</Link>
          </Button>
        </section>
      </PublicLayout>
    );
  }

  const { bag, business, terms } = entry;
  const canDeliver = bag.fulfillment !== "pickup" && terms.offersDelivery;
  const subtotal = bag.discountedPrice;
  const originalTotal = bag.originalPrice;
  const deliveryFee = method === "delivery" ? terms.fee : 0;
  const total = subtotal + deliveryFee;
  const belowMinimum = method === "delivery" && subtotal < terms.minimumOrder;

  function placeOrder() {
    if (belowMinimum) {
      toast.error("This vendor's delivery minimum isn't met. Choose pickup instead.");
      return;
    }
    setPlacing(true);
    const ids = newOrderIds();
    const orderItems: OrderItem[] = [
      {
        bagId: bag.id,
        businessId: business.id,
        title: bag.title,
        quantity: 1,
        originalPrice: bag.originalPrice,
        unitPrice: bag.discountedPrice,
      },
    ];
    saveOrder({
      ...ids,
      items: orderItems,
      businessId: business.id,
      businessIds: [business.id],
      method,
      notes: notes.trim(),
      originalPrice: Number(originalTotal.toFixed(2)),
      itemPrice: Number(subtotal.toFixed(2)),
      discount: Number((originalTotal - subtotal).toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      total: Number(total.toFixed(2)),
      ...(method === "delivery" ? { deliveryAddress: address } : {}),
      pickupWindow: `${bag.availableFrom} – ${bag.availableUntil}`,
      placedAt: new Date().toISOString(),
    });
    toast.success("Order placed — pay cash on collection.");
    navigate({ to: "/order/$orderId", params: { orderId: ids.id } });
  }

  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          One secret bag per order. No online payment — you pay cash when you collect or receive it.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold">Your food post</h2>
              <div className="mt-4 flex gap-3">
                <img
                  src={bag.image}
                  alt={bag.title}
                  loading="lazy"
                  className="size-20 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/bag/$bagId"
                    params={{ bagId: bag.id }}
                    className="truncate font-medium hover:underline"
                  >
                    {bag.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {business.name} · {businessTypeLabels[business.type]}
                  </p>
                  <Badge variant="secondary" className="mt-1 rounded-full text-[11px]">
                    {bagCategoryLabels[bag.category]}
                  </Badge>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {bag.quantityLeft} left · quantity 1
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground line-through">
                    {formatPrice(bag.originalPrice)}
                  </p>
                  <p className="font-semibold text-accent">{formatPrice(bag.discountedPrice)}</p>
                </div>
              </div>
            </div>

            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold">How would you like to get it?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMethod("pickup")}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    method === "pickup" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <ShoppingBag className="size-4" /> Pickup
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Collect in store — free
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!canDeliver}
                  onClick={() => setMethod("delivery")}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    method === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Bike className="size-4" /> Delivery
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {canDeliver ? `${formatPrice(terms.fee)} fee` : "Not offered for this food post"}
                  </span>
                </button>
              </div>

              {method === "delivery" ? (
                <div className="mt-4 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
                  <p>
                    {business.name}: fee <strong>{formatPrice(terms.fee)}</strong> · minimum{" "}
                    <strong>{formatPrice(terms.minimumOrder)}</strong>
                  </p>
                  <div>
                    <Label htmlFor="address">Delivery address</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className="mt-1 bg-background"
                    />
                  </div>
                  {belowMinimum && (
                    <p className="text-sm font-medium text-destructive">
                      This vendor's delivery minimum isn't met. Choose pickup instead.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
                  <p className="font-medium">{business.name}</p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    {business.address}, {business.neighborhood}
                  </p>
                  <p className="flex items-center gap-2">
                    <Timer className="size-4 shrink-0 text-primary" />
                    Collect between {bag.availableFrom} and {bag.availableUntil}
                  </p>
                </div>
              )}
            </div>

            <div className="surface-card p-5">
              <Label htmlFor="notes" className="text-sm font-semibold">
                Special requests {method === "delivery" ? "/ delivery notes" : ""}
              </Label>
              <Textarea
                id="notes"
                rows={4}
                maxLength={500}
                placeholder={
                  method === "delivery"
                    ? "Gate code, floor, where to leave it…"
                    : "Allergies, arrival time, anything the vendor should know…"
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">{notes.length}/500</p>
            </div>
          </div>

          <aside className="surface-card h-fit p-5">
            <h2 className="text-sm font-semibold">Order summary</h2>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Original value</dt>
                <dd className="line-through">{formatPrice(originalTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Food post price</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-success">
                <dt>You save</dt>
                <dd>-{formatPrice(originalTotal - subtotal)}</dd>
              </div>
              {method === "delivery" && (
                <div className="flex justify-between">
                  <dt>Delivery fee</dt>
                  <dd>{formatPrice(deliveryFee)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total due</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-accent/15 p-3 text-xs">
              <Info className="mt-0.5 size-4 shrink-0" />
              Pay cash on {method === "delivery" ? "delivery" : "pickup"} — Surplus Rescue never
              takes online payment.
            </p>

            <Button
              size="lg"
              disabled={placing || bag.quantityLeft === 0}
              onClick={placeOrder}
              className="mt-4 w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {placing ? "Placing order…" : "Place order"}
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
              <Link to="/search">Back to browsing</Link>
            </Button>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
