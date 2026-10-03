import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { bagCategoryLabels, formatPrice, type BagCategory } from "@/data/mock";
import { useAuth } from "@/lib/auth/auth-context";
import { useMyOrders, type CustomerOrder } from "@/lib/customer-orders";
import { orderStatusLabels } from "@/lib/order-status";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "My overview — Phoe La Min" },
      { name: "description", content: "Your savings, food rescued, activity and milestones on Phoe La Min." },
      { property: "og:title", content: "My overview — Phoe La Min" },
      { property: "og:description", content: "Your savings, food rescued, activity and milestones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomerOverview,
});

/** Existing app impact factors: one rescued item ≈ 1.1 kg food, 2.5 kg CO2e. */
const KG_FOOD_PER_ITEM = 1.1;
const KG_CO2_PER_ITEM = 2.5;

const CATEGORY_EMOJI: Record<BagCategory, string> = {
  mixed_meals: "🍱", bakery: "🥐", grocery: "🛒", produce: "🥬", snacks: "🍩", beverages: "🥤", desserts: "🍰",
};
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const isCompleted = (o: CustomerOrder) => o.status === "picked-up" || o.status === "delivered";
const paidForFood = (o: CustomerOrder) => o.itemPrice || Math.max(0, o.total - o.deliveryFee);

function periodOf(h: number) {
  if (h < 5) return "Late night";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 21) return "Evening";
  return "Night";
}

