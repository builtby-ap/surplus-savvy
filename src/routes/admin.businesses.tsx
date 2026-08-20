import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/admin/businesses")({
  component: () => (
    <SectionPlaceholder
      title="Businesses"
      description="Verification queue, business types, listing quality and suspensions."
    />
  ),
});
