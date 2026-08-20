import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bike, Check, Info, LocateFixed, MapPin, Plus, QrCode, ShoppingBag, Timer, Upload } from "lucide-react";
import { toast } from "sonner";

import { PublicLayout } from "@/components/layout/public-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressFormDialog } from "@/components/account/address-form-dialog";
import {
  bagCategoryLabels,
  businessTypeLabels,
  formatPrice,
  getBag,
  getBusiness,
  getDeliveryTerms,
} from "@/data/mock";
import { postUuidById, vendorUuidById } from "@/data/catalogue";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { newOrderIds, saveOrder, type OrderItem, type OrderMethod } from "@/lib/orders";
import {
  createAddress,
  emptyAddress,
  formatAddress,
  makeDefaultAddress,
  updateAddress,
  useMyAddresses,
  validateAddress,
  type CustomerAddressInput,
} from "@/lib/customer-addresses";
import { usePaymentSettings, uploadPaymentScreenshot } from "@/lib/payments";
import { cn } from "@/lib/utils";



export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    bag: typeof search["bag"] === "string" ? (search["bag"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Checkout — Surplus Rescue" },
      { name: "description", content: "Reserve a single surplus food post, choose pickup or delivery and pay cash on collection." },
      { property: "og:title", content: "Checkout — Surplus Rescue" },
      { property: "og:description", content: "Reserve a single surplus food post, choose pickup or delivery and pay cash on collection." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { bag: bagParam } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const entry = useMemo(() => {
    const bag = getBag(bagParam);
    const business = bag ? getBusiness(bag.businessId) : undefined;
    if (!bag || !business) return null;
    return { bag, business, terms: getDeliveryTerms(business) };
  }, [bagParam]);

  const [method, setMethod] = useState<OrderMethod>("pickup");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  // Pickup orders are prepaid via MMQR and need a payment screenshot.
  const paymentSettings = usePaymentSettings();
  const screenshotInput = useRef<HTMLInputElement | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!screenshot) {
      setScreenshotPreview(null);
      return;
    }
    const url = URL.createObjectURL(screenshot);
    setScreenshotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);


  const { addresses, reload: reloadAddresses } = useMyAddresses(Boolean(user));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogInitial, setDialogInitial] = useState<CustomerAddressInput>(emptyAddress);
  /** Address typed at checkout by a customer with no saved address yet. */
  const [newAddress, setNewAddress] = useState<CustomerAddressInput>(emptyAddress);

  const savedList = addresses ?? [];
  const selected =
    savedList.find((a) => a.id === selectedId) ?? savedList.find((a) => a.isDefault) ?? savedList[0];

  useEffect(() => {
    if (!selectedId && selected) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    setNewAddress((prev) =>
      prev.recipientName || prev.phone
        ? prev
        : { ...prev, recipientName: user?.fullName ?? "", phone: user?.phone ?? "" },
    );
  }, [user?.fullName, user?.phone]);


  if (!entry) {
    return (
      <PublicLayout>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold">No food post selected</h1>
          <p className="mt-3 text-muted-foreground">
            Each secret bag is unique to its vendor, so you reserve one food post at a time.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/search">Browse food posts</Link>
          </Button>
        </section>
      </PublicLayout>
    );
  }

  const { bag, business, terms } = entry;
  const canDeliver = bag.fulfillment !== "pickup" && terms.offersDelivery;
  const subtotal = bag.discountedPrice;
  const originalTotal = bag.originalPrice;
  const deliveryFee = method === "delivery" ? terms.fee : 0;
  const total = subtotal + deliveryFee;
  const belowMinimum = method === "delivery" && subtotal < terms.minimumOrder;

  type Snapshot = CustomerAddressInput & { id: string | null };

  /** Mirrors the order into Supabase so the vendor dashboard sees it live. */
  async function persistToSupabase(
    receiptNumber: string,
    snapshot: Snapshot | null,
    screenshotPath: string | null,
  ) {
    const vendorUuid = vendorUuidById.get(business.id);
    if (!user || !vendorUuid) return;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        vendor_id: vendorUuid,
        receipt_number: receiptNumber,
        method,
        delivery_method: method,
        status: "pending",
        payment_status: method === "pickup" ? "awaiting_verification" : "not_required",
        payment_screenshot_url: method === "pickup" ? screenshotPath : null,
        notes: notes.trim(),

        ...(method === "delivery" && snapshot
          ? {
              delivery_address_id: snapshot.id,
              delivery_address: formatAddress(snapshot),
              delivery_recipient_name: snapshot.recipientName,
              delivery_phone: snapshot.phone,
              delivery_township: snapshot.township,
              delivery_city: snapshot.city,
              delivery_building_floor: snapshot.buildingFloor || null,
              delivery_note: snapshot.deliveryNote || null,
              delivery_latitude: snapshot.latitude,
              delivery_longitude: snapshot.longitude,
            }
          : {}),
        pickup_window: `${bag.availableFrom} – ${bag.availableUntil}`,
        original_price: originalTotal,
        item_price: subtotal,
        discount: originalTotal - subtotal,
        delivery_fee: deliveryFee,
        total,
      } as never)
      .select("id")
      .single();
    if (error || !data) return;
    await supabase.from("order_items").insert({
      order_id: (data as { id: string }).id,
      food_post_id: postUuidById.get(bag.id) ?? null,
      vendor_id: vendorUuid,
      title: bag.title,
      quantity: 1,
      original_price: bag.originalPrice,
      unit_price: bag.discountedPrice,
    } as never);
  }

  /** Resolves (and, on a first delivery order, saves) the delivery address. */
  async function resolveDeliverySnapshot(): Promise<Snapshot | null> {
    if (savedList.length > 0) {
      if (!selected) {
        toast.error("Choose a delivery address.");
        return null;
      }
      const { id, ...rest } = selected;
      return { ...rest, id };
    }
    const problem = validateAddress(newAddress);
    if (problem) {
      toast.error(problem);
      return null;
    }
    if (!user) return { ...newAddress, id: null };
    try {
      // First delivery order: save it and make it the default address.
      const saved = await createAddress({ ...newAddress, isDefault: true });
      await reloadAddresses();
      setSelectedId(saved.id);
      const { id, ...rest } = saved;
      return { ...rest, id };
    } catch {
      return { ...newAddress, id: null };
    }
  }

  async function placeOrder() {
    if (belowMinimum) {
      toast.error("This vendor's delivery minimum isn't met. Choose pickup instead.");
      return;
    }
    setPlacing(true);
    let snapshot: Snapshot | null = null;
    if (method === "delivery") {
      snapshot = await resolveDeliverySnapshot();
      if (!snapshot) {
        setPlacing(false);
        return;
      }
    }
    let screenshotPath: string | null = null;
    if (method === "pickup") {
      if (!screenshot || !user) {
        toast.error("Upload your payment screenshot first.");
        setPlacing(false);
        return;
      }
      try {
        screenshotPath = await uploadPaymentScreenshot(screenshot, user.id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Screenshot upload failed");
        setPlacing(false);
        return;
      }
    }
    const ids = newOrderIds();
    const orderItems: OrderItem[] = [
      {
        bagId: bag.id,
        businessId: business.id,
        title: bag.title,
        quantity: 1,
        originalPrice: bag.originalPrice,
        unitPrice: bag.discountedPrice,
      },
    ];
    saveOrder({
      ...ids,
      ...(user ? { customerId: user.id } : {}),
      items: orderItems,
      businessId: business.id,
      businessIds: [business.id],
      method,
      notes: notes.trim(),
      originalPrice: Number(originalTotal.toFixed(2)),
      itemPrice: Number(subtotal.toFixed(2)),
      discount: Number((originalTotal - subtotal).toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      total: Number(total.toFixed(2)),
      paymentStatus: method === "pickup" ? "awaiting_verification" : "not_required",
      ...(method === "delivery" && snapshot
        ? { deliveryAddress: formatAddress(snapshot) }
        : {}),
      pickupWindow: `${bag.availableFrom} – ${bag.availableUntil}`,
      placedAt: new Date().toISOString(),
    });
    void persistToSupabase(ids.receiptNumber, snapshot, screenshotPath);
    toast.success(
      method === "pickup"
        ? "Payment under review — the vendor will start preparing once your payment is verified."
        : "Order placed — pay cash on delivery.",
    );
    navigate({ to: "/order/$orderId", params: { orderId: ids.id } });

  }


  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Checkout</h1>
        <p className="mt-2 text-muted-foreground">
          One secret bag per order. No online payment — you pay cash when you collect or receive it.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold">Your food post</h2>
              <div className="mt-4 flex gap-3">
                <img
                  src={bag.image}
                  alt={bag.title}
                  loading="lazy"
                  className="size-20 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/bag/$bagId"
                    params={{ bagId: bag.id }}
                    className="truncate font-medium hover:underline"
                  >
                    {bag.title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {business.name} · {businessTypeLabels[business.type]}
                  </p>
                  <Badge variant="secondary" className="mt-1 rounded-full text-[11px]">
                    {bagCategoryLabels[bag.category]}
                  </Badge>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {bag.quantityLeft} left · quantity 1
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground line-through">
                    {formatPrice(bag.originalPrice)}
                  </p>
                  <p className="font-semibold text-accent">{formatPrice(bag.discountedPrice)}</p>
                </div>
              </div>
            </div>

            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold">How would you like to get it?</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMethod("pickup")}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    method === "pickup" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <ShoppingBag className="size-4" /> Pickup
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Collect in store — free
                  </span>
                </button>
                <button
                  type="button"
                  disabled={!canDeliver}
                  onClick={() => setMethod("delivery")}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    method === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Bike className="size-4" /> Delivery
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {canDeliver ? `${formatPrice(terms.fee)} fee` : "Not offered for this food post"}
                  </span>
                </button>
              </div>

              {method === "delivery" ? (
                <div className="mt-4 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
                  <p>
                    {business.name}: fee <strong>{formatPrice(terms.fee)}</strong> · minimum{" "}
                    <strong>{formatPrice(terms.minimumOrder)}</strong>
                  </p>
                  {savedList.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Label>Delivery address</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setDialogInitial({
                              ...emptyAddress,
                              recipientName: user?.fullName ?? "",
                              phone: user?.phone ?? "",
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Plus className="mr-1 size-4" /> Add new
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {savedList.map((a) => (
                          <div
                            key={a.id}
                            className={cn(
                              "rounded-2xl border bg-background p-3 transition-colors",
                              selected?.id === a.id
                                ? "border-primary"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedId(a.id)}
                              className="block w-full text-left"
                            >
                              <span className="flex items-center gap-2 font-medium">
                                {a.label}
                                {a.isDefault && (
                                  <Badge variant="secondary" className="rounded-full text-[10px]">
                                    Default
                                  </Badge>
                                )}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {a.recipientName} · {a.phone}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {formatAddress(a)}
                              </span>
                            </button>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs">
                              <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => {
                                  const { id: _id, ...rest } = a;
                                  setEditingId(a.id);
                                  setDialogInitial(rest);
                                  setDialogOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              {!a.isDefault && (
                                <button
                                  type="button"
                                  className="text-primary hover:underline"
                                  onClick={async () => {
                                    await makeDefaultAddress(a.id);
                                    await reloadAddresses();
                                    setSelectedId(a.id);
                                    toast.success(`${a.label} is now your default`);
                                  }}
                                >
                                  Set as default
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label>Delivery address</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Recipient name"
                          value={newAddress.recipientName}
                          className="bg-background"
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, recipientName: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Phone"
                          value={newAddress.phone}
                          className="bg-background"
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        />
                      </div>
                      <Input
                        placeholder="Address"
                        value={newAddress.addressLine}
                        className="bg-background"
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, addressLine: e.target.value })
                        }
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Township"
                          value={newAddress.township}
                          className="bg-background"
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, township: e.target.value })
                          }
                        />
                        <Input
                          placeholder="City"
                          value={newAddress.city}
                          className="bg-background"
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          placeholder="Building / floor (optional)"
                          value={newAddress.buildingFloor}
                          className="bg-background"
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, buildingFloor: e.target.value })
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-background"
                          onClick={() => {
                            if (typeof navigator === "undefined" || !navigator.geolocation) {
                              toast.error("Location isn't available on this device.");
                              return;
                            }
                            navigator.geolocation.getCurrentPosition(
                              (pos) =>
                                setNewAddress((f) => ({
                                  ...f,
                                  latitude: Number(pos.coords.latitude.toFixed(6)),
                                  longitude: Number(pos.coords.longitude.toFixed(6)),
                                })),
                              () => toast.error("Couldn't get your location."),
                            );
                          }}
                        >
                          <LocateFixed className="mr-2 size-4" />
                          {newAddress.latitude != null ? "Location pinned" : "Use my location"}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Delivery note (optional)"
                        rows={2}
                        value={newAddress.deliveryNote}
                        className="bg-background"
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, deliveryNote: e.target.value })
                        }
                      />
                      {user && (
                        <p className="text-xs text-muted-foreground">
                          We'll save this as your default delivery address.
                        </p>
                      )}
                    </div>
                  )}

                  {belowMinimum && (
                    <p className="text-sm font-medium text-destructive">
                      This vendor's delivery minimum isn't met. Choose pickup instead.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3 rounded-2xl bg-secondary/60 p-4 text-sm">
                  <p className="font-medium">{business.name}</p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    {business.address}, {business.neighborhood}
                  </p>
                  <p className="flex items-center gap-2">
                    <Timer className="size-4 shrink-0 text-primary" />
                    Collect between {bag.availableFrom} and {bag.availableUntil}
                  </p>
                </div>
              )}
            </div>

            <div className="surface-card p-5">
              <Label htmlFor="notes" className="text-sm font-semibold">
                Special requests {method === "delivery" ? "/ delivery notes" : ""}
              </Label>
              <Textarea
                id="notes"
                rows={4}
                maxLength={500}
                placeholder={
                  method === "delivery"
                    ? "Gate code, floor, where to leave it…"
                    : "Allergies, arrival time, anything the vendor should know…"
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">{notes.length}/500</p>
            </div>
          </div>

          <aside className="surface-card h-fit p-5">
            <h2 className="text-sm font-semibold">Order summary</h2>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>Original value</dt>
                <dd className="line-through">{formatPrice(originalTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Food post price</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-success">
                <dt>You save</dt>
                <dd>-{formatPrice(originalTotal - subtotal)}</dd>
              </div>
              {method === "delivery" && (
                <div className="flex justify-between">
                  <dt>Delivery fee</dt>
                  <dd>{formatPrice(deliveryFee)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total due</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            {method === "delivery" ? (
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-accent/15 p-3 text-xs">
                <Info className="mt-0.5 size-4 shrink-0" />
                Pay cash on delivery — no online payment needed.
              </p>
            ) : (
              <div className="mt-5 space-y-4 rounded-2xl border border-border p-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <QrCode className="size-4 text-primary" /> Pay with MMQR
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paymentSettings?.instructions ||
                      "Scan the QR code with any MMQR-supporting banking app and pay the total above."}
                  </p>
                </div>

                {paymentSettings === undefined ? (
                  <p className="text-xs text-muted-foreground">Loading payment details…</p>
                ) : paymentSettings?.qrImageUrl ? (
                  <div className="text-center">
                    <img
                      src={paymentSettings.qrImageUrl}
                      alt="MMQR payment QR code"
                      className="mx-auto max-h-56 rounded-2xl border border-border bg-background object-contain p-2"
                    />
                    {paymentSettings.accountName && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Account name: <strong>{paymentSettings.accountName}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                    The payment QR code isn't configured yet. Please contact support before ordering.
                  </p>
                )}

                <div>
                  <p className="text-sm font-medium">Upload payment screenshot</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Required — the vendor verifies it before preparing your order.
                  </p>
                  <input
                    ref={screenshotInput}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full rounded-full"
                    onClick={() => screenshotInput.current?.click()}
                  >
                    {screenshot ? (
                      <>
                        <Check className="mr-2 size-4 text-success" /> Change screenshot
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 size-4" /> Choose screenshot
                      </>
                    )}
                  </Button>
                  {screenshotPreview && (
                    <img
                      src={screenshotPreview}
                      alt="Payment screenshot preview"
                      className="mt-3 max-h-48 w-full rounded-2xl border border-border object-contain"
                    />
                  )}
                  {!user && (
                    <p className="mt-2 text-xs text-destructive">
                      Sign in to upload your payment screenshot.
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button
              size="lg"
              disabled={
                placing ||
                bag.quantityLeft === 0 ||
                (method === "pickup" && (!screenshot || !user))
              }
              onClick={placeOrder}
              className="mt-4 w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >

              {placing ? "Placing order…" : "Place order"}
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
              <Link to="/search">Back to browsing</Link>
            </Button>
          </aside>
        </div>
      </section>

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={dialogInitial}
        title={editingId ? "Edit address" : "Add address"}
        submitLabel={editingId ? "Save changes" : "Add address"}
        onSubmit={async (input) => {
          if (editingId) {
            await updateAddress(editingId, input);
            toast.success("Address updated");
            await reloadAddresses();
            setSelectedId(editingId);
          } else {
            const saved = await createAddress(input);
            toast.success("Address saved");
            await reloadAddresses();
            setSelectedId(saved.id);
          }
        }}
      />
    </PublicLayout>

  );
}
