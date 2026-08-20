import { useEffect, useRef, useState } from "react";
import { Clock, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  resubmitPayment,
  signedScreenshotUrl,
  uploadPaymentScreenshot,
  type PaymentStatus,
} from "@/lib/payments";
import { useAuth } from "@/lib/auth/auth-context";

/** Preview of a private screenshot stored in the payment-screenshots bucket. */
export function ScreenshotPreview({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    signedScreenshotUrl(path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [path]);
  if (!url) return null;
  return (
    <img
      src={url}
      alt="Payment screenshot"
      className="mt-3 max-h-64 rounded-2xl border border-border object-contain"
    />
  );
}

/**
 * Payment state block shown on order history / order detail while a pickup
 * order's transfer is still being verified or was rejected.
 */
export function PaymentReviewPanel({
  status,
  orderId,
  screenshotPath,
}: {
  status: PaymentStatus;
  orderId: string;
  screenshotPath: string | null;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "awaiting_verification") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
        <Clock className="mt-0.5 size-5 text-accent-foreground" />
        <div>
          <p className="font-medium">Payment under review</p>
          <p className="text-sm text-muted-foreground">
            The vendor will start preparing once your payment is verified.
          </p>
          <ScreenshotPreview path={screenshotPath} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 text-destructive" />
        <div className="flex-1">
          <p className="font-medium text-destructive">
            Payment rejected — please upload a new screenshot
          </p>
          <p className="text-sm text-muted-foreground">
            Re-send the payment if needed, then upload a clear screenshot of the completed transfer.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file || !user) return;
              setBusy(true);
              try {
                const path = await uploadPaymentScreenshot(file, user.id);
                await resubmitPayment(orderId, path);
                toast.success("Screenshot submitted — payment is under review.");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mt-3 rounded-full"
          >
            <Upload className="mr-2 size-4" />
            {busy ? "Uploading…" : "Upload new screenshot"}
          </Button>
        </div>
      </div>
    </div>
  );
}
