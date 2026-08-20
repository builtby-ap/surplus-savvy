import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, homePathForSession } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create a customer account — Surplus Rescue" },
      {
        name: "description",
        content:
          "Sign up as a customer to reserve discounted surplus food from local cafes, bakeries and markets.",
      },
      { property: "og:title", content: "Create a customer account — Surplus Rescue" },
      {
        property: "og:description",
        content: "Sign up as a customer to rescue surplus food near you.",
      },
    ],
  }),
  component: RegisterPage,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;

type Fields = "fullName" | "email" | "phone" | "password" | "confirmPassword";

function RegisterPage() {
  const navigate = useNavigate();
  const { registerCustomer, loginWithGoogle } = useAuth();
  const [values, setValues] = useState<Record<Fields, string>>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<"form" | "google" | null>(null);

  const set = (field: Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  function validate() {
    const next: Partial<Record<Fields, string>> = {};
    if (!values.fullName.trim()) next.fullName = "Full name is required.";
    if (!values.email.trim()) next.email = "Email is required.";
    else if (!emailPattern.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (!values.phone.trim()) next.phone = "Phone number is required.";
    else if (!phonePattern.test(values.phone.trim())) next.phone = "Enter a valid phone number.";
    if (!values.password) next.password = "Password is required.";
    else if (values.password.length < 8)
      next.password = "Use at least 8 characters.";
    if (values.confirmPassword !== values.password)
      next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setPending("form");
    try {
      const session = await registerCustomer({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      toast.success("Customer account created. Welcome to Surplus Rescue!");
      void navigate({ to: homePathForSession(session) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create your account.");
    } finally {
      setPending(null);
    }
  }

  async function handleGoogle() {
    setPending("google");
    try {
      const session = await loginWithGoogle();
      toast.success("Customer account created with Google.");
      void navigate({ to: homePathForSession(session) });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setPending(null);
    }
  }

  const field = (
    id: Fields,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        value={values[id]}
        onChange={set(id)}
        aria-invalid={Boolean(errors[id])}
        aria-describedby={errors[id] ? `${id}-error` : undefined}
        {...props}
      />
      {errors[id] ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {errors[id]}
        </p>
      ) : null}
    </div>
  );

  return (
    <AuthLayout
      title="Create your customer account"
      subtitle="Reserve surplus food from local shops and save it from the bin."
      footer={
        <div className="space-y-2 text-center">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
          <p>
            Running a food business?{" "}
            <Link to="/vendor/register" className="text-primary underline-offset-4 hover:underline">
              Register as Vendor
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {field("fullName", "Full Name", { autoComplete: "name", placeholder: "Aye Pyae" })}
        {field("email", "Email", {
          type: "email",
          autoComplete: "email",
          placeholder: "you@example.com",
        })}
        {field("phone", "Phone Number", {
          type: "tel",
          autoComplete: "tel",
          placeholder: "09123456789",
        })}

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={values.password}
              onChange={set("password")}
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

        {field("confirmPassword", "Confirm Password", {
          type: showPassword ? "text" : "password",
          autoComplete: "new-password",
        })}

        <Button type="submit" className="w-full rounded-xl" disabled={pending !== null}>
          {pending === "form" ? <Loader2 className="size-4 animate-spin" /> : null}
          Create Customer Account
        </Button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton onClick={handleGoogle} loading={pending === "google"} />
        <p className="text-center text-xs text-muted-foreground">
          Google sign-in is for customer accounts only.
        </p>
      </form>
    </AuthLayout>
  );
}
