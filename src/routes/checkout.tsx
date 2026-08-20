import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, PagePlaceholder } from "@/components/layout/public-layout";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Surplus Rescue" },
      { name: "description", content: "Confirm your mystery bag reservation, choose pickup or delivery and pay cash on collection." },
      { property: "og:title", content: "Checkout — Surplus Rescue" },
      { property: "og:description", content: "Confirm your mystery bag reservation, choose pickup or delivery and pay cash on collection." },
    ],
  }),
  component: () => (
    <PublicLayout>
      <PagePlaceholder
        title="Checkout"
        description="Reservation summary, pickup or delivery choice, address selection and cash-on-collection confirmation."
      />
    </PublicLayout>
  ),
});
