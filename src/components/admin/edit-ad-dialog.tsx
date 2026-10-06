import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileToStoredImage } from "@/lib/image-upload";
import { updateActiveAdvertisement, type AdminAdvertisement } from "@/lib/advertising";

export function EditAdDialog({
  ad,
  onClose,
  onSaved,
}: {
  ad: AdminAdvertisement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tagline, setTagline] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ad) {
      setTagline(ad.tagline ?? "");
      setImage(ad.imageUrl);
    }
  }, [ad]);

  const save = async () => {
    if (!ad) return;
    setSaving(true);
    try {
      await updateActiveAdvertisement({
        id: ad.id,
        vendorId: ad.vendorId,
        tagline,
        imageUrl: image,
      });
      toast.success(`${ad.vendorName}'s campaign was updated.`);
      onSaved();
      onClose();
    } catch {
      toast.error("Could not update this campaign.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!ad} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit campaign</DialogTitle>
          <DialogDescription>{ad?.vendorName} — changes show on the homepage banner.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-tagline">Tagline</Label>
            <Input
              id="edit-tagline"
              maxLength={120}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-photo">Advertisement photo</Label>
            {image ? (
              <img src={image} alt="Advertisement" className="h-40 w-full rounded-xl object-cover" />
            ) : (
              <p className="text-sm text-muted-foreground">No photo — the business logo is used.</p>
            )}
            <div className="flex gap-2">
              <Input
                id="edit-photo"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setImage(await fileToStoredImage(file, 1600));
                  e.target.value = "";
                }}
              />
              {image ? (
                <Button type="button" variant="outline" onClick={() => setImage(null)}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void save()}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
