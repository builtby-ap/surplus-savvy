import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchPointsRules, savePointsRules, type PointsRules } from "@/lib/points";

const FIELDS: [keyof PointsRules, string][] = [
  ["points_per_1000_mmk", "Points per 1,000 MMK spent"],
  ["first_order_bonus", "First completed order bonus"],
  ["review_points", "Points per review"],
  ["bags_5_bonus", "Bonus at 5 bags rescued"],
  ["bags_10_bonus", "Bonus at 10 bags rescued"],
];

export function PointsRulesPanel() {
  const [rules, setRules] = useState<PointsRules | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetchPointsRules().then(setRules); }, []);
  if (!rules) return null;
  const save = async () => {
    setSaving(true);
    try { await savePointsRules(rules); toast.success("Points rules saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save"); }
    finally { setSaving(false); }
  };
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">⭐ Points rules</h2>
      <p className="mt-1 text-sm text-muted-foreground">Changes apply to orders completed and reviews posted from now on.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {FIELDS.map(([k, label]) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={k}>{label}</Label>
            <Input id={k} inputMode="numeric" value={String(rules[k])}
              onChange={(e) => setRules({ ...rules, [k]: Math.max(0, parseInt(e.target.value.replace(/\D/g, "") || "0", 10)) })} />
          </div>
        ))}
      </div>
      <Button className="mt-4" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save rules"}</Button>
    </section>
  );
}
