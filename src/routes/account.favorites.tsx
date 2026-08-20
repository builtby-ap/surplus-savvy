import { createFileRoute } from "@tanstack/react-router";
import { SectionPlaceholder } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/account/favorites")({
  component: () => (
    <SectionPlaceholder
      title="Favorites"
      description="Saved businesses and bags, with alerts when they restock."
    />
  ),
});
