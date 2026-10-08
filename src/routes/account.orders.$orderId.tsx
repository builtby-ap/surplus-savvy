import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Ban, Receipt } from "lucide-react";
import { formatPrice } from "@/data/mock";
import { useAuth } from "@/lib/auth/auth-context";
import {
  isTerminal,
  orderStatusDescriptions,
  orderStatusLabels,
  statusBadgeClass,
} from "@/lib/order-status";
import { useMyOrder } from "@/lib/customer-orders";
import { PaymentReviewPanel } from "@/components/checkout/payment-review";
import { CurrentOrderDetails } from "@/components/account/current-order-details";


export const Route = createFileRoute("/account/orders/$orderId")({
  head: () => ({ meta: [
    { title: "Track Your Order | Phoe La Min" },
    { name: "description", content: "Follow your Phoe La Min order and see pickup or delivery instructions and recorded order times." },
    { property: "og:title", content: "Track Your Order | Phoe La Min" },
    { property: "og:description", content: "Order progress and pickup or delivery details for your food rescue." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: OrderTracking,
});

function OrderTracking() {
  const { orderId } = useParams({ from: "/account/orders/$orderId" });
  const { user } = useAuth();
  const order = useMyOrder(orderId, Boolean(user));

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

  const status = order.status;

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
              {order.vendorName ? ` · ${order.vendorName}` : ""}
            </p>
          </div>
          {order.paymentStatus === "awaiting_verification" ? (
            <span className="rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-sm font-medium">
              Payment under review
            </span>
          ) : order.paymentStatus === "rejected" ? (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
              Payment rejected
            </span>
          ) : (
            <span className={`rounded-full border px-3 py-1 text-sm font-medium ${statusBadgeClass(status)}`}>
              {orderStatusLabels[status]}
            </span>
          )}

        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {order.paymentStatus === "awaiting_verification"
            ? "Payment under review — the vendor will start preparing once your payment is verified."
            : orderStatusDescriptions[status]}
        </p>

        <div className="mt-8">
          {order.paymentStatus === "awaiting_verification" || order.paymentStatus === "rejected" ? (
            <PaymentReviewPanel
              status={order.paymentStatus}
              orderId={order.id}
              screenshotPath={order.paymentScreenshotUrl}
            />
          ) : isTerminal(status) ? (

            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <Ban className="mt-0.5 size-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">{orderStatusLabels[status]}</p>
                <p className="text-sm text-muted-foreground">{orderStatusDescriptions[status]}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <CurrentOrderDetails order={order} />

      <div className="surface-card p-6">
        <h3 className="font-semibold">Items</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
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
