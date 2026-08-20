import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  ClipboardCheck,
  Leaf,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";
import { formatPrice } from "@/data/mock";
import { fetchAdminUsers, fetchAdminVendors, fetchPlatformOrders } from "@/lib/admin-db";
import {
  monthlyTrends,
  platformTotals,
  type MonthlyPoint,
  type PlatformTotals,
} from "@/lib/platform-stats";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [data, setData] = useState<{ totals: PlatformTotals; months: MonthlyPoint[] } | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([fetchPlatformOrders(), fetchAdminVendors(), fetchAdminUsers()])
      .then(([orders, vendors, users]) => {
        if (!active) return;
        const customers = users.filter((u) => u.role === "customer").length;
        setData({
          totals: platformTotals(orders, vendors, customers),
          months: monthlyTrends(orders, vendors),
        });
      })
      .catch(() => {
        if (active) setData({ totals: platformTotals([], []), months: monthlyTrends([], []) });
      });
    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(() => {
    if (!data) return [];
    const t = data.totals;
    return [
      { icon: Users, label: "Total customers", value: t.customers.toLocaleString(), hint: "Registered accounts" },
      { icon: Store, label: "Total vendors", value: String(t.vendors), hint: `${t.approvedVendors} approved` },
      { icon: ClipboardCheck, label: "Pending approvals", value: String(t.pendingVendors), hint: "Awaiting verification" },
      { icon: ShoppingBag, label: "Total orders", value: t.orders.toLocaleString(), hint: "Last 6 months" },
      { icon: TrendingUp, label: "Total revenue", value: formatPrice(t.revenue), hint: `${formatPrice(t.saved)} saved for customers` },
      { icon: Utensils, label: "Meals rescued", value: t.meals.toLocaleString(), hint: `${t.units.toLocaleString()} food posts collected` },
    ];
  }, [data]);

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading platform figures…</p>;
  }

  const thisMonth = data.months[data.months.length - 1];

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          An at-a-glance view of the whole marketplace — people, partners, orders and impact.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="surface-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <card.icon className="size-5" />
              <span className="text-sm">{card.label}</span>
            </div>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">This month so far</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Orders" value={String(thisMonth?.orders ?? 0)} />
            <Row label="Revenue" value={formatPrice(thisMonth?.revenue ?? 0)} />
            <Row label="New vendors" value={String(thisMonth?.vendors ?? 0)} />
            <Row label="New customers" value={String(thisMonth?.customers ?? 0)} />
          </dl>
          <Link
            to="/admin/analytics"
            className="mt-5 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            View system analytics
          </Link>
        </div>

        <div className="surface-card border-success/30 bg-success/10 p-5">
          <div className="flex items-center gap-2">
            <Leaf className="size-5" />
            <h2 className="text-lg font-semibold">Platform impact</h2>
          </div>
          <p className="mt-3 text-sm">
            Together the community has kept <strong>{data.totals.foodKg.toFixed(0)} kg</strong> of food out of the bin
            and avoided roughly <strong>{data.totals.co2Kg.toFixed(0)} kg</strong> of CO2e.
          </p>
          {data.totals.pendingVendors > 0 && (
            <Link
              to="/admin/businesses"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium"
            >
              <BadgeCheck className="size-4" />
              Review {data.totals.pendingVendors} pending vendor
              {data.totals.pendingVendors === 1 ? "" : "s"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
