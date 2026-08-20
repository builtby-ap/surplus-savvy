import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, homePathForSession } from "@/lib/auth/auth-context";
import { DEMO_ACCOUNTS } from "@/lib/auth/auth-service";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Log in — Phoe La Min" },
      {
        name: "description",
        content:
          "Log in to reserve mystery bags, track orders and manage your Phoe La Min account.",
      },
      { property: "og:title", content: "Log in — Phoe La Min" },
      {
        property: "og:description",
        content: "Log in to reserve mystery bags and track your rescued food orders.",
      },
    ],
  }),
  component: LoginPage,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const { login, loginWithGoogle } = useAuth();

  /** Only same-origin app paths are allowed as a post-login destination. */
  function destinationFor(session: Parameters<typeof homePathForSession>[0]) {
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      return redirectTo;
    }
    return homePathForSession(session);
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState<"password" | "google" | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!emailPattern.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending("password");
    try {
      const session = await login(email, password);
      toast.success(`Welcome back, ${session.user.fullName}.`);
      void navigate({ to: destinationFor(session) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log you in.");
    } finally {
      setPending(null);
    }
  }

  async function handleGoogle() {
    setPending("google");
    try {
      const session = await loginWithGoogle();
      toast.success("Signed in with Google.");
      void navigate({ to: destinationFor(session) });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to reserve bags and track your rescues."
      footer={
        <div className="space-y-3">
          <p className="text-center">Don't have an account?</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary" className="w-full rounded-xl">
              <Link to="/register">Create Customer Account</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link to="/vendor/register">Register as Vendor</Link>
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="you@example.com"
          />
          {errors.email ? (
            <p id="email-error" role="alert" className="text-sm text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" role="alert" className="text-sm text-destructive">
              {errors.password}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={pending !== null}>
          {pending === "password" ? <Loader2 className="size-4 animate-spin" /> : null}
          Log In
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton onClick={handleGoogle} loading={pending === "google"} />
        <p className="text-center text-xs text-muted-foreground">
          Google sign-in creates a customer account.
        </p>

        <p className="flex items-start gap-2 rounded-xl bg-secondary/70 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          Forgot your password? Please contact the Phoe La Min administrator for assistance.
        </p>

        <details className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Demo accounts (mock auth)</summary>
          <ul className="mt-2 space-y-1">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                {account.label}: {account.email} / {account.password}
              </li>
            ))}
          </ul>
        </details>
      </form>
    </AuthLayout>
  );
}
