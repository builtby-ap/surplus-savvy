import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/admin/users")({
  component: () => (
    <SectionPlaceholder
      title="Users"
      description="Customer accounts, roles, order history and moderation actions."
    />
  ),
});
