import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <SectionPlaceholder
      title="Platform overview"
      description="Marketplace-wide meals rescued, active bags, orders and growth trends."
    />
  ),
});
