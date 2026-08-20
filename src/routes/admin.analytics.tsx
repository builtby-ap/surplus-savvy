import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Leaf, Recycle, Utensils } from "lucide-react";
import { formatPrice } from "@/data/mock";
import {
  categoryBreakdown,
  cityBreakdown,
  monthlyTrends,
  platformOrders,
  platformTotals,
  type Breakdown,
  type MonthlyPoint,
  type PlatformTotals,
} from "@/lib/platform-stats";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

interface Data {
  totals: PlatformTotals;
  months: MonthlyPoint[];
  categories: Breakdown[];
  cities: Breakdown[];
}

function AdminAnalytics() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const orders = platformOrders();
    setData({
      totals: platformTotals(orders),
      months: monthlyTrends(orders),
      categories: categoryBreakdown(orders),
      cities: cityBreakdown(orders),
    });
  }, []);

  if (!data) {
    return <p className="text-sm text-muted-foreground">Crunching platform analytics…</p>;
  }

  const carTrips = Math.round((data.totals.co2Kg / 0.17) / 8);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">System analytics</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Marketplace trends over the last six months, where the demand sits, and the impact it all adds up to.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">Orders &amp; revenue</h2>
          <p className="text-sm text-muted-foreground">Last six months</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} width={40} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(value: number, name) =>
                    name === "Revenue" ? formatPrice(value) : value
                  }
                />
                <Bar dataKey="orders" name="Orders" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" name="Revenue" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="text-lg font-semibold">New vendors &amp; customers</h2>
          <p className="text-sm text-muted-foreground">Sign-ups per month</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} width={32} fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="customers"
                  name="New customers"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="vendors"
                  name="New vendors"
                  stroke="var(--color-accent)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="By food category"
          subtitle="Revenue share across the marketplace"
          rows={data.categories}
        />
        <BreakdownCard
          title="By city area"
          subtitle="Where rescues are happening"
          rows={data.cities}
        />
      </div>

      <div className="surface-card p-5">
        <h2 className="text-lg font-semibold">Platform impact</h2>
        <p className="text-sm text-muted-foreground">
          Same estimates as the customer dashboard, aggregated across everyone.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Impact
            icon={<Utensils className="size-5" />}
            label="Meals rescued"
            value={data.totals.meals.toLocaleString()}
            hint={`${data.totals.units.toLocaleString()} food posts collected`}
          />
          <Impact
            icon={<Recycle className="size-5" />}
            label="Food waste avoided"
            value={`${data.totals.foodKg.toFixed(0)} kg`}
            hint="Kept out of the bin"
          />
          <Impact
            icon={<Leaf className="size-5" />}
            label="CO2e avoided"
            value={`${data.totals.co2Kg.toFixed(0)} kg`}
            hint={`≈ ${carTrips.toLocaleString()} car trips across town`}
          />
        </div>
      </div>
    </section>
  );
}

function BreakdownCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Breakdown[];
}) {
  const max = rows[0]?.revenue ?? 0;
  return (
    <div className="surface-card p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="text-muted-foreground">
                {row.orders} orders · {formatPrice(row.revenue)}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${max ? Math.max(6, (row.revenue / max) * 100) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Impact({
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
    <article className="rounded-2xl border border-success/30 bg-success/10 p-4">
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}
