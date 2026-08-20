import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Clock, MapPin, Package, User, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  fetchPendingPayments,
  rejectPayment,
  type PendingPayment,
} from "@/lib/payment-admin";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payment verification — Surplus Rescue admin" },
      {
        name: "description",
        content: "Review MMQR payment screenshots and release verified pickup orders to vendors.",
      },
      { property: "og:title", content: "Payment verification — Surplus Rescue admin" },
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
  const [orders, setOrders] = useState<PendingPayment[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingPayment | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    fetchPendingPayments()
      .then(setOrders)
      .catch(() => {
        setOrders([]);
        toast.error("Could not load payments — admin access required.");
      });
  }, []);

  useEffect(load, [load]);

  const approve = async (order: PendingPayment) => {
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Payment verification</h2>
            <p className="text-sm text-muted-foreground">
              Pickup orders paid by MMQR stay hidden from vendors until you verify the transfer.
            </p>
          </div>
          <Badge className="bg-accent text-accent-foreground">
            {orders?.length ?? 0} awaiting review
          </Badge>
        </div>
      </section>

      {orders === null ? (
        <p className="text-sm text-muted-foreground">Loading payments…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <BadgeCheck className="mx-auto h-8 w-8 text-success" />
          <p className="mt-3 font-medium">No payments waiting</p>
          <p className="text-sm text-muted-foreground">
            Every submitted payment proof has been reviewed.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {orders.map((order) => (
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
                  <span className="text-lg font-semibold">{formatPrice(order.total)}</span>
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
