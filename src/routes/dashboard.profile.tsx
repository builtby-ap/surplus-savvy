import { lazy, Suspense, useEffect, useState } from "react";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { businessTypeLabels, type BusinessType, type FulfillmentType } from "@/data/mock";
import { useMyVendor } from "@/lib/use-my-vendor";
import { createMyVendor, updateMyVendor, type VendorProfileInput } from "@/lib/vendor-db";
import { AdvertisePanel } from "@/components/vendor/advertise-panel";
import { fileToStoredImage, safeImage } from "@/lib/image-upload";



export const Route = createFileRoute("/dashboard/profile")({
  component: StoreProfilePage,
});

const LocationPicker = lazy(() => import("@/components/map/location-picker"));

const FULFILLMENTS: { value: FulfillmentType; label: string }[] = [
  { value: "pickup", label: "Pickup only" },
  { value: "delivery", label: "Delivery only" },
  { value: "both", label: "Pickup & delivery" },
];

const DEFAULT_POSITION = { latitude: 21.9588, longitude: 96.0891 };

type FormState = Required<VendorProfileInput>;

const emptyForm = (): FormState => ({
  name: "",
  type: "cafe",
  description: "",
  address: "",
  neighborhood: "",
  city: "",
  latitude: DEFAULT_POSITION.latitude,
  longitude: DEFAULT_POSITION.longitude,
  phone: "",
  email: "",
  fulfillment: "pickup",
  deliveryFee: 0,
  deliveryMinimum: 0,
  imageUrl: "",
});


function StoreProfilePage() {
  const { vendor, loading, refresh } = useMyVendor();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vendor) return;
    setForm({
      name: vendor.name,
      type: vendor.type,
      description: vendor.description,
      address: vendor.address,
      neighborhood: vendor.neighborhood,
      city: vendor.city,
      latitude: vendor.latitude || DEFAULT_POSITION.latitude,
      longitude: vendor.longitude || DEFAULT_POSITION.longitude,
      phone: vendor.phone,
      email: vendor.email,
      fulfillment: vendor.fulfillment,
      deliveryFee: vendor.deliveryFee,
      deliveryMinimum: vendor.deliveryMinimum,
      imageUrl: vendor.imageUrl ?? "",

    });
  }, [vendor]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      toast.error("Store name and address are required.");
      return;
    }
    setSaving(true);
    try {
      if (vendor) {
        await updateMyVendor(vendor.id, form);
        toast.success("Store profile updated");
      } else {
        await createMyVendor({ ...form, name: form.name.trim() });
        toast.success("Store submitted — an admin will review it shortly.");
      }
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your store.");
    } finally {
      setSaving(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Your browser can't share a location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        })),
      () => toast.error("Could not detect your location."),
    );
  }

  if (loading) {
    return <p className="surface-card p-6 text-sm text-muted-foreground">Loading your store…</p>;
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Store profile</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {vendor
              ? "Keep your storefront details, delivery terms and map pin up to date."
              : "Set up your store to start posting surplus food. Admins verify new stores before they go live."}
          </p>
        </div>
        {vendor && (
          <Badge variant="outline" className="ml-auto capitalize">
            {vendor.verificationStatus}
          </Badge>
        )}
      </header>

      {vendor?.verificationStatus === "rejected" && vendor.rejectionReason && (
        <p className="surface-card border-destructive/40 p-4 text-sm text-destructive">
          {vendor.rejectionReason}
        </p>
      )}

      {vendor?.displayAlias && (
        <p className="surface-card bg-secondary/40 p-4 text-sm">
          Customers see you as:{" "}
          <strong className="font-semibold">{vendor.displayAlias}</strong> — your real
          business name is never shown on the marketplace.
        </p>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div className="surface-card grid gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="logo">Business logo</Label>
            <div className="flex flex-wrap items-center gap-4">
              {form.imageUrl ? (
                <img
                  src={safeImage(form.imageUrl, "")}
                  alt="Business logo preview"
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50 text-xs text-muted-foreground">
                  No logo
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  className="max-w-xs"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const stored = await fileToStoredImage(file, 600);
                      setForm((prev) => ({ ...prev, imageUrl: stored }));
                    } catch {
                      toast.error("Could not read that image.");
                    }
                  }}
                />
                {form.imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Shown on your featured-business ads. Square images work best.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Store name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Business type</Label>
            <Select
              value={form.type}
              onValueChange={(value) => setForm({ ...form, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(businessTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value as BusinessType}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fulfillment</Label>
            <Select
              value={form.fulfillment}
              onValueChange={(value) =>
                setForm({ ...form, fulfillment: value as FulfillmentType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FULFILLMENTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Don't mention your real business name here — customers only see your
              mystery alias, and naming yourself in the description would reveal it.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Contact email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryFee">Delivery fee</Label>
            <Input
              id="deliveryFee"
              type="number"
              min={0}
              step="0.5"
              value={form.deliveryFee}
              onChange={(e) => setForm({ ...form, deliveryFee: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryMinimum">Delivery minimum</Label>
            <Input
              id="deliveryMinimum"
              type="number"
              min={0}
              step="0.5"
              value={form.deliveryMinimum}
              onChange={(e) => setForm({ ...form, deliveryMinimum: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="surface-card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Location</h2>
              <p className="text-sm text-muted-foreground">
                Drag the pin or tap the map to set exactly where customers collect.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={useMyLocation}>
              <MapPin className="mr-2 size-4" /> Use my location
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="address">Street address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input
                id="neighborhood"
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pinned coordinates</Label>
              <p className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">
                {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
              </p>
            </div>
          </div>

          <ClientOnly
            fallback={
              <div className="flex h-64 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                Loading map…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center rounded-xl bg-muted">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              }
            >
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(latitude, longitude) =>
                  setForm((prev) => ({ ...prev, latitude, longitude }))
                }
              />
            </Suspense>
          </ClientOnly>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : vendor ? "Save changes" : "Create store"}
        </Button>
      </form>

      {vendor && <AdvertisePanel vendorId={vendor.id} />}
    </section>

  );
}
