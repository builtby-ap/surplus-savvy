import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavShell } from "@/components/layout/nav-shell";
import { VendorRedirect } from "@/components/auth/vendor-guard";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — Surplus Rescue" },
      { name: "description", content: "Manage your Surplus Rescue orders, addresses and settings." },
      { property: "og:title", content: "Your account — Surplus Rescue" },
      { property: "og:description", content: "Manage your orders, addresses and settings." },
    ],
  }),
  component: () => (
    <NavShell
      title="My account"
      subtitle="Your rescues, addresses and delivery details."
      items={[
        { to: "/account", label: "Overview" },
        { to: "/account/orders", label: "Orders" },
        { to: "/account/addresses", label: "Addresses" },
        { to: "/account/settings", label: "Settings" },
      ]}
    >
      <VendorRedirect />
      <Outlet />
    </NavShell>
  ),
});
