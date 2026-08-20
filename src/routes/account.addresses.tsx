import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ensureDemoAddresses,
  listAddresses,
  removeAddress,
  saveAddress,
  setDefaultAddress,
  type AddressInput,
  type SavedAddress,
} from "@/lib/addresses";

export const Route = createFileRoute("/account/addresses")({
  component: AddressesPage,
});

const emptyForm: AddressInput = {
  label: "",
  recipient: "",
  phone: "",
  line1: "",
  city: "Yangon",
  notes: "",
  isDefault: false,
};

function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<AddressInput>(emptyForm);

  useEffect(() => {
    ensureDemoAddresses(user?.fullName, user?.phone);
    setAddresses(listAddresses());
  }, [user?.fullName, user?.phone]);

  function openNew() {
    setEditingId(undefined);
    setForm({
      ...emptyForm,
      recipient: user?.fullName ?? "",
      phone: user?.phone ?? "",
      isDefault: addresses.length === 0,
    });
    setOpen(true);
  }

  function openEdit(address: SavedAddress) {
    const { id, ...rest } = address;
    setEditingId(id);
    setForm(rest);
    setOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.label.trim() || !form.recipient.trim() || !form.line1.trim()) {
      toast.error("Label, recipient and street address are required.");
      return;
    }
    setAddresses(saveAddress(form, editingId));
    setOpen(false);
    toast.success(editingId ? "Address updated" : "Address saved");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Delivery addresses</h2>
          <p className="text-sm text-muted-foreground">
            Saved spots we can drop your rescued food off at.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 size-4" /> Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
          <MapPin className="size-8 text-muted-foreground" />
          <p className="font-medium text-foreground">No addresses yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add a delivery address to check out faster next time.
          </p>
          <Button onClick={openNew} variant="secondary">
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="surface-card space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{address.label}</h3>
                    {address.isDefault && <Badge>Default</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.recipient} · {address.phone}
                  </p>
                </div>
                <MapPin className="size-5 shrink-0 text-primary" />
              </div>
              <p className="text-sm text-foreground">
                {address.line1}
                <br />
                {address.city}
              </p>
              {address.notes && (
                <p className="text-sm text-muted-foreground italic">“{address.notes}”</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {!address.isDefault && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setAddresses(setDefaultAddress(address.id));
                      toast.success(`${address.label} is now your default`);
                    }}
                  >
                    <Star className="mr-2 size-4" /> Make default
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openEdit(address)}>
                  <Pencil className="mr-2 size-4" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAddresses(removeAddress(address.id));
                    toast.success("Address removed");
                  }}
                >
                  <Trash2 className="mr-2 size-4" /> Remove
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit address" : "Add address"}</DialogTitle>
              <DialogDescription>
                Used for delivery orders and pickup contact details.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={form.label}
                  placeholder="Home, Office…"
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City / township</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                <Input
                  id="recipient"
                  value={form.recipient}
                  onChange={(e) => setForm({ ...form, recipient: e.target.value })}
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
              <Label htmlFor="line1">Street address</Label>
              <Input
                id="line1"
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Delivery notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes ?? ""}
                placeholder="Landmarks, gate colour, floor…"
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={form.isDefault}
                onCheckedChange={(checked) => setForm({ ...form, isDefault: checked === true })}
              />
              Set as default address
            </label>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? "Save changes" : "Add address"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
