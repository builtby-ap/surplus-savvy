import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/auth-context";
import { relativeDay, usePoints } from "@/lib/points";

export const Route = createFileRoute("/account/points")({
  head: () => ({
    meta: [
      { title: "Points history — Phoe La Min" },
      { name: "description", content: "Every Rescue Point you've earned and redeemed on Phoe La Min." },
      { property: "og:title", content: "Points history — Phoe La Min" },
      { property: "og:description", content: "Every Rescue Point you've earned and redeemed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PointsHistoryPage,
});

function PointsHistoryPage() {
  const { user } = useAuth();
  const { data } = usePoints(user?.id);
  if (!data) return <div className="surface-card p-10 text-center text-muted-foreground">Loading points…</div>;
  return (
    <div className="space-y-4">
      <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">⭐ Current balance</p>
          <p className="text-3xl font-bold text-primary">{data.balance.toLocaleString()} Points</p>
          <p className="text-sm text-muted-foreground">Earned {data.earned.toLocaleString()} · Redeemed {data.redeemed.toLocaleString()}</p>
        </div>
        <Link to="/account/rewards" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">View Rewards →</Link>
      </div>
      <section className="surface-card p-5">
        <h3 className="mb-3 font-semibold">Points History</h3>
        {data.txns.length ? (
          <ul className="divide-y divide-border">
            {data.txns.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="block font-medium">{t.reason}</span>
                  <span className="text-xs text-muted-foreground">{relativeDay(t.createdAt)}</span>
                </span>
                <span className={t.points >= 0 ? "font-semibold text-success" : "font-semibold text-destructive"}>
                  {t.points >= 0 ? "+" : ""}{t.points}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No points yet. Complete an order to start earning.</p>
        )}
      </section>
    </div>
  );
}
