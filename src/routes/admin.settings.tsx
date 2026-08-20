import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QrCode, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fileToStoredImage } from "@/lib/image-upload";
import { fetchPaymentSettings } from "@/lib/payments";
import { savePaymentSettings } from "@/lib/payment-admin";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Platform settings — Surplus Rescue admin" },
      {
        name: "description",
        content: "Manage the platform MMQR payment code and account details customers pay to.",
      },
      { property: "og:title", content: "Platform settings — Surplus Rescue admin" },
      {
        property: "og:description",
        content: "Update the MMQR QR image, account name and payment instructions.",
      },
    ],
  }),
  component: PlatformSettingsPage,
});

function PlatformSettingsPage() {
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [accountName, setAccountName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetchPaymentSettings().then((s) => {
      if (!alive || !s) return;
      setQrImageUrl(s.qrImageUrl);
      setAccountName(s.accountName);
      setInstructions(s.instructions);
    });
    return () => {
      alive = false;
    };
  }, []);

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setQrImageUrl(await fileToStoredImage(file, 800, 0.9));
    } catch {
      toast.error("Could not read that image.");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await savePaymentSettings({ qrImageUrl, accountName, instructions });
      toast.success("Payment settings saved.");
    } catch {
      toast.error("Could not save payment settings — admin access required.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <QrCode className="h-5 w-5 text-primary" /> Payment settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers paying for pickup orders scan this MMQR code and upload their transfer
          screenshot for verification.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,260px)_1fr]">
          <div className="space-y-3">
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="Platform MMQR code"
                className="w-full rounded-2xl border border-border bg-background object-contain p-3"
              />
            ) : (
              <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                No QR image yet
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void pickFile(e.target.files?.[0])}
            />
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Upload QR image
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account name</Label>
              <Input
                id="account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Surplus Rescue Co., Ltd."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-url">QR image URL</Label>
              <Input
                id="qr-url"
                value={qrImageUrl}
                onChange={(e) => setQrImageUrl(e.target.value)}
                placeholder="https://… or upload an image"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Payment instructions</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Scan with any MMQR-supporting banking app, then upload your screenshot."
              />
            </div>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save payment settings"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
