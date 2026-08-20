import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/account/orders")({
  component: () => (
    <SectionPlaceholder
      title="Orders"
      description="Active reservations with collection codes, plus your full order history."
    />
  ),
});
