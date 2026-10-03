import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { fetchPointsRules, redeemReward, usePoints, type PointsRules } from "@/lib/points";

export const Route = createFileRoute("/account/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — Phoe La Min" },
      { name: "description", content: "Redeem your Rescue Points for discounts on surprise bags." },
      { property: "og:title", content: "Rewards — Phoe La Min" },
      { property: "og:description", content: "Redeem Rescue Points for discounts on surprise bags." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { user } = useAuth();
  const { data, reload } = usePoints(user?.id);
  const [rules, setRules] = useState<PointsRules | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { fetchPointsRules().then(setRules); }, []);

  const redeem = async (id: string) => {
    setBusy(id);
    try {
      const code = await redeemReward(id);
      toast.success(`Reward redeemed! Your code: ${code}`);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not redeem");
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <div className="surface-card p-10 text-center text-muted-foreground">Loading rewards…</div>;

  return (
    <div className="space-y-6">
      <div className="surface-card p-5">
        <p className="text-sm text-muted-foreground">⭐ You have</p>
        <p className="text-3xl font-bold text-primary">{data.balance.toLocaleString()} Points</p>
      </div>

      <section className="surface-card p-5">
        <h3 className="mb-3 font-semibold">🎁 Available Rewards</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.rewards.map((r) => {
            const short = r.pointsCost - data.balance;
            return (
              <div key={r.id} className="rounded-2xl border border-border p-4">
                <p className="text-lg font-semibold">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <p className="mt-2 text-sm font-medium">{r.pointsCost.toLocaleString()} Points</p>
                <Button className="mt-3 w-full" disabled={short > 0 || busy === r.id} onClick={() => redeem(r.id)}>
                  {short > 0 ? `${short} more points needed` : busy === r.id ? "Redeeming…" : "Redeem"}
                </Button>
              </div>
            );
          })}
          {data.rewards.length === 0 && <p className="text-sm text-muted-foreground">No rewards available right now.</p>}
        </div>
      </section>

      {data.redemptions.length > 0 && (
        <section className="surface-card p-5">
          <h3 className="mb-3 font-semibold">My Reward Codes</h3>
          <ul className="divide-y divide-border">
            {data.redemptions.map((r) => (
              <li key={r.id} className="flex justify-between py-3 text-sm">
                <span><span className="font-medium">{r.rewardTitle}</span><span className="block text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span></span>
                <span className="font-mono font-semibold">{r.code}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="how-it-works" className="surface-card p-5">
        <h3 className="mb-3 font-semibold">How It Works</h3>
        {rules ? (
          <ul className="space-y-1.5 text-sm">
            <li>🧾 {rules.points_per_1000_mmk} point{rules.points_per_1000_mmk === 1 ? "" : "s"} for every 1,000 MMK spent, added once your order is completed</li>
            <li>🎉 +{rules.first_order_bonus} bonus points on your first completed order</li>
            <li>✍️ +{rules.review_points} points for reviewing a completed order</li>
            <li>🍃 +{rules.bags_5_bonus} bonus points when you rescue 5 surprise bags</li>
            <li>🌍 +{rules.bags_10_bonus} bonus points when you rescue 10 surprise bags</li>
            <li className="text-muted-foreground">Cancelled orders earn no points, and points from refunded orders are removed.</li>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </section>
    </div>
  );
}
