import { lazy, Suspense, useEffect, useState } from "react";
import { ClientOnly, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, FileText, Loader2, MapPin, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { geocodeAddress } from "@/lib/auth/auth-service";
import type { VendorDocumentMeta } from "@/lib/auth/types";

export const Route = createFileRoute("/vendor/register")({
  head: () => ({
    meta: [
      { title: "Register your food business — Phoe La Min" },
      {
        name: "description",
        content:
          "Apply to sell surplus food on Phoe La Min: business details, location, verification documents and account security.",
      },
      { property: "og:title", content: "Register your food business — Phoe La Min" },
      {
        property: "og:description",
        content: "Submit your vendor application to start rescuing surplus food revenue.",
      },
    ],
  }),
  component: VendorRegisterPage,
});

const LocationPicker = lazy(() => import("@/components/map/location-picker"));

const CATEGORIES = [
  "Cafe",
  "Restaurant",
  "Bakery",
  "Grocery Store",
  "Fresh Market",
  "Snack Shop",
  "Convenience Store",
  "Food Producer",
  "Other",
];

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentUpload({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: VendorDocumentMeta | null;
  error?: string | undefined;
  onChange: (doc: VendorDocumentMeta | null) => void;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const message = localError ?? error;

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Only PDF, JPG, JPEG or PNG files are accepted.");
      onChange(null);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setLocalError("File must be 5 MB or smaller.");
      onChange(null);
      return;
    }
    setLocalError(null);
    // Mock mode: only metadata is kept, the file itself is never uploaded.
    onChange({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      status: "submitted",
    });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-secondary/50 p-3">
          <FileText className="size-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {value.fileType || "unknown type"} · {formatBytes(value.fileSize)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg"
            onClick={() => onChange(null)}
          >
            <X className="size-4" /> Remove
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-within:ring-2 focus-within:ring-ring"
        >
          <Upload className="size-5" />
          <span>Upload {label.toLowerCase()}</span>
          <span className="text-xs">PDF, JPG, JPEG or PNG · max 5 MB</span>
        </label>
      )}
      <input
        id={id}
        name={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="sr-only"
        onChange={handleFile}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? `${id}-error` : undefined}
      />
      {message ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

type TextField =
  | "cafeName"
  | "phone"
  | "email"
  | "address"
  | "password"
  | "confirmPassword";

type ErrorKey = TextField | "category" | "license" | "fda";

function VendorRegisterPage() {
  const navigate = useNavigate();
  const { registerVendor } = useAuth();
  const [values, setValues] = useState<Record<TextField, string>>({
    cafeName: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [category, setCategory] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [license, setLicense] = useState<VendorDocumentMeta | null>(null);
  const [fda, setFda] = useState<VendorDocumentMeta | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (f: TextField) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [f]: e.target.value }));

  // Mock geocoding: derive coordinates from the address as the vendor types.
  useEffect(() => {
    const address = values.address.trim();
    if (address.length < 6) {
      setCoords(null);
      return;
    }
    const timer = setTimeout(() => setCoords(geocodeAddress(address)), 500);
    return () => clearTimeout(timer);
  }, [values.address]);

  function validate() {
    const next: Partial<Record<ErrorKey, string>> = {};
    if (!values.cafeName.trim()) next.cafeName = "Cafe or shop name is required.";
    if (!category) next.category = "Choose a shop category.";
    if (!values.phone.trim()) next.phone = "Phone number is required.";
    else if (!phonePattern.test(values.phone.trim())) next.phone = "Enter a valid phone number.";
    if (!values.email.trim()) next.email = "Email is required.";
    else if (!emailPattern.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (!values.address.trim()) next.address = "Business address is required.";
    else if (!coords) next.address = "We're still detecting your location — please wait a moment.";
    if (!license) next.license = "Business license is required.";
    if (!fda) next.fda = "FDA approval is required.";
    if (!values.password) next.password = "Password is required.";
    else if (values.password.length < 8) next.password = "Use at least 8 characters.";
    if (values.confirmPassword !== values.password)
      next.confirmPassword = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await registerVendor({
        cafeName: values.cafeName,
        category,
        phone: values.phone,
        email: values.email,
        address: values.address,
        latitude: coords!.latitude,
        longitude: coords!.longitude,
        password: values.password,
        businessLicense: license!,
        fdaApproval: fda!,
      });
      toast.success("Vendor application submitted for review.");
      void navigate({ to: "/vendor/application-status" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  const field = (
    id: TextField,
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
    <PublicLayout allowVendor>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="warm-hero rounded-3xl p-6 sm:p-8">
          <h1 className="text-3xl font-semibold">Register your food business</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Tell us about your shop and upload your verification documents. Our team reviews
            every application before your surplus food goes live.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <Section
            title="Business information"
            description="How customers will recognise your shop on the marketplace."
          >
            {field("cafeName", "Cafe / Shop Name", {
              placeholder: "Enter your cafe or shop name",
              autoComplete: "organization",
            })}

            <div className="space-y-2">
              <Label htmlFor="category">Shop Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={errors.category ? "category-error" : undefined}
                  className="w-full rounded-xl"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category ? (
                <p id="category-error" role="alert" className="text-sm text-destructive">
                  {errors.category}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {field("phone", "Phone Number", {
                type: "tel",
                autoComplete: "tel",
                placeholder: "09123456789",
              })}
              {field("email", "Email", {
                type: "email",
                autoComplete: "email",
                placeholder: "cafe@example.com",
              })}
            </div>
          </Section>

          <Section
            title="Location"
            description="GPS location is automatically detected from your business address."
          >
            {field("address", "Address", {
              placeholder: "Enter your business address",
              autoComplete: "street-address",
            })}

            <div className="rounded-xl border border-border p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="size-4 text-primary" />
                Detected GPS location
              </p>
              {coords ? (
                <>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Latitude</dt>
                      <dd className="font-medium">{coords.latitude}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Longitude</dt>
                      <dd className="font-medium">{coords.longitude}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 overflow-hidden rounded-xl border border-border">
                    <ClientOnly
                      fallback={
                        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                          Loading map…
                        </div>
                      }
                    >
                      <Suspense
                        fallback={
                          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                            Loading map…
                          </div>
                        }
                      >
                        <LocationPicker
                          latitude={coords.latitude}
                          longitude={coords.longitude}
                          onChange={(latitude, longitude) => setCoords({ latitude, longitude })}
                        />
                      </Suspense>
                    </ClientOnly>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Not quite right? Drag the marker or tap the map to adjust it manually.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your address above and we'll detect the coordinates automatically.
                </p>
              )}
            </div>
          </Section>

          <Section
            title="Verification documents"
            description="These documents are required so Phoe La Min can verify your business before you can sell surplus food through the platform. They are kept private."
          >
            <DocumentUpload
              id="business-license"
              label="Business License"
              value={license}
              error={errors.license}
              onChange={setLicense}
            />
            <DocumentUpload
              id="fda-approval"
              label="FDA Approval"
              value={fda}
              error={errors.fda}
              onChange={setFda}
            />
          </Section>

          <Section
            title="Account security"
            description="You'll use your email and this password to log in once approved."
          >
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
          </Section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/login">Already registered? Log in</Link>
            </Button>
            <Button type="submit" className="rounded-xl" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Submit Vendor Application
            </Button>
          </div>
        </form>
      </div>
    </PublicLayout>
  );
}
