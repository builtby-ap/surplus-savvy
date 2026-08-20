import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bike, Info, MapPin, Minus, Plus, ShoppingBag, Timer, Trash2 } from "lucide-react";
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
import { useCart } from "@/lib/cart";
import { newOrderIds, saveOrder, type OrderItem, type OrderMethod } from "@/lib/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    bag: typeof search["bag"] === "string" ? (search["bag"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Your cart & checkout — Surplus Rescue" },
      { name: "description", content: "Review the food posts in your cart, choose pickup or delivery and pay cash on collection." },
      { property: "og:title", content: "Your cart & checkout — Surplus Rescue" },
      { property: "og:description", content: "Review the food posts in your cart, choose pickup or delivery and pay cash on collection." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { bag: bagParam } = Route.useSearch();
  const navigate = useNavigate();
  const { lines, add, setQuantity, remove, clear } = useCart();

  // A "Reserve this food post" link lands here with ?bag=… — fold it into the cart.
  useEffect(() => {
    if (!bagParam) return;
    const bag = getBag(bagParam);
    if (bag && bag.quantityLeft > 0) add(bag.id, 1, bag.quantityLeft);
    void navigate({ to: "/checkout", search: { bag: "" }, replace: true });
  }, [bagParam, add, navigate]);

  const items = useMemo(
    () =>
      lines
        .map((line) => {
          const bag = getBag(line.bagId);
          const business = bag ? getBusiness(bag.businessId) : undefined;
          if (!bag || !business) return null;
          return { line, bag, business, terms: getDeliveryTerms(business) };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [lines],
  );

  const [method, setMethod] = useState<OrderMethod>("pickup");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("12 Larkspur Terrace, Old Town");
  const [placing, setPlacing] = useState(false);

  const vendors = useMemo(() => {
    const map = new Map<string, { business: (typeof items)[number]["business"]; terms: (typeof items)[number]["terms"]; subtotal: number }>();
    for (const it of items) {
      const entry = map.get(it.business.id) ?? { business: it.business, terms: it.terms, subtotal: 0 };
      entry.subtotal += it.bag.discountedPrice * it.line.quantity;
      map.set(it.business.id, entry);
    }
    return [...map.values()];
  }, [items]);

  const canDeliver =
    items.length > 0 &&
    items.every((it) => it.bag.fulfillment !== "pickup") &&
    vendors.every((v) => v.terms.offersDelivery);

  const subtotal = items.reduce((s, it) => s + it.bag.discountedPrice * it.line.quantity, 0);
  const originalTotal = items.reduce((s, it) => s + it.bag.originalPrice * it.line.quantity, 0);
  const deliveryFee = method === "delivery" ? vendors.reduce((s, v) => s + v.terms.fee, 0) : 0;
  const total = subtotal + deliveryFee;
  const belowMinimum =
    method === "delivery" && vendors.some((v) => v.subtotal < v.terms.minimumOrder);

  if (items.length === 0) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <p className="mt-3 text-muted-foreground">
            Add one or more food posts, then come back to reserve them all in one order.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/search">Browse food posts</Link>
          </Button>
        </section>
      </PublicLayout>
    );
  }

  function placeOrder() {
    if (belowMinimum) {
      toast.error("One of the vendors' delivery minimums isn't met. Choose pickup or add more.");
      return;
    }
    setPlacing(true);
    const ids = newOrderIds();
    const orderItems: OrderItem[] = items.map((it) => ({
      bagId: it.bag.id,
      businessId: it.business.id,
      title: it.bag.title,
      quantity: it.line.quantity,
      originalPrice: it.bag.originalPrice,
      unitPrice: it.bag.discountedPrice,
    }));
    const firstItem = items[0]!;
    saveOrder({
      ...ids,
      items: orderItems,
      businessId: firstItem.business.id,
      businessIds: vendors.map((v) => v.business.id),
      method,
      notes: notes.trim(),
      originalPrice: Number(originalTotal.toFixed(2)),
      itemPrice: Number(subtotal.toFixed(2)),
      discount: Number((originalTotal - subtotal).toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      total: Number(total.toFixed(2)),
      ...(method === "delivery" ? { deliveryAddress: address } : {}),
      pickupWindow: `${firstItem.bag.availableFrom} – ${firstItem.bag.availableUntil}`,
      placedAt: new Date().toISOString(),
    });
    clear();
    toast.success("Order placed — pay cash on collection.");
    navigate({ to: "/order/$orderId", params: { orderId: ids.id } });
  }

  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Your cart</h1>
        <p className="mt-2 text-muted-foreground">
          Reserve several food posts in one order. No online payment — you pay cash when you collect
          or receive your order.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold">
                {items.length} food post{items.length > 1 ? "s" : ""} in your cart
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {items.map(({ line, bag, business }) => (
                  <li key={bag.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
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
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full"
                            aria-label={`Decrease quantity of ${bag.title}`}
                            onClick={() => setQuantity(bag.id, line.quantity - 1)}
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {line.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full"
                            aria-label={`Increase quantity of ${bag.title}`}
                            disabled={line.quantity >= bag.quantityLeft}
                            onClick={() => setQuantity(bag.id, line.quantity + 1)}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {bag.quantityLeft} left
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto rounded-full text-muted-foreground"
                          onClick={() => remove(bag.id)}
                        >
                          <Trash2 className="size-4" /> Remove
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground line-through">
                        {formatPrice(bag.originalPrice * line.quantity)}
                      </p>
                      <p className="font-semibold text-accent">
                        {formatPrice(bag.discountedPrice * line.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
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
                    {canDeliver
                      ? `${formatPrice(vendors.reduce((s, v) => s + v.terms.fee, 0))} fee total`
                      : "Not offered for every item in your cart"}
                  </span>
                </button>
              </div>

              {method === "delivery" ? (
                <div className="mt-4 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
                  {vendors.map((v) => (
                    <p key={v.business.id}>
                      {v.business.name}: fee <strong>{formatPrice(v.terms.fee)}</strong> · minimum{" "}
                      <strong>{formatPrice(v.terms.minimumOrder)}</strong>
                      {v.subtotal < v.terms.minimumOrder ? (
                        <span className="ml-1 font-medium text-destructive">
                          (you have {formatPrice(v.subtotal)})
                        </span>
                      ) : null}
                    </p>
                  ))}
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
                      A vendor's delivery minimum isn't met. Add more items or choose pickup.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
                  {vendors.map((v) => (
                    <div key={v.business.id} className="space-y-1">
                      <p className="font-medium">{v.business.name}</p>
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                        {v.business.address}, {v.business.neighborhood}
                      </p>
                    </div>
                  ))}
                  <p className="flex items-center gap-2">
                    <Timer className="size-4 shrink-0 text-primary" />
                    Collect within each food post's pickup window
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
                <dt>Food posts subtotal</dt>
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
              disabled={placing}
              onClick={placeOrder}
              className="mt-4 w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {placing ? "Placing order…" : "Place order"}
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
              <Link to="/search">Add more food posts</Link>
            </Button>
          </aside>
        </div>
      </section>
    </PublicLayout>
  );
}
