import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/vendor/application-status")({
  head: () => ({
    meta: [
      { title: "Vendor application status — Phoe La Min" },
      {
        name: "description",
        content:
          "Track the review status of your Phoe La Min vendor application and verification documents.",
      },
      { property: "og:title", content: "Vendor application status — Phoe La Min" },
      {
        property: "og:description",
        content: "See where your vendor application sits in the verification process.",
      },
    ],
  }),
  component: ApplicationStatusPage,
});

const STEPS = ["Application submitted", "Documents received", "Admin verification", "Vendor approval"];

function ApplicationStatusPage() {
  const { vendorApplication, isLoading } = useAuth();
  const status = vendorApplication?.verificationStatus ?? "pending";
  const completed = status === "approved" ? 4 : status === "rejected" ? 2 : 2;

  return (
    <PublicLayout allowVendor>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="surface-card p-6 sm:p-8">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your application…</p>
          ) : !vendorApplication ? (
            <>
              <h1 className="text-2xl font-semibold">No vendor application found</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Register your food business to submit an application for review.
              </p>
              <Button asChild className="mt-6 rounded-xl">
                <Link to="/vendor/register">Register as Vendor</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold">
                  {status === "approved"
                    ? "Application Approved"
                    : status === "rejected"
                      ? "Application Rejected"
                      : "Application Submitted"}
                </h1>
                <Badge
                  className={
                    status === "approved"
                      ? "bg-success text-success-foreground"
                      : status === "rejected"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-accent text-accent-foreground"
                  }
                >
                  {status === "approved"
                    ? "Approved"
                    : status === "rejected"
                      ? "Rejected"
                      : "Pending Admin Verification"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you for registering {vendorApplication.cafeName} with Phoe La Min.
              </p>

              <section className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Application status
                </h2>
                <ol className="mt-3 space-y-3">
                  {STEPS.map((step, index) => {
                    const done = index < completed;
                    return (
                      <li key={step} className="flex items-center gap-3 text-sm">
                        {done ? (
                          <CheckCircle2 className="size-5 text-success" />
                        ) : status === "rejected" && index === 2 ? (
                          <XCircle className="size-5 text-destructive" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground/60" />
                        )}
                        <span className={done ? "font-medium" : "text-muted-foreground"}>
                          {step}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {status === "pending" ? (
                <p className="mt-6 flex items-start gap-2 rounded-xl bg-secondary/70 p-4 text-sm text-muted-foreground">
                  <Clock className="mt-0.5 size-4 shrink-0" />
                  Our administrator will review your business information and verification
                  documents. You will be able to access vendor features after your application is
                  approved.
                </p>
              ) : null}

              {status === "rejected" ? (
                <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  <p className="font-medium text-destructive">Reason from the administrator</p>
                  <p className="mt-1 text-muted-foreground">
                    {vendorApplication.rejectionReason ??
                      "Business license information could not be verified."}
                  </p>
                  <Button asChild variant="outline" className="mt-4 rounded-xl">
                    <Link to="/vendor/register">Update and resubmit application</Link>
                  </Button>
                </div>
              ) : null}

              {status === "approved" ? (
                <Button asChild className="mt-6 rounded-xl">
                  <Link to="/dashboard">Go to vendor dashboard</Link>
                </Button>
              ) : null}

              <dl className="mt-8 grid gap-3 border-t border-border pt-6 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">{vendorApplication.category}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd className="font-medium">{vendorApplication.email}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="font-medium">
                    {vendorApplication.address} ({vendorApplication.latitude},{" "}
                    {vendorApplication.longitude})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Business license</dt>
                  <dd className="font-medium">{vendorApplication.businessLicense.fileName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">FDA approval</dt>
                  <dd className="font-medium">{vendorApplication.fdaApproval.fileName}</dd>
                </div>
              </dl>
            </>
          )}

          <div className="mt-8">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
