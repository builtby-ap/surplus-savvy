import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavShell } from "@/components/layout/nav-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — Surplus Rescue" },
      { name: "description", content: "Platform administration for users, business verification and marketplace settings." },
      { property: "og:title", content: "Admin dashboard — Surplus Rescue" },
      { property: "og:description", content: "Administer users, business verification and marketplace settings." },
    ],
  }),
  component: () => (
    <NavShell
      title="Admin"
      subtitle="Platform oversight for users, businesses and settings."
      items={[
        { to: "/admin", label: "Overview" },
        { to: "/admin/analytics", label: "Analytics" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/businesses", label: "Businesses" },
        { to: "/admin/settings", label: "Settings" },
      ]}
    >
      <Outlet />
    </NavShell>
  ),
});
