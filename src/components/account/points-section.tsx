import { Link } from "@tanstack/react-router";
import { Progress } from "@/components/ui/progress";
import type { PointsData } from "@/lib/points";
import { relativeDay } from "@/lib/points";

export function PointsSection({ data }: { data: PointsData | undefined }) {
  if (!data) return <section className="surface-card p-5 text-sm text-muted-foreground">Loading your points…</section>;

  if (data.txns.length === 0) {
    return (
      <section className="surface-card p-5">
        <h3 className="font-semibold">⭐ Start Earning Points</h3>
        <p className="mt-1 text-sm text-muted-foreground">Complete orders and eligible activities to earn points and unlock rewards.</p>
        <Link to="/account/rewards" hash="how-it-works" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          View How It Works →
        </Link>
      </section>
    );
  }

  const next = data.rewards.find((r) => r.pointsCost > data.balance);
  const canRedeem = data.rewards.some((r) => r.pointsCost <= data.balance);

  return (
    <section className="surface-card p-5">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="font-semibold">⭐ My Points</h3>
          <p className="mt-2 text-3xl font-bold text-primary">{data.balance.toLocaleString()} <span className="text-base font-medium text-muted-foreground">Points</span></p>
          <p className="mt-1 text-sm text-muted-foreground">Total Earned: {data.earned.toLocaleString()} · Total Redeemed: {data.redeemed.toLocaleString()}</p>
          <div className="mt-4">
            {canRedeem && <p className="text-sm font-medium text-success">🎉 You have enough points for a reward!</p>}
            {next && (
              <div className="mt-2">
                <p className="text-sm font-medium">Next Reward 🎁 <span className="text-muted-foreground">{data.balance} / {next.pointsCost} Points</span></p>
                <Progress value={(data.balance / next.pointsCost) * 100} className="mt-2 h-2" />
                <p className="mt-1 text-xs text-muted-foreground">{next.pointsCost - data.balance} more points to unlock your next reward</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Recent Activity</h4>
            <Link to="/account/points" className="text-sm font-medium text-primary hover:underline">View All →</Link>
          </div>
          <ul className="mt-2 space-y-2">
            {data.txns.slice(0, 3).map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0">
                  <span className={t.points >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"}>
                    {t.points >= 0 ? "+" : ""}{t.points} Points
                  </span>
                  <span className="block truncate text-muted-foreground">{t.reason}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{relativeDay(t.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">🎁 Available Rewards</h4>
            <Link to="/account/rewards" className="text-sm font-medium text-primary hover:underline">View Rewards →</Link>
          </div>
          <ul className="mt-2 space-y-2">
            {data.rewards.slice(0, 3).map((r) => {
              const short = r.pointsCost - data.balance;
              return (
                <li key={r.id} className="flex items-center justify-between rounded-2xl bg-secondary/60 p-3 text-sm transition-colors">
                  <span>
                    <span className="block font-semibold">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{r.pointsCost.toLocaleString()} Points</span>
                  </span>
                  {short > 0 ? (
                    <span className="text-xs text-muted-foreground">{short} more points needed</span>
                  ) : (
                    <Link to="/account/rewards" className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Redeem</Link>
                  )}
                </li>
              );
            })}
            {data.rewards.length === 0 && <li className="text-sm text-muted-foreground">No rewards available right now.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
