import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stars } from "@/components/reviews/star-rating";
import { fetchAllReviews, setReviewStatus, type Review, type ReviewStatus } from "@/lib/reviews";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Review moderation — Phoe La Min Admin" },
      { name: "description", content: "Moderate customer reviews, handle reports and hide inappropriate content." },
      { property: "og:title", content: "Review moderation — Phoe La Min Admin" },
      { property: "og:description", content: "Moderate customer reviews and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminReviews,
});

const tabs: (ReviewStatus | "all")[] = ["all", "reported", "published", "hidden", "removed"];

function AdminReviews() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [tab, setTab] = useState<ReviewStatus | "all">("all");
  const [q, setQ] = useState("");
  const [vendor, setVendor] = useState("all");
  const [rating, setRating] = useState("all");
  const [viewer, setViewer] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchAllReviews().then(setReviews).catch((e) => { toast.error(e.message); setReviews([]); });
  }, []);
  useEffect(load, [load]);

  const vendors = useMemo(() => Array.from(new Set((reviews ?? []).map((r) => r.vendorName ?? "Unknown"))).sort(), [reviews]);
  const list = useMemo(() => (reviews ?? []).filter((r) =>
    (tab === "all" || r.status === tab) &&
    (vendor === "all" || (r.vendorName ?? "Unknown") === vendor) &&
    (rating === "all" || r.overall === Number(rating)) &&
    (!q || `${r.text} ${r.reviewerName} ${r.vendorName}`.toLowerCase().includes(q.toLowerCase())),
  ), [reviews, tab, vendor, rating, q]);

  async function act(r: Review, status: ReviewStatus) {
    try { await setReviewStatus(r.id, status); toast.success("Review updated"); load(); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Reviews</h2>
        <p className="text-sm text-muted-foreground">Moderate customer reviews. Hidden and removed reviews no longer count toward ratings.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-full border px-3 py-1 text-sm capitalize", tab === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
            {t} {t !== "all" && reviews && <span className="opacity-70">({reviews.filter((r) => r.status === t).length})</span>}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px_140px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews" className="pl-9" /></div>
        <Select value={vendor} onValueChange={setVendor}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All businesses</SelectItem>{vendors.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
        <Select value={rating} onValueChange={setRating}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All ratings</SelectItem>{[5, 4, 3, 2, 1].map((s) => <SelectItem key={s} value={String(s)}>{s} stars</SelectItem>)}</SelectContent></Select>
      </div>
      {reviews === null ? <p className="text-sm text-muted-foreground">Loading reviews…</p> : list.length === 0 ? <p className="text-sm text-muted-foreground">No reviews found.</p> : (
        <ul className="space-y-3">
          {list.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{r.vendorName ?? "Unknown business"}</p>
                <Badge variant={r.status === "published" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge>
                <span className="ml-auto text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Stars value={r.overall} /> by {r.reviewerName}{r.bagTitle && ` · ${r.bagTitle}`}</div>
              {r.text && <p className="mt-2 text-sm">“{r.text}”</p>}
              {r.photos.length > 0 && <div className="mt-2 flex gap-2">{r.photos.map((p, i) => <button key={i} type="button" onClick={() => setViewer(viewer === p ? null : p)}><img src={p} alt="" className="size-16 rounded-md object-cover" /></button>)}</div>}
              {r.reports.length > 0 && (
                <div className="mt-3 rounded-lg bg-secondary p-3 text-xs">
                  <p className="font-semibold">{r.reports.length} report{r.reports.length > 1 ? "s" : ""}</p>
                  {r.reports.map((x, i) => <p key={i} className="mt-1">• {x.reason}{x.description && ` — ${x.description}`}</p>)}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status !== "published" && <Button size="sm" variant="outline" onClick={() => act(r, "published")}>Restore</Button>}
                {r.status !== "hidden" && r.status !== "removed" && <Button size="sm" variant="outline" onClick={() => act(r, "hidden")}>Hide</Button>}
                {r.status !== "removed" && <Button size="sm" variant="destructive" onClick={() => act(r, "removed")}>Remove</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {viewer && <button type="button" onClick={() => setViewer(null)} className="fixed inset-0 z-50 grid place-items-center bg-foreground/70 p-6"><img src={viewer} alt="Review photo" className="max-h-full rounded-lg" /></button>}
    </div>
  );
}
