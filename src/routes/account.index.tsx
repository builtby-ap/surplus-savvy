import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/account/")({
  component: () => (
    <SectionPlaceholder
      title="Customer dashboard"
      description="Impact summary, active reservations and quick links to your recent rescues."
    />
  ),
});
