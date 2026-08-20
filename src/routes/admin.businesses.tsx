import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock, MapPin, Mail, Phone, ShieldCheck, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  listVendors,
  setVendorStatus,
  vendorStatusLabels,
  type VendorRecord,
  type VendorStatus,
} from "@/lib/vendor-registry";

export const Route = createFileRoute("/admin/businesses")({
  component: VendorApprovalPage,
});

const statusClass: Record<VendorStatus, string> = {
  pending: "bg-accent text-accent-foreground",
  approved: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  deactivated: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: VendorStatus }) {
  return <Badge className={statusClass[status]}>{vendorStatusLabels[status]}</Badge>;
}

function VendorApprovalPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [rejecting, setRejecting] = useState<VendorRecord | null>(null);
  const [reason, setReason] = useState("");
  const [deactivating, setDeactivating] = useState<VendorRecord | null>(null);

  useEffect(() => {
    setVendors(listVendors());
  }, []);

  const pending = useMemo(() => vendors.filter((v) => v.status === "pending"), [vendors]);
  const counts = useMemo(
    () => ({
      approved: vendors.filter((v) => v.status === "approved").length,
      pending: pending.length,
      rejected: vendors.filter((v) => v.status === "rejected").length,
      deactivated: vendors.filter((v) => v.status === "deactivated").length,
    }),
    [vendors, pending.length],
  );

  const apply = (vendor: VendorRecord, status: VendorStatus, note?: string) => {
    setVendors(setVendorStatus(vendor.id, status, note));
  };

  const approve = (vendor: VendorRecord) => {
    apply(vendor, "approved");
    toast.success(`${vendor.name} approved — their food posts are now public.`);
  };

  const confirmReject = () => {
    if (!rejecting) return;
    apply(rejecting, "rejected", reason.trim() || undefined);
    toast.error(`${rejecting.name} rejected — they'll see the reason on their status page.`);
    setRejecting(null);
    setReason("");
  };

  const confirmDeactivate = () => {
    if (!deactivating) return;
    apply(deactivating, "deactivated");
    toast(`${deactivating.name} deactivated — their food posts are hidden.`);
    setDeactivating(null);
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        {(
          [
            ["Pending review", counts.pending],
            ["Approved", counts.approved],
            ["Rejected", counts.rejected],
            ["Deactivated", counts.deactivated],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="surface-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Vendor approval queue</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review submitted business details before their food posts go live on the marketplace.
        </p>

        {pending.length === 0 ? (
          <div className="surface-card mt-4 p-8 text-center text-sm text-muted-foreground">
            No vendors are waiting for verification right now.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {pending.map((vendor) => (
              <article key={vendor.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground">{vendor.type}</p>
                  </div>
                  <StatusBadge status={vendor.status} />
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>{vendor.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    <span>{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      Submitted {new Date(vendor.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {vendor.documents ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {[vendor.documents.businessLicense, vendor.documents.fdaApproval].map(
                        (doc) => (
                          <span
                            key={doc}
                            className="inline-flex items-center gap-1 rounded-lg bg-secondary/70 px-2 py-1 text-xs"
                          >
                            <FileText className="size-3.5" />
                            {doc}
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}
                </dl>

                <div className="mt-5 flex gap-3">
                  <Button className="rounded-xl" onClick={() => approve(vendor)}>
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setRejecting(vendor);
                      setReason("");
                    }}
                  >
                    <X className="size-4" /> Reject
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">All vendors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current verification status across the platform. Deactivating an approved vendor hides
          their food posts immediately.
        </p>
        <div className="surface-card mt-4 overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="font-medium">{vendor.name}</div>
                    <div className="text-xs text-muted-foreground">{vendor.address}</div>
                  </TableCell>
                  <TableCell className="text-sm">{vendor.type}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    <div>{vendor.email}</div>
                    <div className="text-xs text-muted-foreground">{vendor.phone}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vendor.status} />
                    {vendor.status === "rejected" && vendor.rejectionReason ? (
                      <p className="mt-1 max-w-56 text-xs text-muted-foreground">
                        {vendor.rejectionReason}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {vendor.status === "approved" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => setDeactivating(vendor)}
                        >
                          Deactivate
                        </Button>
                      ) : null}
                      {vendor.status === "pending" ? (
                        <>
                          <Button size="sm" className="rounded-lg" onClick={() => approve(vendor)}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => {
                              setRejecting(vendor);
                              setReason("");
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                      {vendor.status === "deactivated" || vendor.status === "rejected" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => {
                            apply(vendor, "approved");
                            toast.success(`${vendor.name} reactivated.`);
                          }}
                        >
                          Reactivate
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.name}</DialogTitle>
            <DialogDescription>
              The vendor sees this reason on their application status page.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Business license could not be verified."
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={confirmReject}>
              Reject vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => !open && setDeactivating(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivating?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their food posts will be hidden from the marketplace until you reactivate them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl" onClick={confirmDeactivate}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
