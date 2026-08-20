import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, ChevronRight, ShoppingBag } from "lucide-react";
import { formatPrice, getBusiness } from "@/data/mock";
import { useAuth } from "@/lib/auth/auth-context";
import { ensureDemoOrders } from "@/lib/demo-orders";
import { deriveStatus, orderStatusLabels, statusBadgeClass } from "@/lib/order-status";
import { listPlacedOrders, type PlacedOrder } from "@/lib/orders";

export const Route = createFileRoute("/account/orders/")({
  component: OrderHistory,
});

function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    ensureDemoOrders(user);
    setOrders(listPlacedOrders(user.id));
    const timer = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(timer);
  }, [user]);

  if (orders.length === 0) {
    return (
      <div className="surface-card p-10 text-center">
        <h2 className="text-xl font-semibold">No orders yet</h2>
        <p className="mt-2 text-muted-foreground">Rescue your first food post and it will show up here.</p>
        <Link to="/search" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground">
          Browse food posts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Active orders update live — statuses advance automatically while you watch.
      </p>
      {orders.map((order) => {
        const status = deriveStatus(order);
        const vendors = order.businessIds
          .map((id) => getBusiness(id)?.name)
          .filter(Boolean)
          .join(", ");
        return (
          <Link
            key={order.id}
            to="/account/orders/$orderId"
            params={{ orderId: order.id }}
            className="surface-card flex items-center gap-4 p-5 transition hover:shadow-lg"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              {order.method === "delivery" ? <Bike className="size-5" /> : <ShoppingBag className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{order.receiptNumber}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}>
                  {orderStatusLabels[status]}
                </span>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {order.items.length} item{order.items.length === 1 ? "" : "s"} · {vendors || "Vendor"}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.placedAt).toLocaleString()} · {order.method === "delivery" ? "Delivery" : "Pickup"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatPrice(order.total)}</p>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
