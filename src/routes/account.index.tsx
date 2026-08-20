import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Leaf, PiggyBank, Utensils } from "lucide-react";
import { formatPrice } from "@/data/mock";
import { ensureDemoOrders } from "@/lib/demo-orders";
import { listPlacedOrders, type PlacedOrder } from "@/lib/orders";

export const Route = createFileRoute("/account/")({
  component: ImpactDashboard,
});

/** Rough mock factors: one rescued food post ≈ 1.4 meals, 1.1 kg food, 2.5 kg CO2e. */
const MEALS_PER_ITEM = 1.4;
const KG_FOOD_PER_ITEM = 1.1;
const KG_CO2_PER_ITEM = 2.5;
/** ~0.17 kg CO2 per km in an average car. */
const KM_PER_KG_CO2 = 1 / 0.17;

function ImpactDashboard() {
  const [orders, setOrders] = useState<PlacedOrder[]>([]);

  useEffect(() => {
    ensureDemoOrders();
    setOrders(listPlacedOrders());
  }, []);

  const stats = useMemo(() => {
    const items = orders.flatMap((o) => o.items);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const saved = orders.reduce((s, o) => s + o.discount, 0);
    return {
      orders: orders.length,
      items: count,
      meals: Math.round(count * MEALS_PER_ITEM),
      saved,
      foodKg: count * KG_FOOD_PER_ITEM,
      co2Kg: count * KG_CO2_PER_ITEM,
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const months: { key: string; label: string; orders: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString(undefined, { month: "short" }),
        orders: 0,
      });
    }
    orders.forEach((o) => {
      const d = new Date(o.placedAt);
      const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.orders += 1;
    });
    return months;
  }, [orders]);

  const carTrips = Math.max(1, Math.round((stats.co2Kg * KM_PER_KG_CO2) / 8));

  if (orders.length === 0) {
    return (
      <div className="surface-card p-10 text-center">
        <h2 className="text-xl font-semibold">Your impact starts with one rescue</h2>
        <p className="mt-2 text-muted-foreground">Grab a food post and we'll start counting the good stuff.</p>
        <Link to="/search" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground">
          Browse food posts
        </Link>
      </div>
    );
  }

  const cards = [
    {
      icon: Utensils,
      label: "Meals rescued",
      value: stats.meals.toLocaleString(),
      note: `${stats.items} food post${stats.items === 1 ? "" : "s"} across ${stats.orders} order${stats.orders === 1 ? "" : "s"}`,
    },
    {
      icon: PiggyBank,
      label: "Money saved",
      value: formatPrice(stats.saved),
      note: "vs. the original shelf price",
    },
    {
      icon: Leaf,
      label: "CO2 avoided",
      value: `${stats.co2Kg.toFixed(1)} kg`,
      note: `${stats.foodKg.toFixed(1)} kg of food kept out of the bin`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="surface-card p-6">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <card.icon className="size-5" />
            </div>
            <p className="mt-4 text-3xl font-semibold">{card.value}</p>
            <p className="font-medium">{card.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="surface-card border-success/30 bg-success/10 p-5">
        <p className="text-sm sm:text-base">
          Nice work — that's roughly <strong>{carTrips} car trip{carTrips === 1 ? "" : "s"}</strong> across town you've
          kept off the road, and {stats.meals} meal{stats.meals === 1 ? "" : "s"} that got eaten instead of binned. 🌱
        </p>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-semibold">Your rescues over time</h3>
        <p className="text-sm text-muted-foreground">Orders per month, last 6 months.</p>
        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} fontSize={12} />
              <Tooltip cursor={{ fill: "transparent" }} />
              <Bar dataKey="orders" name="Orders" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