function topBy<T extends string>(values: T[]) {
  const m = new Map<T, number>();
  values.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function CustomerOverview() {
  const { user } = useAuth();
  const orders = useMyOrders(!!user);
  const completed = useMemo(() => (orders ?? []).filter(isCompleted), [orders]);
  const [categories, setCategories] = useState<[BagCategory, number][]>([]);

  // Favourite categories from the food posts behind completed orders.
  const itemKey = completed.map((o) => o.id).join(",");
  useEffect(() => {
    if (!completed.length) return setCategories([]);
    let alive = true;
    supabase
      .from("order_items")
      .select("quantity, food_posts(category)")
      .in("order_id", completed.map((o) => o.id))
      .then(({ data }) => {
        if (!alive) return;
        const counts = new Map<BagCategory, number>();
        (data ?? []).forEach((r) => {
          const cat = (r.food_posts as { category?: BagCategory } | null)?.category;
          if (cat) counts.set(cat, (counts.get(cat) ?? 0) + (r.quantity ?? 1));
        });
        setCategories([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3));
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  const s = useMemo(() => {
    const items = completed.reduce((n, o) => n + o.items.reduce((q, i) => q + i.quantity, 0), 0);
    const original = completed.reduce((n, o) => n + o.originalPrice, 0);
    const paidFood = completed.reduce((n, o) => n + paidForFood(o), 0);
    const spent = completed.reduce((n, o) => n + o.total, 0);
    const saved = Math.max(0, original - paidFood);
    const count = completed.length;
    const dates = completed.map((o) => new Date(o.placedAt));
    const first = dates.length ? Math.min(...dates.map((d) => d.getTime())) : Date.now();
    const months = Math.max(1, (Date.now() - first) / (30.44 * 864e5));
    const period = topBy(dates.map((d) => periodOf(d.getHours())))[0];
    const day = topBy(dates.map((d) => DAYS[d.getDay()]))[0];
    const places = topBy(completed.map((o) => o.vendorName)).slice(0, 3);
    return {
      items, original, spent, saved, count,
      avgSaved: count ? saved / count : 0,
      avgOrder: count ? spent / count : 0,
      rate: original > 0 ? Math.round((saved / original) * 100) : 0,
      foodKg: items * KG_FOOD_PER_ITEM,
      co2Kg: items * KG_CO2_PER_ITEM,
      perMonth: count / months,
      period: period?.[0], day: day?.[0], places,
    };
  }, [completed]);

  if (orders === undefined) {
    return <div className="surface-card p-10 text-center text-muted-foreground">Loading your overview…</div>;
  }

  const isNew = s.count === 0;
  const enoughHistory = s.count >= 3;
  const recent = (orders ?? []).slice(0, 5);

  const milestones = [
    { done: s.count >= 1, title: "First Order 🎉", text: "You've completed your first order." },
    { done: s.count >= 5, title: "5 Orders ⭐", text: "You've completed 5 orders." },
    { done: s.count >= 10, title: "10 Orders 🏅", text: "You've completed 10 orders." },
    { done: s.items >= 10, title: "10 Meals Rescued 🍃", text: "You've rescued 10 meals." },
    { done: s.items >= 25, title: "25 Meals Rescued 🌍", text: "You've rescued 25 meals." },
  ];
  const nextMeals = [1, 5, 10, 25, 50, 100].find((t) => t > s.items);

  return (
    <div className="space-y-6">
      {isNew && (
        <div className="surface-card p-6">
          <h2 className="text-xl font-semibold">Welcome! 👋</h2>
          <p className="mt-1 text-muted-foreground">Your customer insights will appear here as you start ordering.</p>
          <Link to="/search" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
            Browse food posts
          </Link>
        </div>
      )}

      {/* Top statistics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat emoji="🍱" label="Total Meals Ordered" value={s.items.toLocaleString()} />
        <Stat emoji="💰" label="Total Money Saved" value={formatPrice(s.saved)} />
        <Stat emoji="⭐" label="Current Points" value="—" note="Points program coming soon" />
        <Stat emoji="🍃" label="Food Rescued" value={`${s.items} bag${s.items === 1 ? "" : "s"}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="🌱 Your Impact">
          <div className="grid grid-cols-3 gap-3">
            <Mini label="Meals rescued" value={String(s.items)} />
            <Mini label="Food waste avoided" value={`${s.foodKg.toFixed(1)} kg`} />
            <Mini label="CO₂ avoided" value={`${s.co2Kg.toFixed(1)} kg`} />
          </div>
          {!isNew && (
            <p className="mt-4 rounded-2xl bg-success/10 p-3 text-sm">
              You've helped prevent 🍱 {s.items} meal{s.items === 1 ? "" : "s"} from going to waste and 🌍 an estimated {s.co2Kg.toFixed(1)} kg CO₂e.
            </p>
          )}
        </Section>

        <Section title="💰 Your Savings">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Mini label="Total saved" value={formatPrice(s.saved)} />
            <Mini label="Total spent" value={formatPrice(s.spent)} />
            <Mini label="Avg. savings / order" value={formatPrice(Math.round(s.avgSaved))} />
            <Mini label="Original food value" value={formatPrice(s.original)} />
            <Mini label="Savings rate" value={`${s.rate}% saved`} />
          </div>
        </Section>

        <Section title="⭐ Points & Rewards">
          <p className="text-sm text-muted-foreground">
            The points program isn't live yet, so there's no balance, earned or redeemed points to show. Once it launches,
            your points, progress to the next reward and recent points activity will appear here automatically.
          </p>
          <Progress value={0} className="mt-4 h-2" />
        </Section>

        <Section title="📊 Your Activity">
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Completed orders" value={String(s.count)} />
            <Mini label="Average order value" value={formatPrice(Math.round(s.avgOrder))} />
            {enoughHistory ? (
              <>
                <Mini label="Ordering frequency" value={`${s.perMonth.toFixed(1)} / month`} />
                <Mini label="Most active" value={`${s.period} · ${s.day}`} />
              </>
            ) : null}
          </div>
          {!enoughHistory && (
            <p className="mt-3 text-sm text-muted-foreground">Ordering patterns appear after 3 completed orders.</p>
          )}
        </Section>

        <Section title="🍰 Your Favorites">
          {categories.length ? (
            <ol className="space-y-2">
              {categories.map(([cat, n], i) => (
                <li key={cat} className="flex items-center justify-between text-sm">
                  <span><span className="mr-2 text-muted-foreground">{i === 0 ? "Most ordered" : i === 1 ? "2nd" : "3rd"}</span>{CATEGORY_EMOJI[cat]} {bagCategoryLabels[cat]}</span>
                  <span className="text-muted-foreground">{n}×</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">{isNew ? "Start placing orders to discover your favorites." : "Your favorites will appear here as you place more orders."}</p>
          )}
        </Section>

        <Section title="❤️ Your Favorite Places" action={s.places.length ? <Link to="/account/orders" className="text-sm font-medium text-primary">View All →</Link> : null}>
          {s.places.length ? (
            <ul className="space-y-2">
              {s.places.map(([name, n]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="text-muted-foreground">{n} order{n === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Start placing orders to discover your favorite places.</p>
          )}
        </Section>
      </div>

      <Section title="🧾 Recent Orders" action={recent.length ? <Link to="/account/orders" className="text-sm font-medium text-primary">View All →</Link> : null}>
        {recent.length ? (
          <ul className="divide-y divide-border">
            {recent.map((o) => (
              <li key={o.id}>
                <Link to="/account/orders/$orderId" params={{ orderId: o.id }} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:opacity-80">
                  <div className="min-w-0">
                    <p className="font-medium">Order #{o.receiptNumber}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.vendorName} · {o.items[0]?.title ?? "Surprise bag"} · {new Date(o.placedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{formatPrice(o.total)}</p>
                    <p className="text-success">Saved {formatPrice(o.discount)}</p>
                    <p className="text-muted-foreground">{isCompleted(o) ? "✓ " : ""}{orderStatusLabels[o.status] ?? o.status}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        )}
      </Section>

      <Section title="🎉 Your Milestones">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {milestones.filter((m) => m.done).map((m) => (
            <div key={m.title} className="rounded-2xl bg-accent/15 p-3">
              <p className="font-semibold">{m.title}</p>
              <p className="text-sm text-muted-foreground">{m.text}</p>
            </div>
          ))}
        </div>
        {nextMeals && (
          <div className="mt-4">
            <p className="text-sm font-medium">{s.items} / {nextMeals} Meals Rescued</p>
            <Progress value={(s.items / nextMeals) * 100} className="mt-2 h-2" />
            <p className="mt-1 text-sm text-muted-foreground">{nextMeals - s.items} more to reach the next milestone!</p>
          </div>
        )}
      </Section>
    </div>
  );
}

function Stat({ emoji, label, value, note }: { emoji: string; label: string; value: string; note?: string }) {
  return (
    <div className="surface-card p-4 sm:p-5">
      <p className="text-xl">{emoji}</p>
      <p className="mt-2 text-xl font-semibold sm:text-2xl">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-3">
      <p className="text-base font-semibold sm:text-lg">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
