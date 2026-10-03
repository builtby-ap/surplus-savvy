import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, ImagePlus, MoreHorizontal, PenLine, ThumbsUp, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import {
  fetchEligibleOrders,
  fetchVendorReviews,
  reportReview,
  submitReview,
  summarize,
  toggleHelpful,
  type EligibleOrder,
  type Review,
} from "@/lib/reviews";
import { Stars, StarInput } from "./star-rating";

type Sort = "recent" | "high" | "low" | "photos";

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "Today";
  if (d < 2) return "Yesterday";
  if (d < 30) return `${Math.floor(d)} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function useVendorReviews(vendorId: string | undefined) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const reload = useCallback(() => {
    if (!vendorId) return;
    fetchVendorReviews(vendorId).then(setReviews).catch(() => setReviews([]));
  }, [vendorId]);
  useEffect(reload, [reload]);
  return { reviews, reload };
}

export function BusinessReviews({ vendorId, reviews, reload }: { vendorId: string; reviews: Review[] | null; reload: () => void }) {
  const { user } = useAuth();
  const [sort, setSort] = useState<Sort>("recent");
  const [stars, setStars] = useState(0);
  const [orders, setOrders] = useState<EligibleOrder[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const [reporting, setReporting] = useState<Review | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    if (!user || user.role !== "customer") { setOrders([]); return; }
    fetchEligibleOrders(vendorId, user.id).then(setOrders).catch(() => setOrders([]));
  }, [user, vendorId]);
  useEffect(loadOrders, [loadOrders]);

  const summary = useMemo(() => summarize(reviews ?? []), [reviews]);
  const list = useMemo(() => {
    let l = [...(reviews ?? [])];
    if (stars) l = l.filter((r) => r.overall === stars);
    if (sort === "photos") l = l.filter((r) => r.photos.length);
    if (sort === "high") l.sort((a, b) => b.overall - a.overall);
    if (sort === "low") l.sort((a, b) => a.overall - b.overall);
    return l;
  }, [reviews, sort, stars]);

  const open = orders?.filter((o) => !o.reviewed) ?? [];

  function onWrite() {
    setNotice(null);
    if (!user) return;
    if (!orders?.length) { setNotice("You can review this business after completing an order."); return; }
    if (!open.length) { setNotice("You already reviewed this order."); return; }
    setFormOpen(true);
  }

  async function onHelpful(r: Review) {
    if (!user) { toast("Sign in to mark reviews as helpful."); return; }
    if (r.customerId === user.id) return;
    try {
      await toggleHelpful(r.id, user.id, !r.helpfulBy.includes(user.id));
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const writeButton = user ? (
    <Button onClick={onWrite} className="rounded-full"><PenLine className="size-4" /> Write a Review</Button>
  ) : (
    <Button asChild variant="outline" className="rounded-full"><Link to="/login">Sign in to write a review</Link></Button>
  );

  return (
    <section className="border-t border-border py-10" aria-labelledby="reviews-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-success">From fellow food rescuers</p>
          <h2 id="reviews-title" className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Customer Reviews</h2>
        </div>
        {writeButton}
      </div>
      {notice && <p role="status" className="mb-6 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">{notice}</p>}

      {reviews === null ? (
        <p className="py-6 text-sm text-muted-foreground">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Stars value={0} size="size-6" />
          <h3 className="mt-3 text-lg font-semibold text-foreground">Be the first to share your experience!</h3>
          <p className="mt-1 text-sm text-muted-foreground">Your review can help other food rescuers discover this business.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border border-border bg-card p-6">
            <p className="text-5xl font-bold text-foreground">{summary.average.toFixed(1)}</p>
            <Stars value={summary.average} size="size-5" />
            <p className="mt-1 text-sm text-muted-foreground">{summary.count} review{summary.count === 1 ? "" : "s"}</p>
            <div className="mt-5 space-y-2">
              {[5, 4, 3, 2, 1].map((s) => {
                const pct = summary.count ? Math.round(((summary.counts[s - 1] ?? 0) / summary.count) * 100) : 0;
                return (
                  <button key={s} type="button" onClick={() => setStars(stars === s ? 0 : s)} className="flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                    <span className="w-6 text-left">{s} ★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} /></span>
                    <span className="w-9 text-right">{pct}%</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {[0, 5, 4, 3, 2, 1].map((s) => (
                <button key={s} type="button" onClick={() => setStars(s)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", stars === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
                  {s ? `★ ${s}` : "All Reviews"}
                </button>
              ))}
              <div className="ml-auto w-44">
                <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <SelectTrigger className="h-9 rounded-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="high">Highest Rating</SelectItem>
                    <SelectItem value="low">Lowest Rating</SelectItem>
                    <SelectItem value="photos">With Photos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {list.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No reviews match this filter.</p>
            ) : (
              <ul className="space-y-4">
                {list.map((r) => {
                  const liked = !!user && r.helpfulBy.includes(user.id);
                  return (
                    <li key={r.id} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary"><User className="size-5" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{r.reviewerName}</p>
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success"><BadgeCheck className="size-3" /> Verified Rescue</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Stars value={r.overall} /> <span className="font-medium text-foreground">{r.overall.toFixed(1)}</span> · {timeAgo(r.createdAt)}
                            {r.bagTitle && <> · {r.bagTitle}</>}
                          </div>
                        </div>
                        {user && user.id !== r.customerId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><button type="button" aria-label="Review options" className="rounded p-1 text-muted-foreground hover:text-foreground"><MoreHorizontal className="size-4" /></button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setReporting(r)}>Report Review</DropdownMenuItem></DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {(r.foodQuality || r.value || r.portion) && (
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {r.foodQuality ? <span>Food quality {r.foodQuality}/5</span> : null}
                          {r.value ? <span>Value {r.value}/5</span> : null}
                          {r.portion ? <span>Portion {r.portion}/5</span> : null}
                        </div>
                      )}
                      {r.text && <p className="mt-3 text-sm leading-relaxed text-foreground">“{r.text}”</p>}
                      {r.photos.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {r.photos.map((p, i) => (
                            <button key={i} type="button" onClick={() => setViewer(p)} className="overflow-hidden rounded-lg border border-border">
                              <img src={p} alt={`Food photo ${i + 1} from ${r.reviewerName}`} className="size-20 object-cover" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      )}
                      <button type="button" onClick={() => onHelpful(r)} className={cn("mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", liked ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground hover:text-foreground")}>
                        <ThumbsUp className="size-3.5" /> Helpful {r.helpfulBy.length > 0 && <span>· {r.helpfulBy.length}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Review photo</DialogTitle>
          {viewer && <img src={viewer} alt="Review food photo" className="max-h-[80vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>

      {formOpen && (
        <ReviewForm
          vendorId={vendorId}
          orders={open}
          onClose={() => setFormOpen(false)}
          onDone={() => { setFormOpen(false); reload(); loadOrders(); }}
        />
      )}
      {reporting && user && <ReportDialog review={reporting} userId={user.id} onClose={() => { setReporting(null); reload(); }} />}
    </section>
  );
}

function ReviewForm({ vendorId, orders, onClose, onDone }: { vendorId: string; orders: EligibleOrder[]; onClose: () => void; onDone: () => void }) {
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const [overall, setOverall] = useState(0);
  const [food, setFood] = useState(0);
  const [value, setValue] = useState(0);
  const [portion, setPortion] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!overall) { toast.error("Please give an overall rating."); return; }
    setSaving(true);
    try {
      await submitReview({ vendorId, orderId, overall, foodQuality: food || null, value: value || null, portion: portion || null, text, photos });
      toast.success("Thanks for sharing your experience! 🍃");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Food Rescue Experience 🍃</DialogTitle>
          <DialogDescription>Your review helps other food rescuers discover great deals! 🍃</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {orders.length > 1 && (
            <div>
              <p className="mb-1 text-sm font-medium">Order</p>
              <Select value={orderId} onValueChange={setOrderId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{orders.map((o) => <SelectItem key={o.id} value={o.id}>{o.receiptNumber} · {new Date(o.placedAt).toLocaleDateString()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2 rounded-xl border border-border p-4">
            <StarInput label="Overall Rating *" value={overall} onChange={setOverall} />
            <StarInput label="Food Quality" value={food} onChange={setFood} />
            <StarInput label="Value for Money" value={value} onChange={setValue} />
            <StarInput label="Portion" value={portion} onChange={setPortion} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Your Review</p>
            <Textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 1000))} rows={4} placeholder="Tell other food rescuers about your experience…" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Add Food Photos <span className="text-muted-foreground">(up to 3)</span></p>
            <div className="flex flex-wrap gap-2">
              {photos.map((f, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(f)} alt="" className="size-20 rounded-lg object-cover" />
                  <button type="button" aria-label="Remove photo" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 rounded-full bg-card p-1 shadow"><X className="size-3" /></button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="grid size-20 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground">
                  <ImagePlus className="size-5" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files ?? [])].slice(0, 3))} />
                </label>
              )}
            </div>
          </div>
          <Button onClick={submit} disabled={saving} className="w-full rounded-full">{saving ? "Submitting…" : "Submit Review"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const REASONS = ["Inappropriate", "Spam", "Misleading", "Offensive"];

function ReportDialog({ review, userId, onClose }: { review: Review; userId: string; onClose: () => void }) {
  const [reason, setReason] = useState<string>("Inappropriate");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit() {
    setSaving(true);
    try {
      await reportReview(review.id, userId, reason, desc);
      toast.success("Thanks — our team will review this.");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Report Review</DialogTitle><DialogDescription>Tell us what's wrong with this review.</DialogDescription></DialogHeader>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)} className={cn("rounded-full border px-3 py-1 text-sm", reason === r ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{r}</button>
          ))}
        </div>
        <Textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 500))} placeholder="Optional details" rows={3} />
        <Button onClick={submit} disabled={saving} className="rounded-full">Submit report</Button>
      </DialogContent>
    </Dialog>
  );
}
