import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/data/mock";
import { useAuth } from "@/lib/auth/use-auth";
import { orderStatusLabels, statusBadgeClass, type OrderStatus } from "@/lib/order-status";
import { listOrdersForBusiness, type PlacedOrder } from "@/lib/orders";
import {
  acceptOrder,
  advanceOrder,
  ensureVendorDemoOrders,
  nextStatus,
  rejectOrder,
  statusOf,
} from "@/lib/vendor-orders";

export const Route = createFileRoute("/dashboard/orders")({
  component: VendorOrdersPage,
});

function VendorOrdersPage() {
  const { user } = useAuth();
  const businessId = user?.vendorId ?? "b1";
  const [orders, setOrders] = useState<PlacedOrder[]>([]);

  const refresh = useCallback(() => {
    setOrders(
      listOrdersForBusiness(businessId).sort(
        (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
      ),
    );
  }, [businessId]);

  useEffect(() => {
    ensureVendorDemoOrders(businessId);
    refresh();
  }, [businessId, refresh]);

  const pending = orders.filter((o) => statusOf(o) === "pending");
  const active = orders.filter((o) => {
    const s = statusOf(o);
    return s !== "pending" && !["delivered", "picked-up", "cancelled", "refunded"].includes(s);
  });
  const past = orders.filter((o) =>
    ["delivered", "picked-up", "cancelled", "refunded"].includes(statusOf(o)),
  );

  function handleAccept(order: PlacedOrder) {
    acceptOrder(order.id);
    refresh();
    toast.success(`Order ${order.receiptNumber} confirmed`);
  }

  function handleReject(order: PlacedOrder) {
    rejectOrder(order.id);
    refresh();
    toast(`Order ${order.receiptNumber} cancelled`);
  }

  function handleAdvance(order: PlacedOrder) {
    const next = advanceOrder(order);
    refresh();
    if (next) toast.success(`Order ${order.receiptNumber} → ${orderStatusLabels[next]}`);
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Accept or reject incoming reservations, then move each order through preparation to
          hand-off.
        </p>
      </header>

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
              <Button size="sm" onClick={() => handleAccept(order)}>
                <Check className="size-4" /> Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReject(order)}>
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
                  <Button size="sm" onClick={() => handleAdvance(order)}>
                    Mark {orderStatusLabels[next].toLowerCase()}
                    <ChevronRight className="size-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleReject(order)}>
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
            <p className="surface-card p-6 text-sm text-muted-foreground">No completed orders yet.</p>
          )}
          {past.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OrderCard({
  order,
  children,
}: {
  order: PlacedOrder;
  children?: React.ReactNode;
}) {
  const status: OrderStatus = statusOf(order);
  return (
    <article className="surface-card flex flex-wrap items-start gap-4 p-5">
      <div className="min-w-56 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{order.receiptNumber}</span>
          <Badge variant="outline" className={statusBadgeClass(status)}>
            {orderStatusLabels[status]}
          </Badge>
          <Badge variant="secondary" className="capitalize">
            {order.method}
          </Badge>
        </div>
        <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
          {order.items.map((item) => (
            <li key={item.bagId}>
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
        <Link
          to="/order/$orderId"
          params={{ orderId: order.id }}
          className="text-xs underline underline-offset-4"
        >
          View receipt
        </Link>
        <div className="flex flex-wrap justify-end gap-2">{children}</div>
      </div>
    </article>
  );
}
