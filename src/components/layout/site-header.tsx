import { Link } from "@tanstack/react-router";
import { Bell, LogIn, Search, ShoppingBag, Sprout } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sprout className="size-5" />
          </span>
          <span className="hidden font-[family-name:var(--font-display)] text-lg font-semibold text-primary sm:block">
            Surplus Rescue
          </span>
        </Link>

        <form
          className="relative ml-1 flex-1"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search mystery bags and businesses"
            placeholder="Search bags, bakeries, cafes…"
            className="h-10 rounded-full border-border bg-card pl-9"
          />
        </form>

        <div className="flex shrink-0 items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="relative rounded-full">
            <Link to="/account/orders" aria-label="Your orders">
              <ShoppingBag className="size-5" />
              <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
                2
              </Badge>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-warning" />
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/login">
              <LogIn className="size-4" />
              <span className="hidden sm:inline">Log in</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
