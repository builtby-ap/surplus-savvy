/**
 * Mock authentication service.
 *
 * This is the ONLY place that knows how auth is implemented. Swapping in
 * Supabase Auth later means re-implementing these functions — the React
 * provider, hook and UI stay unchanged.
 */
import type {
  AuthSession,
  AuthUser,
  CustomerRegistrationInput,
  VendorApplication,
  VendorRegistrationInput,
} from "./types";

export const AUTH_KEYS = {
  auth: "phoeLaMin_auth",
  user: "phoeLaMin_user",
  vendorApplication: "phoeLaMin_vendor_application",
  accounts: "phoeLaMin_accounts",
} as const;

interface StoredAccount {
  user: AuthUser;
  /** Hashed — plaintext passwords are never persisted. */
  passwordHash: string | null;
  vendorApplication?: VendorApplication;
}

const isBrowser = () => typeof window !== "undefined";

/** SHA-256 hex digest, with a non-reversible fallback for old browsers. */
export async function hashPassword(password: string): Promise<string> {
  if (isBrowser() && window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(`phoe-la-min::${password}`);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h = 0;
  for (let i = 0; i < password.length; i += 1) h = (h * 31 + password.charCodeAt(i)) | 0;
  return `fallback-${(h >>> 0).toString(16)}`;
}

function read<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readAccounts(): StoredAccount[] {
  return read<StoredAccount[]>(AUTH_KEYS.accounts) ?? [];
}

function writeAccounts(accounts: StoredAccount[]) {
  write(AUTH_KEYS.accounts, accounts);
}

function upsertAccount(account: StoredAccount) {
  const accounts = readAccounts().filter(
    (a) => a.user.email.toLowerCase() !== account.user.email.toLowerCase(),
  );
  accounts.push(account);
  writeAccounts(accounts);
}

/** Demo accounts so the mock login flow is usable out of the box. */
export const DEMO_ACCOUNTS = [
  { label: "Customer", email: "customer@example.com", password: "customer123" },
  { label: "Vendor (approved)", email: "vendor@example.com", password: "vendor123" },
  { label: "Admin", email: "admin@phoelamin.com", password: "admin123" },
];

export async function seedDemoAccounts() {
  if (!isBrowser() || readAccounts().length > 0) return;
  const approvedVendorApp: VendorApplication = {
    id: "mock-vendor-id",
    cafeName: "Shwe Pyi Cafe",
    category: "Cafe",
    phone: "09123456789",
    email: "vendor@example.com",
    address: "123 Example Street, Mandalay",
    latitude: 21.9588,
    longitude: 96.0891,
    businessLicense: {
      fileName: "business-license.pdf",
      fileType: "application/pdf",
      fileSize: 184_320,
      status: "submitted",
    },
    fdaApproval: {
      fileName: "fda-approval.pdf",
      fileType: "application/pdf",
      fileSize: 220_160,
      status: "submitted",
    },
    role: "vendor",
    verificationStatus: "approved",
    submittedAt: new Date().toISOString(),
  };

  writeAccounts([
    {
      user: {
        id: "mock-customer-id",
        fullName: "Aye Pyae",
        email: "customer@example.com",
        phone: "09123456789",
        role: "customer",
        provider: "password",
      },
      passwordHash: await hashPassword("customer123"),
    },
    {
      user: {
        id: "mock-vendor-user-id",
        fullName: "Shwe Pyi Cafe",
        email: "vendor@example.com",
        phone: "09123456789",
        role: "vendor",
        provider: "password",
        vendorId: approvedVendorApp.id,
      },
      passwordHash: await hashPassword("vendor123"),
      vendorApplication: approvedVendorApp,
    },
    {
      user: {
        id: "mock-admin-id",
        fullName: "Platform Administrator",
        email: "admin@phoelamin.com",
        role: "admin",
        provider: "password",
      },
      passwordHash: await hashPassword("admin123"),
    },
  ]);
}

function persistSession(session: AuthSession) {
  write(AUTH_KEYS.auth, { isAuthenticated: true, at: new Date().toISOString() });
  write(AUTH_KEYS.user, session.user);
  if (session.vendorApplication) write(AUTH_KEYS.vendorApplication, session.vendorApplication);
  else if (isBrowser()) window.localStorage.removeItem(AUTH_KEYS.vendorApplication);
}

export function loadSession(): AuthSession | null {
  const auth = read<{ isAuthenticated?: boolean }>(AUTH_KEYS.auth);
  const user = read<AuthUser>(AUTH_KEYS.user);
  if (!auth?.isAuthenticated || !user) return null;
  const stored = readAccounts().find(
    (a) => a.user.email.toLowerCase() === user.email.toLowerCase(),
  );
  const vendorApplication =
    stored?.vendorApplication ?? read<VendorApplication>(AUTH_KEYS.vendorApplication) ?? undefined;
  return {
    user: stored?.user ?? user,
    ...(vendorApplication ? { vendorApplication } : {}),
  };
}

export function clearSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_KEYS.auth);
  window.localStorage.removeItem(AUTH_KEYS.user);
  window.localStorage.removeItem(AUTH_KEYS.vendorApplication);
}

