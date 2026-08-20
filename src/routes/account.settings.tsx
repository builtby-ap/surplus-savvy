import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/account/settings")({
  component: () => (
    <SectionPlaceholder
      title="Settings"
      description="Profile details, notification preferences and account security."
    />
  ),
});
