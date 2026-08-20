import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Receipt, ShoppingBag, TrendingUp, Utensils } from "lucide-react";
import { bagCategoryLabels, formatPrice, type BagCategory } from "@/data/mock";
import { useMyVendor } from "@/lib/use-my-vendor";
import {
  fetchVendorOrders,
  fetchVendorPosts,
  type VendorOrder,
  type VendorPost,
} from "@/lib/vendor-db";

export const Route = createFileRoute("/dashboard/analytics")({
  component: VendorAnalytics,
});

/** Rough factor: one rescued food post ≈ 1.4 meals. */
const MEALS_PER_ITEM = 1.4;

function VendorAnalytics() {
  const { vendorId, loading: vendorLoading } = useMyVendor();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [posts, setPosts] = useState<VendorPost[]>([]);

  useEffect(() => {
    if (!vendorId) return;
    let active = true;
    void Promise.all([fetchVendorOrders(vendorId), fetchVendorPosts(vendorId)])
      .then(([o, p]) => {
        if (!active) return;
        setOrders(o);
        setPosts(p);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [vendorId]);

  const paid = useMemo(
    () => orders.filter((o) => !["cancelled", "refunded"].includes(o.status)),
    [orders],
  );

  const stats = useMemo(() => {
    const items = paid.flatMap((o) => o.items);
    const units = items.reduce((s, i) => s + i.quantity, 0);
    const revenue = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return {
      revenue,
      count: paid.length,
      average: paid.length ? revenue / paid.length : 0,
      meals: Math.round(units * MEALS_PER_ITEM),
    };
  }, [paid]);

  const monthly = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleDateString(undefined, { month: "short" }),
        orders: 0,
        revenue: 0,
      };
    });
    for (const order of paid) {
      const d = new Date(order.placedAt);
      const bucket = buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (!bucket) continue;
      bucket.orders += 1;
      bucket.revenue += order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    }
    return buckets;
  }, [paid]);

  const categories = useMemo(() => {
    const categoryOf = new Map(posts.map((p) => [p.id, p.category]));
    const map = new Map<BagCategory, { units: number; revenue: number }>();
    for (const order of paid) {
      for (const item of order.items) {
        const category = item.foodPostId ? categoryOf.get(item.foodPostId) : undefined;
        if (!category) continue;
        const entry = map.get(category) ?? { units: 0, revenue: 0 };
        entry.units += item.quantity;
        entry.revenue += item.unitPrice * item.quantity;
        map.set(category, entry);
      }
    }
    return [...map.entries()]
      .map(([category, v]) => ({ category, label: bagCategoryLabels[category], ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paid, posts]);

  const maxRevenue = categories[0]?.revenue ?? 0;

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Revenue recovered, order volume and which food post categories sell best.
        </p>
      </header>

      {!vendorLoading && !vendorId && (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          You don't have a store yet — set one up on the Store profile page.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Revenue recovered"
          value={formatPrice(stats.revenue)}
          hint="From completed and active orders"
        />
        <StatCard
          icon={<ShoppingBag className="size-5" />}
          label="Orders"
          value={String(stats.count)}
          hint="Excluding cancelled and refunded"
        />
        <StatCard
          icon={<Receipt className="size-5" />}
          label="Average order value"
          value={formatPrice(stats.average)}
          hint="Revenue divided by orders"
        />
        <StatCard
          icon={<Utensils className="size-5" />}
          label="Meals rescued"
          value={String(stats.meals)}
          hint="Estimated from posts collected"
        />
      </div>

      <div className="surface-card p-5">
        <h2 className="text-lg font-semibold">Orders over time</h2>
        <p className="text-sm text-muted-foreground">Last six months</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                }}
                formatter={(value: number, name) =>
                  name === "revenue" ? formatPrice(value) : value
                }
              />
              <Bar dataKey="orders" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface-card p-5">
        <h2 className="text-lg font-semibold">By food post category</h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No sales yet — once orders come in, your category mix shows here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {categories.map((row) => (
              <li key={row.category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">
                    {row.units} sold · {formatPrice(row.revenue)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{
                      width: `${maxRevenue ? Math.max(6, (row.revenue / maxRevenue) * 100) : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="surface-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}
