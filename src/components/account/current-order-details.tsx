import { Check, Clock, MapPin, Phone, Receipt, ShoppingBag, Truck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { CustomerOrder } from "@/lib/customer-orders";
import { flowFor, orderStatusDescriptions, orderStatusLabels } from "@/lib/order-status";

function RecordedTime({ value }: { value?: string | null }) {
  if (!value || Number.isNaN(Date.parse(value))) return null;
  return <time dateTime={value}>{new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>;
}

export function CurrentOrderDetails({ order }: { order: CustomerOrder }) {
  const flow = flowFor(order.method);
  const currentIndex = flow.indexOf(order.status);
  const paymentBlocked = order.paymentStatus === "awaiting_verification" || order.paymentStatus === "rejected";
  const pickup = order.method === "pickup";

  return (
    <div className="border-t border-border px-5 py-5 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="Order timeline">
          <h3 className="flex items-center gap-2 font-semibold"><Clock className="size-4 text-primary" /> Order timeline</h3>
          {order.updatedAt ? <p className="mt-1 text-xs text-muted-foreground">Last order update: <RecordedTime value={order.updatedAt} /></p> : null}
          {paymentBlocked ? (
            <p role="status" className="mt-3 border-l-2 border-accent pl-3 text-sm text-muted-foreground">
              {order.paymentStatus === "rejected" ? "Payment proof was rejected. Open Track order to submit a new photo." : "Payment is under review. Preparation starts after verification."}
            </p>
          ) : order.paymentVerifiedAt ? (
            <p className="mt-3 text-xs text-success">Payment verified · <RecordedTime value={order.paymentVerifiedAt} /></p>
          ) : null}
          <ol className="mt-5 space-y-0">
            {flow.map((step, index) => {
              const reached = index === 0 || (!paymentBlocked && index <= currentIndex);
              const active = index === currentIndex;
              return (
                <li key={step} aria-current={active ? "step" : undefined} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < flow.length - 1 ? <span aria-hidden="true" className={`absolute left-3.5 top-7 bottom-0 w-px ${reached && index < currentIndex && !paymentBlocked ? "bg-success" : "bg-border"}`} /> : null}
                  <span aria-hidden="true" className={`relative flex size-7 shrink-0 items-center justify-center rounded-full border ${reached ? "border-success bg-success/15 text-success" : "border-border bg-background text-muted-foreground"}`}>
                    {reached ? <Check className="size-3.5" /> : <span className="text-xs">{index + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className={`text-sm font-semibold ${reached ? "text-foreground" : "text-muted-foreground"}`}>{index === 0 ? "Order placed" : orderStatusLabels[step]}{active ? <span className="ml-2 text-xs font-normal text-primary">Current</span> : null}</p>
                      <span className="text-xs text-muted-foreground">{index === 0 ? <RecordedTime value={order.placedAt} /> : reached ? "Time not recorded" : "Upcoming"}</span>
                    </div>
                    {active && !paymentBlocked ? <p className="mt-1 text-xs text-muted-foreground">{orderStatusDescriptions[step]}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-label={pickup ? "Pickup instructions" : "Delivery instructions"} className="min-w-0">
          <h3 className="flex items-center gap-2 font-semibold">{pickup ? <ShoppingBag className="size-4 text-primary" /> : <Truck className="size-4 text-primary" />}{pickup ? "Pickup instructions" : "Delivery instructions"}</h3>
          <dl className="mt-4 space-y-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">{pickup ? "Collect from" : "Deliver to"}</dt><dd className="mt-1 font-medium">{pickup ? order.vendorName : order.deliveryRecipientName || "Your saved delivery address"}</dd></div>
            <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><dt className="sr-only">Address</dt><dd className="break-words">{pickup ? [order.vendorAddress, order.vendorNeighborhood].filter(Boolean).join(", ") || "Pickup address not available." : order.deliveryAddress || "Delivery address not available."}</dd>{!pickup && order.deliveryBuildingFloor ? <dd className="mt-1 text-muted-foreground">{order.deliveryBuildingFloor}</dd> : null}</div></div>
            {pickup ? <div><dt className="text-xs text-muted-foreground">Pickup window</dt><dd className="mt-1 font-medium">{order.pickupWindow || "Pickup time not available."}</dd></div> : null}
            {pickup ? <div><dt className="text-xs text-muted-foreground">From the shop</dt><dd className="mt-1 whitespace-pre-line break-words">{order.pickupInstructions?.length ? order.pickupInstructions.join("\n") : "No additional pickup instructions provided."}</dd></div> : null}
            {!pickup ? <div><dt className="text-xs text-muted-foreground">Delivery note</dt><dd className="mt-1 whitespace-pre-line break-words">{order.deliveryNote || "No delivery instructions provided."}</dd></div> : null}
            {order.notes ? <div><dt className="text-xs text-muted-foreground">Order note</dt><dd className="mt-1 whitespace-pre-line break-words">{order.notes}</dd></div> : null}
            {(pickup ? order.vendorPhone : order.deliveryPhone) ? <div><dt className="text-xs text-muted-foreground">{pickup ? "Shop phone" : "Recipient phone"}</dt><dd className="mt-1"><a href={`tel:${pickup ? order.vendorPhone : order.deliveryPhone}`} className="inline-flex items-center gap-2 text-primary"><Phone className="size-4" />{pickup ? order.vendorPhone : order.deliveryPhone}</a></dd></div> : null}
          </dl>
          {pickup ? <p className="mt-5 text-xs text-muted-foreground">Show your e-receipt when collecting your order.</p> : null}
          <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/order/$orderId" params={{ orderId: order.id }}><Receipt /> View e-receipt</Link></Button>
        </section>
      </div>
    </div>
  );
}