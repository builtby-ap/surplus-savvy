import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="warm-hero flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="mb-6 flex items-center gap-2 text-primary">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sprout className="size-5" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Surplus Rescue
        </span>
      </Link>
      <div className="surface-card w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6 space-y-4">
          {children ?? (
            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Form coming next.
            </div>
          )}
        </div>
        {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
