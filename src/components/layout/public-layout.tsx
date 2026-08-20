import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "./site-header";
import { VendorRedirect } from "@/components/auth/vendor-guard";

export function PublicLayout({
  children,
  allowVendor = false,
}: {
  children: ReactNode;
  allowVendor?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {allowVendor ? null : <VendorRedirect />}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="mt-16 border-t border-border/70 bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg text-primary">
              Surplus Rescue
            </p>
            <p className="mt-2 text-muted-foreground">
              Good food, rescued from the bin and sold at a fraction of the price.
            </p>
          </div>
          <nav className="flex flex-col gap-2 text-muted-foreground">
            <Link to="/search" className="hover:text-primary">Browse bags</Link>
            <Link to="/dashboard" className="hover:text-primary">For businesses</Link>
            <Link to="/admin" className="hover:text-primary">Admin</Link>
          </nav>
          <nav className="flex flex-col gap-2 text-muted-foreground">
            <Link to="/login" className="hover:text-primary">Log in</Link>
            <Link to="/register" className="hover:text-primary">Create account</Link>
            <Link to="/account" className="hover:text-primary">My account</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{description}</p>
      <div className="surface-card mt-8 flex min-h-48 items-center justify-center p-8 text-sm text-muted-foreground">
        Coming next — this page is scaffolded and ready to build.
      </div>
    </section>
  );
}
