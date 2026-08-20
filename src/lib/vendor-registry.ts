/**
 * Mock vendor registry for admin verification.
 *
 * Seeds from the mock businesses plus any vendor applications submitted
 * through the mock auth service, and persists admin decisions locally.
 */
import { businesses, businessTypeLabels, type BusinessType } from "@/data/mock";
import { AUTH_KEYS } from "@/lib/auth/auth-service";
import type { VendorApplication } from "@/lib/auth/types";

export type VendorStatus = "pending" | "approved" | "rejected" | "deactivated";

export interface VendorRecord {
  id: string;
  name: string;
  type: string;
  address: string;
  email: string;
  phone: string;
  status: VendorStatus;
  submittedAt: string;
  rejectionReason?: string;
  /** Present when the vendor maps to a marketplace business. */
  businessId?: string;
  documents?: { businessLicense: string; fdaApproval: string };
}

const KEY = "surplusRescue_vendor_registry";
const isBrowser = () => typeof window !== "undefined";

export const vendorStatusLabels: Record<VendorStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  deactivated: "Deactivated",
};

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function seedFromBusinesses(): VendorRecord[] {
  const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
  return businesses.map((b, index) => ({
    id: b.id,
    businessId: b.id,
    name: b.name,
    type: businessTypeLabels[b.type as BusinessType] ?? b.type,
    address: `${b.address}, ${b.neighborhood}`,
    email: `hello@${slug(b.name)}.example`,
    phone: `+44 20 7${String(1000 + index * 137).slice(0, 3)} ${String(4000 + index * 91).slice(0, 4)}`,
    // Two newest partners are still waiting on verification.
    status: index >= businesses.length - 2 ? "pending" : "approved",
    submittedAt: daysAgo(index >= businesses.length - 2 ? index - 6 : 40 - index),
    documents: { businessLicense: "business-license.pdf", fdaApproval: "fda-approval.pdf" },
  }));
}

function fromApplication(app: VendorApplication): VendorRecord {
  return {
    id: app.id,
    name: app.cafeName,
    type: app.category,
    address: app.address,
    email: app.email,
    phone: app.phone,
    status: app.verificationStatus === "approved" ? "approved" : app.verificationStatus,
    submittedAt: app.submittedAt,
    ...(app.rejectionReason ? { rejectionReason: app.rejectionReason } : {}),
    documents: {
      businessLicense: app.businessLicense.fileName,
      fdaApproval: app.fdaApproval.fileName,
    },
  };
}

function readAccountApplications(): VendorRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(AUTH_KEYS.accounts);
    const accounts = raw
      ? (JSON.parse(raw) as Array<{ vendorApplication?: VendorApplication }>)
      : [];
    return accounts
      .map((a) => a.vendorApplication)
      .filter((a): a is VendorApplication => Boolean(a))
      .map(fromApplication);
  } catch {
    return [];
  }
}

function persist(list: VendorRecord[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function listVendors(): VendorRecord[] {
  if (!isBrowser()) return seedFromBusinesses();
  let stored: VendorRecord[] = [];
  try {
    const raw = window.localStorage.getItem(KEY);
    stored = raw ? (JSON.parse(raw) as VendorRecord[]) : [];
  } catch {
    stored = [];
  }
  if (stored.length === 0) stored = seedFromBusinesses();

  // Merge in any applications submitted since the last read.
  const byId = new Map(stored.map((v) => [v.id, v]));
  for (const app of readAccountApplications()) {
    if (!byId.has(app.id)) byId.set(app.id, app);
  }
  const merged = [...byId.values()].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
  persist(merged);
  return merged;
}

/** Keeps the vendor's own application-status view in sync with admin decisions. */
function syncVendorApplication(vendorId: string, status: VendorStatus, reason?: string) {
  if (!isBrowser()) return;
  const verification =
    status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
  try {
    const raw = window.localStorage.getItem(AUTH_KEYS.accounts);
    if (raw) {
      const accounts = JSON.parse(raw) as Array<{ vendorApplication?: VendorApplication }>;
      let changed = false;
      for (const account of accounts) {
        if (account.vendorApplication?.id === vendorId) {
          account.vendorApplication.verificationStatus = verification;
          if (reason) account.vendorApplication.rejectionReason = reason;
          changed = true;
        }
      }
      if (changed) window.localStorage.setItem(AUTH_KEYS.accounts, JSON.stringify(accounts));
    }
    const activeRaw = window.localStorage.getItem(AUTH_KEYS.vendorApplication);
    if (activeRaw) {
      const active = JSON.parse(activeRaw) as VendorApplication;
      if (active.id === vendorId) {
        active.verificationStatus = verification;
        if (reason) active.rejectionReason = reason;
        window.localStorage.setItem(AUTH_KEYS.vendorApplication, JSON.stringify(active));
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
}

export function setVendorStatus(
  vendorId: string,
  status: VendorStatus,
  rejectionReason?: string,
): VendorRecord[] {
  const next = listVendors().map((v) =>
    v.id === vendorId
      ? {
          ...v,
          status,
          ...(status === "rejected" && rejectionReason ? { rejectionReason } : {}),
        }
      : v,
  );
  persist(next);
  syncVendorApplication(vendorId, status, rejectionReason);
  return next;
}

/** Only approved vendors' food posts are visible on the public marketplace. */
export function visibleVendorIds(): Set<string> {
  return new Set(
    listVendors()
      .filter((v) => v.status === "approved")
      .map((v) => v.businessId ?? v.id),
  );
}
