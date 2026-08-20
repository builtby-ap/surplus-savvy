import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/dashboard/delivery")({
  component: () => (
    <SectionPlaceholder
      title="Delivery"
      description="Delivery zones, fees, time windows and courier assignment."
    />
  ),
});
