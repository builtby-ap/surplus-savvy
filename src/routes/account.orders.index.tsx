import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, ChevronRight, Search, ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/data/mock";
import { useAuth } from "@/lib/auth/auth-context";
import { orderStatusLabels, statusBadgeClass, type OrderStatus } from "@/lib/order-status";
import { useMyOrders, type CustomerOrder } from "@/lib/customer-orders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CurrentOrderDetails } from "@/components/account/current-order-details";

export const Route = createFileRoute("/account/orders/")({
  head: () => ({ meta: [
    { title: "Your Orders | Phoe La Min" },
    { name: "description", content: "Track your current Phoe La Min order, view pickup and delivery details, and browse your order history." },
    { property: "og:title", content: "Your Orders | Phoe La Min" },
    { property: "og:description", content: "Your food rescue orders, progress, and collection details in one place." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: OrderHistory,
});

const ACTIVE: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "out-for-delivery"];
const COMPLETED: OrderStatus[] = ["delivered", "picked-up", "cancelled", "refunded"];
const DAY = 86_400_000;

function OrderCard({ order, prominent }: { order: CustomerOrder; prominent?: boolean }) {
  return (
    <Link
      to="/account/orders/$orderId"
      params={{ orderId: order.id }}
      className={`${prominent ? "" : "surface-card"} flex items-center gap-3 p-5 transition hover:bg-muted/30 sm:gap-4`}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        {order.method === "delivery" ? <Bike className="size-5" /> : <ShoppingBag className="size-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{order.receiptNumber}</span>
          {order.paymentStatus === "awaiting_verification" ? (
            <span className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-xs font-medium">
              Payment under review
            </span>
          ) : order.paymentStatus === "rejected" ? (
            <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
              Payment rejected
            </span>
          ) : (
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(order.status)}`}>
              {orderStatusLabels[order.status]}
            </span>
          )}
        </div>
        <p className={`${prominent ? "break-words" : "truncate"} text-sm text-muted-foreground`}>
          {prominent ? order.items.map((i) => `${i.quantity}× ${i.title}`).join(", ") : `${order.items.length} item${order.items.length === 1 ? "" : "s"}`} · {order.vendorName}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(order.placedAt).toLocaleString()} · {order.method === "delivery" ? "Delivery" : "Pickup"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold">{formatPrice(order.total)}</p>
        {prominent ? <p className="text-xs font-medium text-primary">Track order</p> : null}
        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
      </div>
    </Link>
  );
}

const selectCls = "h-10 rounded-md border border-input bg-background px-3 text-sm";

function OrderHistory() {
  const { user } = useAuth();
  const orders = useMyOrders(Boolean(user));
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(
    () => [...(orders ?? [])].sort((a, b) => +new Date(b.placedAt) - +new Date(a.placedAt)),
    [orders],
  );
  const current = sorted.find((o) => ACTIVE.includes(o.status));
  const history = sorted.filter((o) => COMPLETED.includes(o.status));
  const filtering = q.trim() !== "" || status !== "all" || range !== "all";

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const now = Date.now();
    return history.filter((o) => {
      if (status === "delivered" && !(o.status === "delivered" || o.status === "picked-up")) return false;
      if (status === "cancelled" && !(o.status === "cancelled" || o.status === "refunded")) return false;
      const t = +new Date(o.placedAt);
      if (range === "7" && t < now - 7 * DAY) return false;
      if (range === "30" && t < now - 30 * DAY) return false;
      if (range === "90" && t < now - 90 * DAY) return false;
      if (range === "custom") {
        if (from && t < +new Date(from)) return false;
        if (to && t > +new Date(to) + DAY - 1) return false;
      }
      if (!term) return true;
      return (
        o.receiptNumber.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term) ||
        o.vendorName.toLowerCase().includes(term) ||
        o.items.some((i) => i.title.toLowerCase().includes(term))
      );
    });
  }, [history, q, status, range, from, to]);

  if (orders === undefined) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading orders…</div>;
  }

  const visible = filtering || showAll ? results : results.slice(0, 3);

  function clear() {
    setQ(""); setStatus("all"); setRange("all"); setFrom(""); setTo(""); setShowAll(false);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Current Order</h2>
        {current ? (
          <div className="surface-card overflow-hidden border-2 border-primary/40">
            <OrderCard order={current} prominent />
            <CurrentOrderDetails order={current} />
          </div>
        ) : (
          <div className="surface-card p-8 text-center text-muted-foreground">
            You don't have any active orders.
            <div>
              <Link to="/search" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground">
                Browse food posts
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Order History{" "}
          <span className="text-sm font-normal text-muted-foreground">
            · {filtering ? `${results.length} Order${results.length === 1 ? "" : "s"} Found` : `${Math.min(3, history.length)} Recent Orders`}
          </span>
        </h2>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your orders..." className="h-10 pl-9" />
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              <option value="all">All</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select aria-label="Date" value={range} onChange={(e) => setRange(e.target.value)} className={selectCls}>
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 3 Months</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          {filtering ? (
            <Button variant="ghost" size="sm" onClick={clear} className="h-10 self-start md:self-auto">
              <X className="size-4" /> Clear Filters
            </Button>
          ) : null}
        </div>
        {range === "custom" ? (
          <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
            <Input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        ) : null}

        {visible.length === 0 ? (
          <div className="surface-card p-8 text-center text-muted-foreground">
            {history.length === 0 ? "No completed orders yet." : "No matching orders found."}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        )}

        {!filtering && !showAll && history.length > 3 ? (
          <div className="text-center">
            <Button variant="outline" className="rounded-full" onClick={() => setShowAll(true)}>
              View All Orders
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
