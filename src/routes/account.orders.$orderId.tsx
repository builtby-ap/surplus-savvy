import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Ban, Check, Receipt } from "lucide-react";
import { formatPrice, getBusiness } from "@/data/mock";
import { ensureDemoOrders } from "@/lib/demo-orders";
import {
  deriveStatus,
  flowFor,
  isTerminal,
  orderStatusDescriptions,
  orderStatusLabels,
  statusBadgeClass,
  useLiveStatus,
} from "@/lib/order-status";
import { getPlacedOrder, type PlacedOrder } from "@/lib/orders";

export const Route = createFileRoute("/account/orders/$orderId")({
  component: OrderTracking,
});

function OrderTracking() {
  const { orderId } = useParams({ from: "/account/orders/$orderId" });
  const [order, setOrder] = useState<PlacedOrder | null | undefined>(undefined);

  useEffect(() => {
    ensureDemoOrders();
    setOrder(getPlacedOrder(orderId) ?? null);
  }, [orderId]);

  const liveStatus = useLiveStatus(order ?? undefined);

  if (order === undefined) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading order…</div>;
  }

  if (order === null) {
    return (
      <div className="surface-card p-10 text-center">
        <h2 className="text-xl font-semibold">Order not found</h2>
        <Link to="/account/orders" className="mt-4 inline-block text-primary underline">
          Back to order history
        </Link>
      </div>
    );
  }

  const status = liveStatus ?? deriveStatus(order);
  const flow = flowFor(order.method);
  const currentIndex = flow.indexOf(status);
  const vendors = order.businessIds.map((id) => getBusiness(id)?.name).filter(Boolean);

  return (
    <div className="space-y-6">
      <Link to="/account/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Order history
      </Link>

      <div className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{order.receiptNumber}</h2>
            <p className="text-sm text-muted-foreground">
              Placed {new Date(order.placedAt).toLocaleString()} · {order.method === "delivery" ? "Delivery" : "Pickup"}
              {vendors.length > 0 ? ` · ${vendors.join(", ")}` : ""}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusBadgeClass(status)}`}>
            {orderStatusLabels[status]}
          </span>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{orderStatusDescriptions[status]}</p>

        <div className="mt-8">
          {isTerminal(status) ? (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <Ban className="mt-0.5 size-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">{orderStatusLabels[status]}</p>
                <p className="text-sm text-muted-foreground">{orderStatusDescriptions[status]}</p>
              </div>
            </div>
          ) : (
            <ol className="relative space-y-6 pl-2">
              {flow.map((step, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                return (
                  <li key={step} className="relative flex gap-4">
                    {i < flow.length - 1 && (
                      <span
                        aria-hidden
                        className={`absolute left-[15px] top-9 h-[calc(100%+0.4rem)] w-0.5 ${done ? "bg-success" : "bg-border"}`}
                      />
                    )}
                    <span
                      className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                        done
                          ? "border-success bg-success text-white"
                          : active
                            ? "border-primary bg-primary/10 text-primary animate-pulse"
                            : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                    </span>
                    <div className="pb-1">
                      <p className={`font-medium ${active ? "text-primary" : done ? "" : "text-muted-foreground"}`}>
                        {orderStatusLabels[step]}
                      </p>
                      <p className="text-sm text-muted-foreground">{orderStatusDescriptions[step]}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-semibold">Items</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.bagId} className="flex justify-between gap-4">
              <span>
                {item.quantity} × {item.title}
              </span>
              <span className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
          <span>Total (cash on {order.method})</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        <Link
          to="/order/$orderId"
          params={{ orderId: order.id }}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Receipt className="size-4" /> View e-receipt
        </Link>
      </div>
    </div>
  );
}
