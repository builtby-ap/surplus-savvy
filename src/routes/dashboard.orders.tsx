import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/dashboard/orders")({
  component: () => (
    <SectionPlaceholder
      title="Orders"
      description="Incoming reservations, collection-code verification and cash collection status."
    />
  ),
});
