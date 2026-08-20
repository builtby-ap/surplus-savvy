import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavShell } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Business dashboard — Surplus Rescue" },
      { name: "description", content: "Manage mystery bags, incoming orders, delivery and analytics for your food business." },
      { property: "og:title", content: "Business dashboard — Surplus Rescue" },
      { property: "og:description", content: "Manage mystery bags, orders, delivery and analytics for your food business." },
    ],
  }),
  component: () => (
    <NavShell
      title="Business"
      subtitle="Manage your surplus listings, orders and impact."
      items={[
        { to: "/dashboard", label: "Overview" },
        { to: "/dashboard/mystery-bags", label: "Mystery bags" },
        { to: "/dashboard/orders", label: "Orders" },
        { to: "/dashboard/delivery", label: "Delivery" },
        { to: "/dashboard/analytics", label: "Analytics" },
      ]}
    >
      <Outlet />
    </NavShell>
  ),
});
