import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/dashboard/")({
  component: () => (
    <SectionPlaceholder
      title="Today at a glance"
      description="Live listings, bags sold today, revenue rescued and pending pickups."
    />
  ),
});
