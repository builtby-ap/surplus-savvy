import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fileToStoredImage } from "@/lib/image-upload";
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
import { useMyVendor } from "@/lib/use-my-vendor";
import {
  createVendorPost,
  deleteVendorPost,
  emptyVendorPost,
  fetchVendorPosts,
  setVendorPostAvailability,
  updateVendorPost,
  type VendorPost,
  type VendorPostInput,
} from "@/lib/vendor-db";

export const Route = createFileRoute("/dashboard/mystery-bags")({
  component: VendorPostsPage,
});

const FULFILLMENTS: { value: FulfillmentType; label: string }[] = [
  { value: "pickup", label: "Pickup only" },
  { value: "delivery", label: "Delivery only" },
  { value: "both", label: "Pickup & delivery" },
];

function parseNumberInput(raw: string, fallback: number) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (cleaned === "") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}



function VendorPostsPage() {
  const { vendorId, loading: vendorLoading } = useMyVendor();

  const [posts, setPosts] = useState<VendorPost[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<VendorPostInput>(emptyVendorPost());
  const [pendingDelete, setPendingDelete] = useState<VendorPost | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");


  const reload = useCallback(async () => {
    if (!vendorId) return;
    try {
      setPosts(await fetchVendorPosts(vendorId));
    } catch {
      toast.error("Could not load your food posts.");
    }
  }, [vendorId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const liveCount = useMemo(
    () => posts.filter((p) => p.isAvailable && p.quantityLeft > 0).length,
    [posts],
  );

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (q && !`${p.title} ${p.description}`.toLowerCase().includes(q)) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (statusFilter === "live" && !(p.isAvailable && p.quantityLeft > 0)) return false;
      if (statusFilter === "hidden" && p.isAvailable) return false;
      if (statusFilter === "sold-out" && p.quantityLeft > 0) return false;
      return true;
    });
  }, [posts, query, categoryFilter, statusFilter]);


  function openNew() {
    setEditingId(undefined);
    setForm(emptyVendorPost());
    setOpen(true);
  }

  function openEdit(post: VendorPost) {
    const { id, vendorId: _v, ...rest } = post;
    setEditingId(id);
    setForm(rest);
    setOpen(true);
  }

  async function submit(event: React.FormEvent) {
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
    if (!vendorId) {
      toast.error("Set up your store profile before posting food.");
      return;
    }
    const payload = {
      ...form,
      totalQuantity: Math.max(form.totalQuantity, form.quantityLeft),
    };
    try {
      if (editingId) await updateVendorPost(editingId, payload);
      else await createVendorPost(vendorId, payload);
      await reload();
      setOpen(false);
      toast.success(editingId ? "Food post updated" : "Food post created");
    } catch {
      toast.error("Could not save that food post.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Food posts</h2>
          <p className="text-sm text-muted-foreground">
            {posts.length} total · {liveCount} live right now · showing {visiblePosts.length}
          </p>
        </div>
        <Button onClick={openNew} disabled={!vendorId}>
          <Plus className="mr-2 size-4" /> New food post
        </Button>
      </div>

      {!vendorLoading && !vendorId && (
        <p className="surface-card p-6 text-sm text-muted-foreground">
          You don't have a store yet — set one up on the Store profile page first.
        </p>
      )}

      <div className="surface-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search food posts by title or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(bagCategoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="sold-out">Sold out</SelectItem>
          </SelectContent>
        </Select>
        {(query || categoryFilter !== "all" || statusFilter !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear
          </Button>
        )}
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
            {visiblePosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {posts.length === 0
                    ? "No food posts yet — create your first one."
                    : "No food posts match your search or filters."}
                </TableCell>
              </TableRow>
            )}
            {visiblePosts.map((post) => (

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
                      void setVendorPostAvailability(post.id, checked)
                        .then(reload)
                        .then(() =>
                          toast.success(
                            checked ? "Post is live" : "Post hidden from customers",
                          ),
                        )
                        .catch(() => toast.error("Could not update that post."));
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
                <Label htmlFor="originalPrice">Original value (MMK)</Label>
                <Input
                  id="originalPrice"
                  type="text"
                  inputMode="decimal"
                  value={form.originalPrice === 0 ? "" : form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: parseNumberInput(e.target.value, form.originalPrice) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Selling price (MMK)</Label>
                <Input
                  id="discountedPrice"
                  type="text"
                  inputMode="decimal"
                  value={form.discountedPrice === 0 ? "" : form.discountedPrice}
                  onChange={(e) => setForm({ ...form, discountedPrice: parseNumberInput(e.target.value, form.discountedPrice) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityLeft">Quantity available</Label>
                <Input
                  id="quantityLeft"
                  type="text"
                  inputMode="numeric"
                  value={form.quantityLeft === 0 ? "" : form.quantityLeft}
                  onChange={(e) => setForm({ ...form, quantityLeft: parseNumberInput(e.target.value, form.quantityLeft) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalQuantity">Batch size</Label>
                <Input
                  id="totalQuantity"
                  type="text"
                  inputMode="numeric"
                  value={form.totalQuantity === 0 ? "" : form.totalQuantity}
                  onChange={(e) => setForm({ ...form, totalQuantity: parseNumberInput(e.target.value, form.totalQuantity) })}
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
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const stored = await fileToStoredImage(file);
                    setForm((prev) => ({ ...prev, image: stored }));
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
                void deleteVendorPost(pendingDelete.id)
                  .then(reload)
                  .then(() => toast.success("Food post deleted"))
                  .catch(() => toast.error("Could not delete that post."));
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
