import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, PagePlaceholder } from "@/components/layout/public-layout";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): { q?: string; category?: string } => {
    const parsed: { q?: string; category?: string } = {};
    if (typeof search["q"] === "string") parsed.q = search["q"];
    if (typeof search["category"] === "string") parsed.category = search["category"];
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "Search mystery bags — Surplus Rescue" },
      { name: "description", content: "Filter surplus mystery bags by category, price, distance and pickup window." },
      { property: "og:title", content: "Search mystery bags — Surplus Rescue" },
      { property: "og:description", content: "Filter surplus mystery bags by category, price, distance and pickup window." },
    ],
  }),
  component: () => (
    <PublicLayout>
      <PagePlaceholder
        title="Search & filters"
        description="Full search results with category, price, distance and pickup-window filters land here."
      />
    </PublicLayout>
  ),
});
