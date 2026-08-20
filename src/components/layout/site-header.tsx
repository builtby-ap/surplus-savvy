import logoAsset from "@/assets/phoelamin-logo.png.asset.json";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Info, LogIn, LogOut, Store, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "System Update",
    message: "Phoelamin will undergo scheduled maintenance tonight at 2:00 AM.",
    time: "2 hours ago",
    type: "alert",
  },
  {
    id: "2",
    title: "New Feature",
    message: "Nearby-food discovery is now available on the Map Explorer.",
    time: "5 hours ago",
    type: "info",
  },
  {
    id: "3",
    title: "Payment Reminder",
    message: "Please upload your MMQR payment proof for pickup orders at checkout.",
    time: "1 day ago",
    type: "alert",
  },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const { user, vendorApplication, isAuthenticated, logout } = useAuth();
  const vendorApproved = vendorApplication?.verificationStatus === "approved";
  const isVendor = user?.role === "vendor";

  function handleLogout() {
    logout();
    toast.success("You have been logged out.");
    void navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logoAsset.url} alt="Phoe La Min logo" className="size-10 object-contain" />
          <span className="hidden font-[family-name:var(--font-display)] text-lg font-semibold text-primary sm:block">
            Phoe La Min
          </span>
        </Link>

        <div className="flex-1" />

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-warning" />
          </Button>

          {!isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/login">
                  <LogIn className="size-4" />
                  <span className="hidden sm:inline">Log In</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="rounded-full">
                    Register
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>Create an Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/register">
                      <User className="size-4" /> Continue as Customer
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/vendor/register">
                      <Store className="size-4" /> Register as Vendor
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <nav className="mr-1 hidden items-center gap-1 text-sm md:flex">
                {!isVendor ? (
                  <Link
                    to="/search"
                    className="rounded-full px-3 py-1.5 hover:bg-secondary"
                  >
                    {user?.role === "customer" ? "Browse Food" : "Marketplace"}
                  </Link>
                ) : null}
                {user?.role === "customer" ? (
                  <Link to="/account/orders" className="rounded-full px-3 py-1.5 hover:bg-secondary">
                    My Orders
                  </Link>
                ) : null}
                {isVendor && vendorApproved ? (
                  <>
                    <Link to="/dashboard/analytics" className="rounded-full px-3 py-1.5 hover:bg-secondary">
                      Dashboard
                    </Link>
                    <Link to="/dashboard/orders" className="rounded-full px-3 py-1.5 hover:bg-secondary">
                      Orders
                    </Link>
                    <Link to="/dashboard/mystery-bags" className="rounded-full px-3 py-1.5 hover:bg-secondary">
                      Secret Bags
                    </Link>
                    <Link to="/dashboard/profile" className="rounded-full px-3 py-1.5 hover:bg-secondary">
                      Store Profile
                    </Link>
                  </>
                ) : null}
                {user?.role === "vendor" && !vendorApproved ? (
                  <Link
                    to="/vendor/application-status"
                    className="rounded-full bg-accent/25 px-3 py-1.5 text-accent-foreground hover:bg-accent/40"
                  >
                    Application pending
                  </Link>
                ) : null}
                {user?.role === "admin" ? (
                  <Link to="/admin" className="rounded-full px-3 py-1.5 hover:bg-secondary">
                    Admin Dashboard
                  </Link>
                ) : null}
              </nav>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Account menu"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {initials(user?.fullName ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <span className="block truncate">{user?.fullName}</span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {user?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === "customer" ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/account">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/account/orders">My Orders</Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  {user?.role === "vendor" ? (
                    vendorApproved ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/analytics">Vendor Dashboard</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/orders">Orders</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/mystery-bags">Secret Bags</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/profile">Store Profile</Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link to="/vendor/application-status">Application status</Link>
                      </DropdownMenuItem>
                    )
                  ) : null}
                  {user?.role === "admin" ? (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut className="size-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
