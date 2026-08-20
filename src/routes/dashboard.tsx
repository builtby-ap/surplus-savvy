import { useEffect, useState } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavShell } from "@/components/layout/nav-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { ensureVendorDemoOrders, pendingCountForBusiness } from "@/lib/vendor-orders";

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
  const { user } = useAuth();
  const businessId = user?.vendorId ?? "b1";
  const [pending, setPending] = useState(0);

  useEffect(() => {
    ensureVendorDemoOrders(businessId);
    const tick = () => setPending(pendingCountForBusiness(businessId));
    tick();
    const timer = window.setInterval(tick, 2000);
    return () => window.clearInterval(timer);
  }, [businessId]);

  return (
    <NavShell
      title="Business"
      subtitle="Manage your surplus listings, orders and impact."
      items={[
        { to: "/dashboard/mystery-bags", label: "Mystery bags" },
        { to: "/dashboard/orders", label: "Orders", badge: pending },
        { to: "/dashboard/delivery", label: "Delivery" },
        { to: "/dashboard/analytics", label: "Analytics" },
      ]}
    >
      <Outlet />
    </NavShell>
  );
}
