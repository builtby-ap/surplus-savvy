import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/dashboard/analytics")({
  component: () => (
    <SectionPlaceholder
      title="Analytics"
      description="Sell-through rate, revenue recovered, waste avoided and best-performing bags."
    />
  ),
});
