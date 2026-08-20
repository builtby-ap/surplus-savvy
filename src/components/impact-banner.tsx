import { Leaf, PiggyBank, Utensils } from "lucide-react";
import { formatMoneySaved, platformStats } from "@/data/mock";

export function ImpactBanner() {
  const items = [
    {
      icon: Utensils,
      value: platformStats.mealsRescued.toLocaleString(),
      label: "meals rescued",
    },
    {
      icon: PiggyBank,
      value: formatMoneySaved(platformStats.moneySaved),
      label: "saved by customers",
    },
    {
      icon: Leaf,
      value: `${(platformStats.co2SavedKg / 1000).toFixed(1)}t`,
      label: "food waste & CO₂ avoided",
    },
  ];

  return (
    <aside
      aria-label="Platform impact so far"
      className="border-y border-success/25 bg-success/10"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-2.5 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-success">
          So far on Phoe La Min
        </span>
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-2">
            <item.icon className="size-4 text-success" />
            <span className="font-semibold">{item.value}</span>
            <span className="text-muted-foreground">{item.label}</span>
          </span>
        ))}
      </div>
    </aside>
  );
}
