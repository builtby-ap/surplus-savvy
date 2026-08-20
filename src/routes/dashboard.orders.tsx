import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/mock";
import { flowFor, orderStatusLabels, statusBadgeClass } from "@/lib/order-status";
import { useMyVendor } from "@/lib/use-my-vendor";
import {
  fetchVendorOrders,
  updateOrderStatus,
  type VendorOrder,
} from "@/lib/vendor-db";

export const Route = createFileRoute("/dashboard/orders")({
  component: VendorOrdersPage,
});

function nextStatus(order: VendorOrder) {
  const flow = flowFor(order.method);
  const index = flow.indexOf(order.status);
  if (index < 0 || index >= flow.length - 1) return null;
  return flow[index + 1]!;
}

function VendorOrdersPage() {
  const { vendorId, loading: vendorLoading } = useMyVendor();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");


  const refresh = useCallback(async () => {
    if (!vendorId) return;
    try {
      setOrders(await fetchVendorOrders(vendorId));
    } catch {
      toast.error("Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (vendorLoading) return;
    if (!vendorId) {
      setLoading(false);
      return;
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [vendorId, vendorLoading, refresh]);

  async function move(order: VendorOrder, status: Parameters<typeof updateOrderStatus>[1], message: string) {
    try {
      await updateOrderStatus(order.id, status);
      await refresh();
      toast.success(message);
    } catch {
      toast.error("Could not update that order.");
    }
  }

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    if (
      q &&
      !`${o.receiptNumber} ${o.notes} ${o.deliveryAddress ?? ""} ${o.items
        .map((i) => i.title)
        .join(" ")}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (methodFilter !== "all" && o.method !== methodFilter) return false;
    return true;
  });

  const pending = filtered.filter((o) => o.status === "pending");
  const active = filtered.filter(
    (o) =>
      o.status !== "pending" &&
      !["delivered", "picked-up", "cancelled", "refunded"].includes(o.status),
  );
  const past = filtered.filter((o) =>
    ["delivered", "picked-up", "cancelled", "refunded"].includes(o.status),
  );


  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Accept or reject incoming reservations, then move each order through preparation to
          hand-off.
        </p>
      </header>

      {!vendorLoading && !vendorId && (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          You don't have a store yet — set one up on the Store profile page.
        </p>
      )}

      {vendorId && loading && (
        <p className="surface-card p-6 text-sm text-muted-foreground">Loading your orders…</p>
      )}

      {vendorId && !loading && (
        <>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              Incoming orders
              {pending.length > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                  {pending.length}
                </span>
              )}
            </h2>
            <div className="mt-3 space-y-3">
              {pending.length === 0 && (
                <p className="surface-card p-6 text-sm text-muted-foreground">
                  No orders waiting for confirmation right now.
                </p>
              )}
              {pending.map((order) => (
                <OrderCard key={order.id} order={order}>
                  <Button
                    size="sm"
                    onClick={() =>
                      void move(order, "confirmed", `Order ${order.receiptNumber} confirmed`)
                    }
                  >
                    <Check className="size-4" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void move(order, "rejected", `Order ${order.receiptNumber} rejected`)
                    }
                  >
                    <X className="size-4" /> Reject
                  </Button>
                </OrderCard>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">In progress</h2>
            <div className="mt-3 space-y-3">
              {active.length === 0 && (
                <p className="surface-card p-6 text-sm text-muted-foreground">
                  Nothing in progress. Confirmed orders show up here.
                </p>
              )}
              {active.map((order) => {
                const next = nextStatus(order);
                return (
                  <OrderCard key={order.id} order={order}>
                    {next && (
                      <Button
                        size="sm"
                        onClick={() =>
                          void move(
                            order,
                            next,
                            `Order ${order.receiptNumber} → ${orderStatusLabels[next]}`,
                          )
                        }
                      >
                        Mark {orderStatusLabels[next].toLowerCase()}
                        <ChevronRight className="size-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void move(order, "cancelled", `Order ${order.receiptNumber} cancelled`)
                      }
                    >
                      Cancel
                    </Button>
                  </OrderCard>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Completed</h2>
            <div className="mt-3 space-y-3">
              {past.length === 0 && (
                <p className="surface-card p-6 text-sm text-muted-foreground">
                  No completed orders yet.
                </p>
              )}
              {past.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function OrderCard({
  order,
  children,
}: {
  order: VendorOrder;
  children?: React.ReactNode;
}) {
  return (
    <article className="surface-card flex flex-wrap items-start gap-4 p-5">
      <div className="min-w-56 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{order.receiptNumber}</span>
          <Badge variant="outline" className={statusBadgeClass(order.status)}>
            {orderStatusLabels[order.status]}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {order.method}
          </Badge>
        </div>
        <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
          {order.items.map((item) => (
            <li key={item.id}>
              {item.quantity} × {item.title}
            </li>
          ))}
        </ul>
        {order.notes && (
          <p className="mt-2 text-sm italic text-muted-foreground">“{order.notes}”</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {order.method === "delivery"
            ? order.deliveryAddress
            : `Pickup ${order.pickupWindow ?? ""}`}{" "}
          · placed {new Date(order.placedAt).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-lg font-semibold">{formatPrice(order.total)}</span>
        <div className="flex flex-wrap justify-end gap-2">{children}</div>
      </div>
    </article>
  );
}
