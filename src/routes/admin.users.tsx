import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, Mail, Phone, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listUsers,
  roleLabels,
  setUserStatus,
  type PlatformUser,
} from "@/lib/platform-users";
import type { UserRole } from "@/lib/auth/types";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User accounts — Surplus Rescue Admin" },
      {
        name: "description",
        content:
          "Review customer, vendor and admin accounts, their activity and suspend or reactivate access.",
      },
      { property: "og:title", content: "User accounts — Surplus Rescue Admin" },
      {
        property: "og:description",
        content: "Manage marketplace user accounts, roles and account status.",
      },
    ],
  }),
  component: AdminUsersPage,
});

const roleFilters: Array<{ key: "all" | UserRole; label: string }> = [
  { key: "all", label: "All" },
  { key: "customer", label: "Customers" },
  { key: "vendor", label: "Vendors" },
  { key: "admin", label: "Admins" },
];

const money = (v: number) => `${v.toLocaleString()} MMK`;
const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function AdminUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [role, setRole] = useState<"all" | UserRole>("all");
  const [query, setQuery] = useState("");
  const [suspending, setSuspending] = useState<PlatformUser | null>(null);

  useEffect(() => {
    setUsers(listUsers());
  }, []);

  const stats = useMemo(
    () => ({
      total: users.length,
      customers: users.filter((u) => u.role === "customer").length,
      vendors: users.filter((u) => u.role === "vendor").length,
      suspended: users.filter((u) => u.status === "suspended").length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (role === "all" || u.role === role) &&
        (q === "" ||
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? "").includes(q)),
    );
  }, [users, role, query]);

  const activate = (user: PlatformUser) => {
    setUsers(setUserStatus(user.id, "active"));
    toast.success(`${user.fullName} reactivated.`);
  };

  const confirmSuspend = () => {
    if (!suspending) return;
    setUsers(setUserStatus(suspending.id, "suspended"));
    toast.success(`${suspending.fullName} suspended.`);
    setSuspending(null);
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold">User accounts</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every customer, vendor and admin account on the marketplace, with activity
        and account status controls.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total accounts", value: stats.total, icon: Users },
          { label: "Customers", value: stats.customers, icon: Users },
          { label: "Vendors", value: stats.vendors, icon: ShieldCheck },
          { label: "Suspended", value: stats.suspended, icon: Ban },
        ].map((card) => (
          <div key={card.label} className="surface-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <card.icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search users"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {roleFilters.map((f) => (
            <Button
              key={f.key}
              type="button"
              size="sm"
              variant={role === f.key ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setRole(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="surface-card mt-4 overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id} className={user.status === "suspended" ? "opacity-70" : ""}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {initials(user.fullName)}
                    </span>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.provider === "google" ? "Google sign-in" : "Email & password"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="flex items-center gap-1.5 text-sm">
                    <Mail className="size-3.5 text-muted-foreground" />
                    {user.email}
                  </p>
                  {user.phone ? (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3.5" />
                      {user.phone}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[user.role]}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {date(user.joinedAt)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{user.orders}</TableCell>
                <TableCell className="text-right tabular-nums">{money(user.spent)}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      user.status === "active"
                        ? "bg-success text-success-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }
                  >
                    {user.status === "active" ? "Active" : "Suspended"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {user.status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={user.role === "admin"}
                      onClick={() => setSuspending(user)}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => activate(user)}>
                      Reactivate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No accounts match your filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={suspending !== null} onOpenChange={(open) => !open && setSuspending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {suspending?.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to the marketplace until an admin reactivates the
              account. Existing orders are not cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSuspend}>Suspend account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
