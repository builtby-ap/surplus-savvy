/**
 * Rescue Points: read-only customer views of the points ledger and rewards.
 * Points are only written by database triggers (orders/reviews) and the
 * `redeem_reward` function, never directly from the browser.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PointTxn {
  id: string;
  points: number;
  kind: string;
  reason: string;
  createdAt: string;
}
export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountMmk: number;
}
export interface Redemption {
  id: string;
  rewardTitle: string;
  pointsSpent: number;
  code: string;
  status: string;
  createdAt: string;
}
export interface PointsRules {
  points_per_1000_mmk: number;
  first_order_bonus: number;
  review_points: number;
  bags_5_bonus: number;
  bags_10_bonus: number;
}

export interface PointsData {
  balance: number;
  earned: number;
  redeemed: number;
  txns: PointTxn[];
  rewards: Reward[];
  redemptions: Redemption[];
}

// Tables are newer than the generated types; keep the client loosely typed here.
const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a: object) => any };

export async function fetchPoints(userId: string): Promise<PointsData> {
  const [t, r, d] = await Promise.all([
    db.from("point_transactions").select("id, points, kind, reason, created_at").eq("customer_id", userId).order("created_at", { ascending: false }),
    db.from("rewards").select("id, title, description, points_cost, discount_mmk").eq("is_active", true).order("points_cost"),
    db.from("reward_redemptions").select("id, reward_title, points_spent, code, status, created_at").eq("customer_id", userId).order("created_at", { ascending: false }),
  ]);
  const txns: PointTxn[] = (t.data ?? []).map((x: any) => ({ id: x.id, points: x.points, kind: x.kind, reason: x.reason, createdAt: x.created_at }));
  const balance = txns.reduce((n, x) => n + x.points, 0);
  const redeemed = -txns.filter((x) => x.kind === "redeem").reduce((n, x) => n + x.points, 0);
  return {
    balance,
    redeemed,
    earned: balance + redeemed,
    txns,
    rewards: (r.data ?? []).map((x: any) => ({ id: x.id, title: x.title, description: x.description, pointsCost: x.points_cost, discountMmk: Number(x.discount_mmk) })),
    redemptions: (d.data ?? []).map((x: any) => ({ id: x.id, rewardTitle: x.reward_title, pointsSpent: x.points_spent, code: x.code, status: x.status, createdAt: x.created_at })),
  };
}

/** Live points for the signed-in customer (refreshes on new transactions). */
export function usePoints(userId: string | undefined) {
  const [data, setData] = useState<PointsData | undefined>(undefined);
  const reload = useCallback(() => {
    if (!userId) return;
    fetchPoints(userId).then(setData).catch(() => setData({ balance: 0, earned: 0, redeemed: 0, txns: [], rewards: [], redemptions: [] }));
  }, [userId]);
  useEffect(() => {
    if (!userId) return;
    reload();
    const channel = supabase
      .channel(`points-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "point_transactions", filter: `customer_id=eq.${userId}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, reload]);
  return { data, reload };
}

export async function redeemReward(rewardId: string): Promise<string> {
  const { data, error } = await db.rpc("redeem_reward", { _reward_id: rewardId });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function fetchPointsRules(): Promise<PointsRules | null> {
  const { data } = await db.from("points_settings").select("points_per_1000_mmk, first_order_bonus, review_points, bags_5_bonus, bags_10_bonus").maybeSingle();
  return data ?? null;
}

export async function savePointsRules(rules: PointsRules) {
  const { error } = await db.from("points_settings").update(rules).eq("id", true);
  if (error) throw new Error(error.message);
}

export function relativeDay(iso: string) {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 864e5);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
