import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Bike, Check, Download, MapPin, Phone, Printer, ShoppingBag, Timer } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { businessTypeLabels, formatPrice, getBusiness } from "@/data/mock";
import { getPlacedOrder, type PlacedOrder } from "@/lib/orders";
import { fetchMyOrder } from "@/lib/customer-orders";


export const Route = createFileRoute("/order/$orderId")({
  head: () => ({
    meta: [
      { title: "Order receipt — Surplus Rescue" },
      { name: "description", content: "Your food post is reserved. See your receipt number, itemised total and pickup or delivery details." },
      { property: "og:title", content: "Order receipt — Surplus Rescue" },
      { property: "og:description", content: "Your food post is reserved. See your receipt number, itemised total and pickup or delivery details." },
    ],
  }),
  component: OrderReceipt,
});

function OrderReceipt() {
  const { orderId } = useParams({ from: "/order/$orderId" });
  const [order, setOrder] = useState<PlacedOrder | null | undefined>(undefined);
  const [vendor, setVendor] = useState<{
    name: string;
    type: string;
    address: string;
    neighborhood: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    const local = getPlacedOrder(orderId);
    if (local) {
      setOrder(local);
      // Still fetch the vendor's public contact details so pickup customers
      // have a phone number to call if they can't find the shop.
      import("@/integrations/supabase/client").then(({ supabase }) =>
        supabase
          .from("vendors_public")
          .select("display_alias, type, address, neighborhood, phone")
          .eq("id", local.businessId)
          .maybeSingle()
          .then(({ data }) => {
            if (!alive || !data) return;
            const v = data as Record<string, unknown>;
            setVendor({
              name: String(v['display_alias'] ?? ""),
              type: String(v['type'] ?? ""),
              address: String(v['address'] ?? ""),
              neighborhood: String(v['neighborhood'] ?? ""),
              phone: String(v['phone'] ?? ""),
            });
          }),
      );
      return () => {
        alive = false;
      };
    }
    fetchMyOrder(orderId)
      .then((row) => {
        if (!alive) return;
        if (!row) {
          setOrder(null);
          return;
        }
        setVendor({
          name: row.vendorName,
          type: row.vendorType,
          address: row.vendorAddress,
          neighborhood: row.vendorNeighborhood,
          phone: row.vendorPhone,
        });
        setOrder({
          id: row.id,
          receiptNumber: row.receiptNumber,
          items: row.items.map((i) => ({
            bagId: i.id,
            businessId: row.vendorId,
            title: i.title,
            quantity: i.quantity,
            originalPrice: i.originalPrice,
            unitPrice: i.unitPrice,
          })),
          businessId: row.vendorId,
          businessIds: [row.vendorId],
          method: row.method,
          notes: row.notes,
          originalPrice: row.originalPrice,
          itemPrice: row.itemPrice,
          discount: row.discount,
          deliveryFee: row.deliveryFee,
          total: row.total,
          ...(row.deliveryAddress ? { deliveryAddress: row.deliveryAddress } : {}),
          ...(row.pickupWindow ? { pickupWindow: row.pickupWindow } : {}),
          placedAt: row.placedAt,
        });
      })
      .catch(() => alive && setOrder(null));
    return () => {
      alive = false;
    };
  }, [orderId]);

  if (order === undefined) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
          Loading receipt…
        </section>
      </PublicLayout>
    );
  }

  if (order === null) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold">Receipt not found</h1>
          <p className="mt-3 text-muted-foreground">
            We couldn't find order {orderId} on this device.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/search">Browse food posts</Link>
          </Button>
        </section>
      </PublicLayout>
    );
  }

  const mocked = (order.businessIds ?? [order.businessId])
    .map((id) => getBusiness(id))
    .filter((b): b is NonNullable<ReturnType<typeof getBusiness>> => Boolean(b));
  const businesses = mocked.length
    ? mocked.map((b) => ({
        id: b.id,
        name: b.name,
        typeLabel: businessTypeLabels[b.type],
        address: b.address,
        neighborhood: b.neighborhood,
      }))
    : vendor
      ? [
          {
            id: order.businessId,
            name: vendor.name,
            typeLabel: vendor.type.replace(/_/g, " "),
            address: vendor.address,
            neighborhood: vendor.neighborhood,
          },
        ]
      : [];
  const business = businesses[0];
  const placed = new Date(order.placedAt);


  return (
    <PublicLayout>
      <section className="mx-auto max-w-2xl px-4 py-10">
        <div className="text-center print:hidden">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/20 text-success">
            <Check className="size-6" />
          </span>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl">
            {order.method === "pickup" ? "Payment under review" : "Order confirmed"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {order.method === "pickup"
              ? "The vendor will start preparing once your payment is verified."
              : `Show this receipt to ${business?.name ?? "the vendor"} and pay cash on delivery.`}
          </p>
        </div>


        <article className="surface-card mt-8 p-6 print:border-0 print:shadow-none">
          <header className="flex items-start justify-between gap-4 border-b border-dashed border-border pb-4">
            <div>
              <p className="font-[family-name:var(--font-display)] text-xl text-primary">
                Surplus Rescue
              </p>
              <p className="text-xs text-muted-foreground">Digital e-receipt</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="text-sm font-semibold text-foreground">{order.receiptNumber}</p>
              <p>{placed.toLocaleString()}</p>
            </div>
          </header>

          <div className="grid gap-4 border-b border-dashed border-border py-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Vendor{businesses.length > 1 ? "s" : ""}
              </p>
              {businesses.map((b) => (
                <div key={b.id}>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-muted-foreground capitalize">{b.typeLabel}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {order.method === "delivery" ? "Delivery" : "Pickup"}
              </p>
              {order.method === "delivery" ? (
                <p className="flex items-start gap-2">
                  <Bike className="mt-0.5 size-4 shrink-0 text-primary" />
                  {order.deliveryAddress}
                </p>
              ) : (
                <>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    {business?.address}, {business?.neighborhood}
                  </p>
                  <p className="mt-1 flex items-center gap-2">
                    <Timer className="size-4 shrink-0 text-primary" />
                    {order.pickupWindow}
                  </p>
                  {vendor?.phone && (
                    <p className="mt-1 flex items-center gap-2">
                      <Phone className="size-4 shrink-0 text-primary" />
                      <a href={`tel:${vendor.phone}`} className="font-medium underline-offset-2 hover:underline">
                        {vendor.phone}
                      </a>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="border-b border-dashed border-border py-4">
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.bagId} className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2 font-medium">
                    <ShoppingBag className="size-4 shrink-0 text-primary" />
                    {item.title} × {item.quantity}
                  </span>
                  <span className="shrink-0 text-sm">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Original price</dt>
                <dd className="line-through">{formatPrice(order.originalPrice)}</dd>
              </div>
              <div className="flex justify-between text-success">
                <dt>Rescue discount</dt>
                <dd>-{formatPrice(order.discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Food post price</dt>
                <dd>{formatPrice(order.itemPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery fee</dt>
                <dd>{order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : "—"}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>{order.method === "pickup" ? "Total paid by MMQR" : "Total due in cash"}</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>

            </dl>
          </div>

          {order.notes && (
            <div className="border-b border-dashed border-border py-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Special requests
              </p>
              <p className="mt-1">{order.notes}</p>
            </div>
          )}

          <p className="pt-4 text-center text-xs text-muted-foreground">
            Surplus Rescue never takes online payment. Please bring exact change where possible.
          </p>
        </article>

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <Button
            onClick={() => toast.info("Receipt saving will be available soon.")}
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Download className="size-4" /> Download / save receipt
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => window.print()}>
            <Printer className="size-4" /> Print
          </Button>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/search">Keep browsing</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
