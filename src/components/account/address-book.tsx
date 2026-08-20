import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddressFormDialog } from "@/components/account/address-form-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import {
  createAddress,
  deleteAddress,
  emptyAddress,
  makeDefaultAddress,
  updateAddress,
  useMyAddresses,
  type CustomerAddress,
  type CustomerAddressInput,
} from "@/lib/customer-addresses";

export function AddressBook() {
  const { user } = useAuth();
  const { addresses, reload } = useMyAddresses(Boolean(user));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [initial, setInitial] = useState<CustomerAddressInput>(emptyAddress);

  const list = addresses ?? [];

  function openNew() {
    setEditing(null);
    setInitial({
      ...emptyAddress,
      recipientName: user?.fullName ?? "",
      phone: user?.phone ?? "",
      isDefault: list.length === 0,
    });
    setOpen(true);
  }

  function openEdit(address: CustomerAddress) {
    const { id: _id, ...rest } = address;
    setEditing(address);
    setInitial(rest);
    setOpen(true);
  }

  async function submit(input: CustomerAddressInput) {
    if (editing) {
      await updateAddress(editing.id, input);
      toast.success("Address updated");
    } else {
      await createAddress(input);
      toast.success("Address saved");
    }
    await reload();
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
        <Button onClick={openNew} disabled={!user}>
          <Plus className="mr-2 size-4" /> Add address
        </Button>
      </div>

      {!user ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          Sign in to manage your saved delivery addresses.
        </div>
      ) : addresses === undefined ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          Loading your addresses…
        </div>
      ) : list.length === 0 ? (
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
          {list.map((address) => (
            <article key={address.id} className="surface-card space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{address.label}</h3>
                    {address.isDefault && <Badge>Default</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.recipientName} · {address.phone}
                  </p>
                </div>
                <MapPin className="size-5 shrink-0 text-primary" />
              </div>
              <p className="text-sm text-foreground">
                {address.buildingFloor && (
                  <>
                    {address.buildingFloor}
                    <br />
                  </>
                )}
                {address.addressLine}
                <br />
                {address.township}, {address.city}
              </p>
              {address.deliveryNote && (
                <p className="text-sm text-muted-foreground italic">“{address.deliveryNote}”</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {!address.isDefault && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await makeDefaultAddress(address.id);
                      await reload();
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
                  onClick={async () => {
                    await deleteAddress(address.id);
                    await reload();
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

      <AddressFormDialog
        open={open}
        onOpenChange={setOpen}
        initial={initial}
        title={editing ? "Edit address" : "Add address"}
        submitLabel={editing ? "Save changes" : "Add address"}
        onSubmit={submit}
      />
    </div>
  );
}
