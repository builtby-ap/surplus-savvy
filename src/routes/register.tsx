import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create an account — Surplus Rescue" },
      { name: "description", content: "Sign up as a customer to rescue food, or register your food business to sell surplus mystery bags." },
      { property: "og:title", content: "Create an account — Surplus Rescue" },
      { property: "og:description", content: "Sign up as a customer or register your food business on Surplus Rescue." },
    ],
  }),
  component: () => (
    <AuthLayout
      title="Create your account"
      subtitle="Join as a customer, or register your food business to sell surplus."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    />
  ),
});
