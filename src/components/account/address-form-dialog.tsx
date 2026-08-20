import { useEffect, useState } from "react";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addressLabels,
  validateAddress,
  type CustomerAddressInput,
} from "@/lib/customer-addresses";
import { cn } from "@/lib/utils";

export function AddressFormDialog({
  open,
  onOpenChange,
  initial,
  title,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: CustomerAddressInput;
  title: string;
  submitLabel: string;
  onSubmit: (input: CustomerAddressInput) => Promise<void>;
}) {
  const [form, setForm] = useState<CustomerAddressInput>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function detectLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Location isn't available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        toast.success("Location pinned to this address");
      },
      () => toast.error("Couldn't get your location."),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validateAddress(form);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save address.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Used for delivery orders and pickup contact details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Label</Label>
            <div className="flex gap-2">
              {addressLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm({ ...form, label })}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-colors",
                    form.label === label
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient name</Label>
              <Input
                id="recipient"
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line">Address</Label>
            <Input
              id="address_line"
              value={form.addressLine}
              placeholder="No. 42, Bogyoke Aung San Rd"
              onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="township">Township</Label>
              <Input
                id="township"
                value={form.township}
                onChange={(e) => setForm({ ...form, township: e.target.value })}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="building">Building / floor (optional)</Label>
            <Input
              id="building"
              value={form.buildingFloor}
              onChange={(e) => setForm({ ...form, buildingFloor: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Delivery note (optional)</Label>
            <Textarea
              id="note"
              rows={3}
              value={form.deliveryNote}
              placeholder="Landmarks, gate colour, floor…"
              onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" size="sm" onClick={detectLocation}>
              <LocateFixed className="mr-2 size-4" />
              {form.latitude != null ? "Update location" : "Use my location (optional)"}
            </Button>
            {form.latitude != null && form.longitude != null && (
              <span className="text-xs text-muted-foreground">
                {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
              </span>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={form.isDefault}
              onCheckedChange={(checked) => setForm({ ...form, isDefault: checked === true })}
            />
            Set as default address
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
