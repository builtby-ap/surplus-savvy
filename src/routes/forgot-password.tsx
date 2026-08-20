import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Surplus Rescue" },
      { name: "description", content: "Request a password reset link for your Surplus Rescue account." },
      { property: "og:title", content: "Reset your password — Surplus Rescue" },
      { property: "og:description", content: "Request a password reset link for your Surplus Rescue account." },
    ],
  }),
  component: () => (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
      footer={
        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
          Back to log in
        </Link>
      }
    />
  ),
});