const delay = (ms = 550) => new Promise((r) => setTimeout(r, ms));

export async function login(email: string, password: string): Promise<AuthSession> {
  await seedDemoAccounts();
  await delay();
  const account = readAccounts().find(
    (a) => a.user.email.toLowerCase() === email.trim().toLowerCase(),
  );
  const passwordHash = await hashPassword(password);
  if (!account || account.passwordHash !== passwordHash) {
    throw new Error("Incorrect email or password.");
  }
  const session: AuthSession = {
    user: account.user,
    ...(account.vendorApplication ? { vendorApplication: account.vendorApplication } : {}),
  };
  persistSession(session);
  return session;
}

export async function registerCustomer(
  input: CustomerRegistrationInput,
): Promise<AuthSession> {
  await seedDemoAccounts();
  await delay();
  const email = input.email.trim().toLowerCase();
  if (readAccounts().some((a) => a.user.email.toLowerCase() === email)) {
    throw new Error("An account with this email already exists.");
  }
  // Role is assigned by the service, never by the client form.
  const user: AuthUser = {
    id: `customer-${Date.now()}`,
    fullName: input.fullName.trim(),
    email,
    phone: input.phone.trim(),
    role: "customer",
    provider: "password",
  };
  upsertAccount({ user, passwordHash: await hashPassword(input.password) });
  const session = { user };
  persistSession(session);
  return session;
}

export async function loginWithGoogle(): Promise<AuthSession> {
  await seedDemoAccounts();
  await delay(700);
  const user: AuthUser = {
    id: "mock-google-user-id",
    fullName: "Google Customer",
    email: "google@example.com",
    role: "customer",
    provider: "google",
  };
  upsertAccount({ user, passwordHash: null });
  const session = { user };
  persistSession(session);
  return session;
}

export async function registerVendor(
  input: VendorRegistrationInput,
): Promise<AuthSession> {
  await seedDemoAccounts();
  await delay(800);
  const email = input.email.trim().toLowerCase();
  if (readAccounts().some((a) => a.user.email.toLowerCase() === email)) {
    throw new Error("An account with this email already exists.");
  }
  const application: VendorApplication = {
    id: `vendor-${Date.now()}`,
    cafeName: input.cafeName.trim(),
    category: input.category,
    phone: input.phone.trim(),
    email,
    address: input.address.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    businessLicense: input.businessLicense,
    fdaApproval: input.fdaApproval,
    role: "vendor",
    // Vendors are never auto-approved — admin verification is required.
    verificationStatus: "pending",
    submittedAt: new Date().toISOString(),
  };
  const user: AuthUser = {
    id: `vendor-user-${Date.now()}`,
    fullName: application.cafeName,
    email,
    phone: application.phone,
    role: "vendor",
    provider: "password",
    vendorId: application.id,
  };
  upsertAccount({
    user,
    passwordHash: await hashPassword(input.password),
    vendorApplication: application,
  });
  const session = { user, vendorApplication: application };
  persistSession(session);
  return session;
}

export function logout() {
  clearSession();
}

/** Mock geocoding — replace with a real geocoding API later. */
export function geocodeAddress(address: string): { latitude: number; longitude: number } {
  const base = { lat: 21.9588, lng: 96.0891 }; // Mandalay
  let hash = 0;
  for (let i = 0; i < address.length; i += 1) hash = (hash * 31 + address.charCodeAt(i)) | 0;
  const jitter = (seed: number) => ((seed % 1000) / 1000 - 0.5) * 0.08;
  return {
    latitude: Number((base.lat + jitter(Math.abs(hash))).toFixed(6)),
    longitude: Number((base.lng + jitter(Math.abs(hash >> 7))).toFixed(6)),
  };
}
