import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Surplus Rescue" },
      { name: "description", content: "Log in to reserve mystery bags, track orders and manage your Surplus Rescue account." },
      { property: "og:title", content: "Log in — Surplus Rescue" },
      { property: "og:description", content: "Log in to reserve mystery bags and track your rescued food orders." },
    ],
  }),
  component: () => (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to reserve bags and track your rescues."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>{" "}
          ·{" "}
          <Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
            Forgot password
          </Link>
        </>
      }
    />
  ),
});
