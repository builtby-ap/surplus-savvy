import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Check, Megaphone, MousePointerClick, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  activateAdvertisement,
  endAdvertisement,
  fetchAdminAdvertisements,
  rejectAdvertisement,
  type AdminAdvertisement,
  type AdStatus,
} from "@/lib/advertising";

export const Route = createFileRoute("/admin/advertising")({
  component: AdminAdvertisingPage,
});

const statusClass: Record<AdStatus, string> = {
  pending: "bg-accent text-accent-foreground",
  active: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  expired: "bg-muted text-muted-foreground",
};

const statusLabel: Record<AdStatus, string> = {
  pending: "Pending review",
  active: "Active",
  rejected: "Rejected",
  expired: "Expired",
};

const formatDate = (value: string | null) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "—";

const formatMMK = (value: number | null) =>
  value === null ? "—" : `${value.toLocaleString()} MMK`;

interface DraftState {
  startDate: string;
  endDate: string;
  cost: string;
}

function AdminAdvertisingPage() {
  const [ads, setAds] = useState<AdminAdvertisement[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    fetchAdminAdvertisements()
      .then(setAds)
      .catch(() => toast.error("Could not load advertisements — admin access required."));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = useMemo(() => ads.filter((a) => a.status === "pending"), [ads]);
  const active = useMemo(() => ads.filter((a) => a.status === "active"), [ads]);

  const draftFor = (ad: AdminAdvertisement): DraftState =>
    drafts[ad.id] ?? {
      startDate: ad.startDate ?? ad.requestedStartDate,
      endDate: ad.endDate ?? ad.requestedEndDate,
      cost: ad.cost === null ? "" : String(ad.cost),
    };

  const setDraft = (id: string, patch: Partial<DraftState>, base: DraftState) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...base, ...patch } }));

  const activate = async (ad: AdminAdvertisement) => {
    const draft = draftFor(ad);
    const cost = Number(draft.cost.replace(/[^\d.]/g, ""));
    if (!draft.startDate || !draft.endDate) {
      toast.error("Set both a start and an end date.");
      return;
    }
    if (draft.endDate < draft.startDate) {
      toast.error("End date must be after the start date.");
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      toast.error("Enter the cost for this campaign.");
      return;
    }
    setBusy(ad.id);
    try {
      await activateAdvertisement({
        id: ad.id,
        vendorId: ad.vendorId,
        startDate: draft.startDate,
        endDate: draft.endDate,
        cost,
        tagline: ad.tagline,
      });
      toast.success(`${ad.vendorName} is now featured until ${formatDate(draft.endDate)}.`);
      await load();
    } catch {
      toast.error("Could not activate this advertisement.");
    } finally {
      setBusy(null);
    }
  };

  const reject = async (ad: AdminAdvertisement) => {
    setBusy(ad.id);
    try {
      await rejectAdvertisement(ad.id);
      toast.error(`${ad.vendorName}'s advertising request was rejected.`);
      await load();
    } catch {
      toast.error("Could not reject this advertisement.");
    } finally {
      setBusy(null);
    }
  };

  const end = async (ad: AdminAdvertisement) => {
    setBusy(ad.id);
    try {
      await endAdvertisement(ad.id, ad.vendorId);
      toast(`${ad.vendorName}'s campaign has ended.`);
      await load();
    } catch {
      toast.error("Could not end this advertisement.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-4">
        {(
          [
            ["Pending requests", pending.length],
            ["Active campaigns", active.length],
            ["Impressions (active)", active.reduce((s, a) => s + a.impressions, 0)],
            ["Clicks (active)", active.reduce((s, a) => s + a.clicks, 0)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="surface-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Megaphone className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Advertising requests</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the final dates and cost before activating a campaign. Active vendors appear in the
          Featured Businesses carousel with their real business name.
        </p>

        {pending.length === 0 ? (
          <div className="surface-card mt-4 p-8 text-center text-sm text-muted-foreground">
            No advertising requests are waiting for review.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {pending.map((ad) => {
              const draft = draftFor(ad);
              return (
                <article key={ad.id} className="surface-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{ad.vendorName}</h3>
                      <p className="text-sm text-muted-foreground">{ad.vendorType}</p>
                    </div>
                    <Badge className={statusClass[ad.status]}>{statusLabel[ad.status]}</Badge>
                  </div>

                  <p className="mt-3 text-sm">
                    Requested {formatDate(ad.requestedStartDate)} – {formatDate(ad.requestedEndDate)}
                  </p>
                  {ad.tagline ? (
                    <p className="mt-1 text-sm italic text-muted-foreground">“{ad.tagline}”</p>
                  ) : null}

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label htmlFor={`start-${ad.id}`}>Start date</Label>
                      <Input
                        id={`start-${ad.id}`}
                        type="date"
                        value={draft.startDate}
                        onChange={(e) => setDraft(ad.id, { startDate: e.target.value }, draft)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`end-${ad.id}`}>End date</Label>
                      <Input
                        id={`end-${ad.id}`}
                        type="date"
                        value={draft.endDate}
                        onChange={(e) => setDraft(ad.id, { endDate: e.target.value }, draft)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`cost-${ad.id}`}>Cost (MMK)</Label>
                      <Input
                        id={`cost-${ad.id}`}
                        inputMode="numeric"
                        placeholder="50000"
                        value={draft.cost}
                        onChange={(e) => setDraft(ad.id, { cost: e.target.value }, draft)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <Button
                      className="rounded-xl"
                      disabled={busy === ad.id}
                      onClick={() => void activate(ad)}
                    >
                      <Check className="size-4" /> Activate
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={busy === ad.id}
                      onClick={() => void reject(ad)}
                    >
                      <X className="size-4" /> Reject
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Active campaigns</h2>
        </div>
        {active.length === 0 ? (
          <div className="surface-card mt-4 p-8 text-center text-sm text-muted-foreground">
            No campaigns are running right now.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {active.map((ad) => (
              <article key={ad.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{ad.vendorName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(ad.startDate ?? ad.requestedStartDate)} –{" "}
                      {formatDate(ad.endDate ?? ad.requestedEndDate)} · {formatMMK(ad.cost)}
                    </p>
                  </div>
                  <Badge className={statusClass[ad.status]}>{statusLabel[ad.status]}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BarChart3 className="size-3.5" /> Impressions
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {ad.impressions.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/60 p-3">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MousePointerClick className="size-3.5" /> Clicks
                    </p>
                    <p className="mt-1 text-xl font-semibold">{ad.clicks.toLocaleString()}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="mt-5 rounded-xl"
                  disabled={busy === ad.id}
                  onClick={() => void end(ad)}
                >
                  End campaign early
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">All advertisement requests</h2>
        <div className="surface-card mt-4 overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Requested dates</TableHead>
                <TableHead className="hidden md:table-cell">Tagline</TableHead>
                <TableHead className="hidden lg:table-cell">Final window</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No advertisement requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="font-medium">{ad.vendorName}</div>
                      <div className="text-xs text-muted-foreground">{ad.vendorType}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(ad.requestedStartDate)} – {formatDate(ad.requestedEndDate)}
                    </TableCell>
                    <TableCell className="hidden max-w-56 md:table-cell text-sm text-muted-foreground">
                      {ad.tagline ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {ad.startDate || ad.endDate
                        ? `${formatDate(ad.startDate)} – ${formatDate(ad.endDate)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{formatMMK(ad.cost)}</TableCell>
                    <TableCell>
                      <Badge className={statusClass[ad.status]}>{statusLabel[ad.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
