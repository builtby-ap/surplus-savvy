import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Clock, MapPin, Package, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice } from "@/data/mock";
import { useAuth } from "@/lib/auth/auth-context";
import {
  approvePayment,
  fetchAdminPayments,
  rejectPayment,
  type AdminPayment,
  type AdminPaymentStatus,
} from "@/lib/payment-admin";

const statusLabels: Record<AdminPaymentStatus, string> = {
  awaiting_verification: "Awaiting verification",
  verified: "Verified",
  rejected: "Rejected",
  not_required: "Not required",
};

const statusBadgeClass: Record<AdminPaymentStatus, string> = {
  awaiting_verification: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  not_required: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payment verification — Phoe La Min admin" },
      {
        name: "description",
        content: "Review MMQR payment screenshots and release verified pickup orders to vendors.",
      },
      { property: "og:title", content: "Payment verification — Phoe La Min admin" },
      {
        property: "og:description",
        content: "Approve or reject customer payment proofs for pickup orders.",
      },
    ],
  }),
  component: PaymentVerificationPage,
});

function PaymentVerificationPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AdminPayment[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<AdminPayment | null>(null);
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminPaymentStatus | "all">("all");

  const load = useCallback(() => {
    fetchAdminPayments()
      .then(setOrders)
      .catch(() => {
        setOrders([]);
        toast.error("Could not load payments — admin access required.");
      });
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !q ||
        order.receiptNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || order.paymentStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const counts = useMemo(() => {
    if (!orders) return { all: 0, awaiting_verification: 0, verified: 0, rejected: 0 };
    return {
      all: orders.length,
      awaiting_verification: orders.filter((o) => o.paymentStatus === "awaiting_verification").length,
      verified: orders.filter((o) => o.paymentStatus === "verified").length,
      rejected: orders.filter((o) => o.paymentStatus === "rejected").length,
    };
  }, [orders]);

  const approve = async (order: AdminPayment) => {
    if (!user) return;
    setBusy(order.id);
    try {
      await approvePayment(order.id, user.id);
      toast.success(`Payment verified — ${order.receiptNumber} is now in the vendor's queue.`);
      load();
    } catch {
      toast.error("Could not verify this payment.");
    } finally {
      setBusy(null);
    }
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    const order = rejecting;
    setRejecting(null);
    setBusy(order.id);
    try {
      await rejectPayment(order.id, reason);
      toast.error(`Payment rejected — ${order.customerName} will be asked to re-upload.`);
      setReason("");
      load();
    } catch {
      toast.error("Could not reject this payment.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Payment verification</h2>
            <p className="text-sm text-muted-foreground">
              Pickup orders paid by MMQR stay hidden from vendors until you verify the transfer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill
              label="All"
              count={counts.all}
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            />
            <StatusPill
              label="Pending"
              count={counts.awaiting_verification}
              active={statusFilter === "awaiting_verification"}
              onClick={() => setStatusFilter("awaiting_verification")}
            />
            <StatusPill
              label="Verified"
              count={counts.verified}
              active={statusFilter === "verified"}
              onClick={() => setStatusFilter("verified")}
            />
            <StatusPill
              label="Rejected"
              count={counts.rejected}
              active={statusFilter === "rejected"}
              onClick={() => setStatusFilter("rejected")}
            />
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by receipt number or customer name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </section>

      {orders === null ? (
        <p className="text-sm text-muted-foreground">Loading payments…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <BadgeCheck className="mx-auto h-8 w-8 text-success" />
          <p className="mt-3 font-medium">No payments found</p>
          <p className="text-sm text-muted-foreground">
            {query || statusFilter !== "all"
              ? "Try adjusting your search or filter."
              : "Every submitted payment proof has been reviewed."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map((order) => (
            <article
              key={order.id}
              className="grid gap-6 rounded-3xl border border-border bg-card p-6 md:grid-cols-[minmax(0,320px)_1fr]"
            >
              <div>
                {order.screenshotUrl ? (
                  <a href={order.screenshotUrl} target="_blank" rel="noreferrer">
                    <img
                      src={order.screenshotUrl}
                      alt={`Payment screenshot for ${order.receiptNumber}`}
                      className="max-h-80 w-full rounded-2xl border border-border object-contain"
                    />
                  </a>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                    No screenshot uploaded
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.receiptNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.placedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusBadgeClass[order.paymentStatus]}>
                      {statusLabels[order.paymentStatus]}
                    </Badge>
                    <span className="text-lg font-semibold">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {order.customerName} · {order.customerEmail}
                    {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                  </p>
                  <p className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {order.vendorName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {order.method === "pickup"
                      ? `Pickup${order.pickupWindow ? ` · ${order.pickupWindow}` : ""}`
                      : "Delivery"}
                  </p>
                  {order.deliveryAddress ? (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {order.deliveryAddress}
                    </p>
                  ) : null}
                </div>

                <ul className="rounded-2xl bg-muted/50 p-4 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-0.5">
                      <span>
                        {item.quantity} × {item.title}
                      </span>
                      <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                    </li>
                  ))}
                  {order.notes ? (
                    <li className="pt-2 text-muted-foreground">Note: {order.notes}</li>
                  ) : null}
                </ul>

                {order.paymentStatus === "awaiting_verification" ? (
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={busy === order.id} onClick={() => void approve(order)}>
                      <BadgeCheck className="mr-2 h-4 w-4" /> Approve payment
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy === order.id}
                      onClick={() => {
                        setReason("");
                        setRejecting(order);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                ) : order.paymentStatus === "verified" ? (
                  <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                    <p className="font-medium">Verified by {order.paymentVerifiedByName ?? "admin"}</p>
                    <p className="text-xs opacity-80">
                      {order.paymentVerifiedAt
                        ? new Date(order.paymentVerifiedAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                ) : order.paymentStatus === "rejected" ? (
                  <div className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
                    <p className="font-medium">Rejected</p>
                    {order.paymentRejectionReason ? (
                      <p className="text-xs opacity-80">Reason: {order.paymentRejectionReason}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer will be asked to upload a new payment screenshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional) — e.g. amount does not match the order total."
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void confirmReject()}>
              Reject payment
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 text-xs ${
          active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
