import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <SectionPlaceholder
      title="Platform settings"
      description="Categories, commission, service areas and notification templates."
    />
  ),
});
