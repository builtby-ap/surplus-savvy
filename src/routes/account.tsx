import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavShell } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — Surplus Rescue" },
      { name: "description", content: "Manage your Surplus Rescue orders, favourites, addresses and settings." },
      { property: "og:title", content: "Your account — Surplus Rescue" },
      { property: "og:description", content: "Manage your orders, favourites, addresses and settings." },
    ],
  }),
  component: () => (
    <NavShell
      title="My account"
      subtitle="Your rescues, favourites and delivery details."
      items={[
        { to: "/account", label: "Overview" },
        { to: "/account/orders", label: "Orders" },
        { to: "/account/favorites", label: "Favorites" },
        { to: "/account/addresses", label: "Addresses" },
        { to: "/account/settings", label: "Settings" },
      ]}
    >
      <Outlet />
    </NavShell>
  ),
});
