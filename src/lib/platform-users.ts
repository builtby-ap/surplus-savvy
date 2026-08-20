/**
 * Mock user directory for the admin dashboard.
 *
 * Blends locally registered accounts (localStorage, created through the mock
 * auth service) with a deterministic seeded install base so the admin table
 * looks realistic. Suspend / activate decisions persist locally.
 */
import { AUTH_KEYS } from "@/lib/auth/auth-service";
import type { AuthUser, UserRole } from "@/lib/auth/types";
import { listPlacedOrders } from "@/lib/orders";

export type UserStatus = "active" | "suspended";

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  provider: "password" | "google";
  status: UserStatus;
  joinedAt: string;
  orders: number;
  spent: number;
  /** Seeded users are mock rows, not real local accounts. */
  seeded: boolean;
}

const STATUS_KEY = "surplus-rescue:user-status";

const isBrowser = () => typeof window !== "undefined";

function readStatuses(): Record<string, UserStatus> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, UserStatus>) : {};
  } catch {
    return {};
  }
}

function writeStatuses(map: Record<string, UserStatus>) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STATUS_KEY, JSON.stringify(map));
}

const SEEDED: Array<Omit<PlatformUser, "status" | "seeded">> = [
  { id: "u-1001", fullName: "Thiri Aung", email: "thiri.aung@example.com", phone: "09770001122", role: "customer", provider: "password", joinedAt: "2026-02-11T09:12:00.000Z", orders: 14, spent: 61200 },
  { id: "u-1002", fullName: "Kyaw Zin Htet", email: "kyawzin@example.com", phone: "09770003344", role: "customer", provider: "google", joinedAt: "2026-03-04T14:41:00.000Z", orders: 9, spent: 38400 },
  { id: "u-1003", fullName: "Nway Nway Oo", email: "nway.oo@example.com", phone: "09770005566", role: "customer", provider: "password", joinedAt: "2026-03-22T08:05:00.000Z", orders: 21, spent: 92750 },
  { id: "u-1004", fullName: "Min Thu", email: "min.thu@example.com", phone: "09770007788", role: "customer", provider: "google", joinedAt: "2026-04-09T17:30:00.000Z", orders: 3, spent: 11900 },
  { id: "u-1005", fullName: "Su Myat Noe", email: "sumyat@example.com", phone: "09770009900", role: "customer", provider: "password", joinedAt: "2026-05-02T11:20:00.000Z", orders: 17, spent: 74300 },
  { id: "u-1006", fullName: "Golden Duck Bakery", email: "hello@goldenduck.mm", phone: "09771112233", role: "vendor", provider: "password", joinedAt: "2026-01-19T07:45:00.000Z", orders: 132, spent: 0 },
  { id: "u-1007", fullName: "Yadanar Grocery", email: "team@yadanargrocery.mm", phone: "09771114455", role: "vendor", provider: "password", joinedAt: "2026-02-27T12:15:00.000Z", orders: 88, spent: 0 },
  { id: "u-1008", fullName: "Zaw Lin", email: "zaw.lin@example.com", phone: "09770001133", role: "customer", provider: "password", joinedAt: "2026-06-14T19:02:00.000Z", orders: 1, spent: 4200 },
  { id: "u-1009", fullName: "Ei Thandar", email: "ei.thandar@example.com", role: "customer", provider: "google", joinedAt: "2026-07-01T06:48:00.000Z", orders: 6, spent: 25100 },
  { id: "u-1010", fullName: "Platform Administrator", email: "ops@phoelamin.com", role: "admin", provider: "password", joinedAt: "2025-12-01T05:00:00.000Z", orders: 0, spent: 0 },
];

interface StoredAccount {
  user: AuthUser;
  vendorApplication?: { submittedAt?: string };
}

function localAccounts(): PlatformUser[] {
  if (!isBrowser()) return [];
  let accounts: StoredAccount[] = [];
  try {
    const raw = window.localStorage.getItem(AUTH_KEYS.accounts);
    accounts = raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
  const orders = listPlacedOrders();
  return accounts
    .filter((a) => a?.user?.email)
    .map((a) => ({
      id: a.user.id,
      fullName: a.user.fullName,
      email: a.user.email,
      ...(a.user.phone ? { phone: a.user.phone } : {}),
      role: a.user.role,
      provider: a.user.provider,
      status: "active" as UserStatus,
      joinedAt: a.vendorApplication?.submittedAt ?? new Date().toISOString(),
      orders: a.user.role === "customer" ? orders.length : 0,
      spent:
        a.user.role === "customer"
          ? orders.reduce((sum, order) => sum + order.total, 0)
          : 0,
      seeded: false,
    }));
}

export function listUsers(): PlatformUser[] {
  const statuses = readStatuses();
  const local = localAccounts();
  const seen = new Set(local.map((u) => u.email.toLowerCase()));
  const seeded = SEEDED.filter((u) => !seen.has(u.email.toLowerCase())).map((u) => ({
    ...u,
    status: "active" as UserStatus,
    seeded: true,
  }));
  return [...local, ...seeded]
    .map((u) => ({ ...u, status: statuses[u.id] ?? u.status }))
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
}

export function setUserStatus(id: string, status: UserStatus): PlatformUser[] {
  const statuses = readStatuses();
  statuses[id] = status;
  writeStatuses(statuses);
  return listUsers();
}

export const roleLabels: Record<UserRole, string> = {
  customer: "Customer",
  vendor: "Vendor",
  admin: "Admin",
};
