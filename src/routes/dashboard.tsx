import { useEffect, useState } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavShell } from "@/components/layout/nav-shell";
import { useMyVendor } from "@/lib/use-my-vendor";
import { fetchVendorOrders } from "@/lib/vendor-db";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Business dashboard — Surplus Rescue" },
      { name: "description", content: "Manage mystery bags, incoming orders, delivery and analytics for your food business." },
      { property: "og:title", content: "Business dashboard — Surplus Rescue" },
      { property: "og:description", content: "Manage mystery bags, orders, delivery and analytics for your food business." },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { vendorId } = useMyVendor();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!vendorId) {
      setPending(0);
      return;
    }
    const tick = () =>
      void fetchVendorOrders(vendorId)
        .then((orders) => setPending(orders.filter((o) => o.status === "pending").length))
        .catch(() => undefined);
    tick();
    const timer = window.setInterval(tick, 15000);
    return () => window.clearInterval(timer);
  }, [vendorId]);

  return (
    <NavShell
      title="Business"
      subtitle="Manage your surplus listings, orders and impact."
      items={[
        { to: "/dashboard/analytics", label: "Dashboard" },
        { to: "/dashboard/orders", label: "Orders", badge: pending },
        { to: "/dashboard/mystery-bags", label: "Secret Bags" },
        { to: "/dashboard/profile", label: "Store Profile" },
      ]}
    >
      <Outlet />
    </NavShell>
  );
}
