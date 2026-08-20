import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export interface NavItem {
  to: LinkProps["to"];
  label: string;
}

export function NavShell({
  title,
  subtitle,
  items,
  children,
}: {
  title: string;
  subtitle: string;
  items: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Sprout className="size-5" />
            <span className="font-[family-name:var(--font-display)] text-base font-semibold">
              Surplus Rescue
            </span>
          </Link>
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs uppercase tracking-wide">
            {title}
          </span>
          <nav className="ml-auto flex flex-wrap gap-1 text-sm">
            {items.map((item) => (
              <Link
                key={String(item.to)}
                to={item.to}
                activeOptions={{ exact: String(item.to).split("/").length === 2 }}
                activeProps={{ className: "bg-primary-foreground/20 font-medium" }}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-primary-foreground/15"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      <div className="surface-card mt-6 flex min-h-40 items-center justify-center p-8 text-sm text-muted-foreground">
        Coming next — this section is scaffolded and ready to build.
      </div>
    </section>
  );
}
