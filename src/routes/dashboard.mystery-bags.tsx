import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  bagCategoryLabels,
  categoryImages,
  formatPrice,
  type BagCategory,
  type FulfillmentType,
} from "@/data/mock";
import { useAuth } from "@/lib/auth/auth-context";
import {
  deleteVendorPost,
  emptyVendorPost,
  listVendorPosts,
  saveVendorPost,
  toggleVendorPost,
  type VendorPost,
  type VendorPostInput,
} from "@/lib/vendor-posts";

export const Route = createFileRoute("/dashboard/mystery-bags")({
  component: VendorPostsPage,
});

const FULFILLMENTS: { value: FulfillmentType; label: string }[] = [
  { value: "pickup", label: "Pickup only" },
  { value: "delivery", label: "Delivery only" },
  { value: "both", label: "Pickup & delivery" },
];

function VendorPostsPage() {
  const { user } = useAuth();
  const businessId = user?.vendorId ?? "b1";

  const [posts, setPosts] = useState<VendorPost[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<VendorPostInput>(emptyVendorPost());
  const [pendingDelete, setPendingDelete] = useState<VendorPost | null>(null);

  useEffect(() => {
    setPosts(listVendorPosts(businessId));
  }, [businessId]);

  const liveCount = useMemo(
    () => posts.filter((p) => p.isAvailable && p.quantityLeft > 0).length,
    [posts],
  );

  function openNew() {
    setEditingId(undefined);
    setForm(emptyVendorPost());
    setOpen(true);
  }

  function openEdit(post: VendorPost) {
    const { id, businessId: _b, ...rest } = post;
    setEditingId(id);
    setForm(rest);
    setOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    if (form.discountedPrice <= 0 || form.originalPrice <= 0) {
      toast.error("Prices must be greater than zero.");
      return;
    }
    if (form.discountedPrice >= form.originalPrice) {
      toast.error("Selling price should be below the original value.");
      return;
    }
    setPosts(
      saveVendorPost(
        businessId,
        { ...form, totalQuantity: Math.max(form.totalQuantity, form.quantityLeft) },
        editingId,
      ),
    );
    setOpen(false);
    toast.success(editingId ? "Food post updated" : "Food post created");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Food posts</h2>
          <p className="text-sm text-muted-foreground">
            {posts.length} total · {liveCount} live right now
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 size-4" /> New food post
        </Button>
      </div>

      <div className="surface-card overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Food post</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Qty left</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No food posts yet — create your first one.
                </TableCell>
              </TableRow>
            )}
            {posts.map((post) => (
              <TableRow key={post.id} className={post.isAvailable ? "" : "opacity-60"}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="size-12 rounded-xl object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-40">
                      <p className="font-medium text-foreground">{post.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {post.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{bagCategoryLabels[post.category]}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-semibold text-foreground">
                    {formatPrice(post.discountedPrice)}
                  </span>{" "}
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(post.originalPrice)}
                  </span>
                </TableCell>
                <TableCell>
                  {post.quantityLeft}/{post.totalQuantity}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {post.availableFrom}–{post.availableUntil}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={post.isAvailable}
                    onCheckedChange={(checked) => {
                      setPosts(toggleVendorPost(businessId, post.id, checked));
                      toast.success(checked ? "Post is live" : "Post hidden from customers");
                    }}
                  />
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => openEdit(post)}>
                    <Pencil className="size-4" />
                    <span className="sr-only">Edit {post.title}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2"
                    onClick={() => setPendingDelete(post)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete {post.title}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit food post" : "New food post"}</DialogTitle>
              <DialogDescription>
                Surplus food customers can reserve for pickup or delivery.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      category: value as BagCategory,
                      image:
                        prev.image === categoryImages[prev.category]
                          ? categoryImages[value as BagCategory]
                          : prev.image,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(bagCategoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
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
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original value</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  min={0}
                  step="0.5"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Selling price</Label>
                <Input
                  id="discountedPrice"
                  type="number"
                  min={0}
                  step="0.5"
                  value={form.discountedPrice}
                  onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityLeft">Quantity available</Label>
                <Input
                  id="quantityLeft"
                  type="number"
                  min={0}
                  value={form.quantityLeft}
                  onChange={(e) => setForm({ ...form, quantityLeft: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalQuantity">Batch size</Label>
                <Input
                  id="totalQuantity"
                  type="number"
                  min={0}
                  value={form.totalQuantity}
                  onChange={(e) => setForm({ ...form, totalQuantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available from</Label>
                <Input
                  id="availableFrom"
                  type="time"
                  value={form.availableFrom}
                  onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableUntil">Available until</Label>
                <Input
                  id="availableUntil"
                  type="time"
                  value={form.availableUntil}
                  onChange={(e) => setForm({ ...form, availableUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div className="flex items-center gap-3">
                <img
                  src={form.image}
                  alt=""
                  className="size-16 rounded-xl object-cover"
                />
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setForm((prev) => ({ ...prev, image: URL.createObjectURL(file) }));
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupInstructions">Pickup instructions</Label>
              <Textarea
                id="pickupInstructions"
                rows={2}
                placeholder="Where to collect, what to say, which door…"
                value={form.pickupInstructions}
                onChange={(e) => setForm({ ...form, pickupInstructions: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="font-medium text-foreground">Available to customers</p>
                <p className="text-sm text-muted-foreground">
                  Turn off to hide this post without deleting it.
                </p>
              </div>
              <Switch
                checked={form.isAvailable}
                onCheckedChange={(checked) => setForm({ ...form, isAvailable: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingId ? "Save changes" : "Create post"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => !next && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the food post from the marketplace. Existing orders are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDelete) return;
                setPosts(deleteVendorPost(businessId, pendingDelete.id));
                toast.success("Food post deleted");
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
