import { useCallback, useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/data/mock";
import { fileToStoredImage } from "@/lib/image-upload";
import {
  canRequestAgain,
  fetchLatestAdvertisement,
  isExpired,
  requestAdvertisement,
  type Advertisement,
} from "@/lib/advertising";

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusLine(ad: Advertisement) {
  if (isExpired(ad)) {
    return { label: "Expired", tone: "muted" as const, detail: "Your promotion window has ended." };
  }
  if (ad.status === "pending") {
    return {
      label: "Pending review",
      tone: "gold" as const,
      detail: `Requested ${formatDate(ad.requestedStartDate)} – ${formatDate(ad.requestedEndDate)}. An admin will confirm the dates and cost.`,
    };
  }
  if (ad.status === "active") {
    const end = ad.endDate ?? ad.requestedEndDate;
    return {
      label: `Active until ${formatDate(end)}`,
      tone: "sage" as const,
      detail:
        ad.cost !== null
          ? `Agreed cost: ${formatPrice(ad.cost)}.`
          : "Your store is featured on the customer home page.",
    };
  }
  return {
    label: "Rejected",
    tone: "destructive" as const,
    detail: ad.adminNote || "An admin declined this request. You can submit a new one.",
  };
}

export function AdvertisePanel({ vendorId }: { vendorId: string }) {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tagline, setTagline] = useState("");
  const [adImage, setAdImage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAd(await fetchLatestAdvertisement(vendorId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load advertising status.");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!startDate || !endDate) {
      toast.error("Choose a start and end date.");
      return;
    }
    if (endDate < startDate) {
      toast.error("The end date must be after the start date.");
      return;
    }
    setSaving(true);
    try {
      await requestAdvertisement({ vendorId, startDate, endDate, tagline, imageUrl: adImage });
      toast.success("Advertising request sent — an admin will review it.");
      setShowForm(false);
      setStartDate("");
      setEndDate("");
      setTagline("");
      setAdImage(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your request.");
    } finally {
      setSaving(false);
    }
  }

  const formVisible = !loading && (canRequestAgain(ad) ? showForm || !ad : false);

  return (
    <section className="surface-card space-y-4 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Megaphone className="size-5 text-primary" /> Advertise your store
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Featured stores appear on the customer home page with their real business
            name, logo and tagline.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading advertising status…</p>
      ) : ad && !formVisible ? (
        <div className="space-y-3 rounded-xl bg-secondary/40 p-4">
          {(() => {
            const info = statusLine(ad);
            return (
              <>
                <Badge
                  variant={info.tone === "destructive" ? "destructive" : "outline"}
                  className="capitalize"
                >
                  {info.label}
                </Badge>
                <p className="text-sm text-muted-foreground">{info.detail}</p>
                {ad.tagline && (
                  <p className="text-sm">
                    Tagline: <span className="font-medium">“{ad.tagline}”</span>
                  </p>
                )}
                {ad.imageUrl && (
                  <img
                    src={ad.imageUrl}
                    alt="Advertisement photo"
                    className="h-28 w-48 rounded-xl object-cover"
                  />
                )}
              </>
            );
          })()}
          {canRequestAgain(ad) && (
            <Button type="button" variant="outline" onClick={() => setShowForm(true)}>
              Request a new advertisement
            </Button>
          )}
        </div>
      ) : null}

      {formVisible && (
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ad-start">Desired start date</Label>
            <Input
              id="ad-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ad-end">Desired end date</Label>
            <Input
              id="ad-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ad-tagline">Tagline (optional)</Label>
            <Textarea
              id="ad-tagline"
              rows={2}
              maxLength={120}
              placeholder="Fresh bakes rescued every evening"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ad-photo">Advertisement photo (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Shown on the home page banner instead of your logo.
            </p>
            {adImage && (
              <div className="flex items-end gap-3">
                <img
                  src={adImage}
                  alt="Advertisement preview"
                  className="h-28 w-48 rounded-xl object-cover"
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setAdImage(null)}>
                  Remove
                </Button>
              </div>
            )}
            <Input
              id="ad-photo"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setAdImage(await fileToStoredImage(file, 1600));
                } catch {
                  toast.error("Could not read that image.");
                }
                e.target.value = "";
              }}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Sending…" : "Request to advertise"}
            </Button>
            {ad && (
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

export default AdvertisePanel;
