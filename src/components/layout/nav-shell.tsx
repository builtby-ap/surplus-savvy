import type { ReactNode } from "react";
import logoAsset from "@/assets/phoelamin-logo.png.asset.json";
import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export interface NavItem {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  badge?: number;
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
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuth();

  async function handleLogout() {
    await logout();
    void navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Phoe La Min logo" className="size-8 rounded-full bg-background object-contain" />
            <span className="font-[family-name:var(--font-display)] text-base font-semibold">
              Phoe La Min
            </span>
          </Link>
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs uppercase tracking-wide">
            {title}
          </span>
          <nav className="ml-auto flex flex-wrap items-center gap-1 text-sm">
            {items.map((item) => (
              <Link
                key={String(item.to)}
                to={item.to}
                activeOptions={{ exact: String(item.to).split("/").length === 2 }}
                activeProps={{ className: "bg-primary-foreground/20 font-medium" }}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-primary-foreground/15"
              >
                {item.label}
                {item.badge ? (
                  <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-semibold leading-none text-destructive-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            ) : null}
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
