import type { ReactNode } from "react";
import logoAsset from "@/assets/phoelamin-logo.png.asset.json";
import { Link } from "@tanstack/react-router";

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
        <img src={logoAsset.url} alt="Phoe La Min logo" className="size-12 object-contain" />
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Phoe La Min
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
