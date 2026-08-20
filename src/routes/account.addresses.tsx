import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/account/addresses")({
  component: () => (
    <SectionPlaceholder
      title="Addresses"
      description="Delivery addresses with a default pick and map pin editing."
    />
  ),
});
