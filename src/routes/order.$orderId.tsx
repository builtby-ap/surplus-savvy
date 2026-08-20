import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout, PagePlaceholder } from "@/components/layout/public-layout";

export const Route = createFileRoute("/order/$orderId")({
  head: () => ({
    meta: [
      { title: "Order confirmed — Surplus Rescue" },
      { name: "description", content: "Your mystery bag is reserved. See your collection code, pickup window and directions." },
      { property: "og:title", content: "Order confirmed — Surplus Rescue" },
      { property: "og:description", content: "Your mystery bag is reserved. See your collection code, pickup window and directions." },
    ],
  }),
  component: () => (
    <PublicLayout>
      <PagePlaceholder
        title="Order confirmation"
        description="Collection code, pickup window, business directions and cash-payment reminder."
      />
    </PublicLayout>
  ),
});
