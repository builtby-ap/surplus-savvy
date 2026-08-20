import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/dashboard/mystery-bags")({
  component: () => (
    <SectionPlaceholder
      title="Mystery bags"
      description="Create, schedule and restock bags with pricing, quantity and pickup windows."
    />
  ),
});
