import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, ChevronRight, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/data/mock";
import { useAuth } from "@/lib/auth/auth-context";
import { orderStatusLabels, statusBadgeClass } from "@/lib/order-status";
import { useMyOrders } from "@/lib/customer-orders";

export const Route = createFileRoute("/account/orders/")({
  component: OrderHistory,
});

function OrderHistory() {
  const { user } = useAuth();
  const orders = useMyOrders(Boolean(user));

  if (orders === undefined) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading orders…</div>;
  }

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
        Statuses update live as the vendor confirms, prepares and hands over your order.
      </p>
      {orders.map((order) => (
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
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(order.status)}`}>
                {orderStatusLabels[order.status]}
              </span>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {order.items.length} item{order.items.length === 1 ? "" : "s"} · {order.vendorName}
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
      ))}
    </div>
  );
}
