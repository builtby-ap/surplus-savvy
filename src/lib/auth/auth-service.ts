/**
 * Supabase-backed authentication service.
 *
 * This is the ONLY place that knows how auth is implemented — the React
 * provider, hooks and UI keep the exact same shape as before.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AuthSession,
  AuthUser,
  CustomerRegistrationInput,
  UserRole,
  VendorApplication,
  VendorRegistrationInput,
} from "./types";

/** Legacy localStorage keys — still read by the mock admin/analytics helpers. */
export const AUTH_KEYS = {
  auth: "phoeLaMin_auth",
  user: "phoeLaMin_user",
  vendorApplication: "phoeLaMin_vendor_application",
  accounts: "phoeLaMin_accounts",
} as const;

/** Demo accounts seeded in the database. */
export const DEMO_ACCOUNTS = [
  { label: "Customer", email: "customer@example.com", password: "customer123" },
  { label: "Vendor (approved)", email: "vendor@example.com", password: "vendor123" },
  { label: "Admin", email: "admin@phoelamin.com", password: "admin123" },
];

/** Kept for API compatibility — demo accounts now live in Supabase. */
export async function seedDemoAccounts() {
  return;
}

type DbRole = "customer" | "food_vendor" | "admin";

const CATEGORY_TO_TYPE: Record<string, string> = {
  Cafe: "cafe",
  Restaurant: "restaurant",
  Bakery: "bakery",
  "Grocery Store": "grocery",
  "Fresh Market": "fresh_market",
  "Snack Shop": "snack_shop",
  "Convenience Store": "convenience",
  "Food Producer": "producer",
};

const TYPE_TO_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_TO_TYPE).map(([label, value]) => [value, label]),
);

function appRole(roles: DbRole[]): UserRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("food_vendor")) return "vendor";
  return "customer";
}

function documentMeta(fileName: string | null | undefined) {
  return {
    fileName: fileName ?? "document.pdf",
    fileType: "application/pdf",
    fileSize: 0,
    status: "submitted" as const,
  };
}

type VendorRow = {
  id: string;
  legacy_id: string | null;
  name: string;
  type: string;
  address: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: string;
  rejection_reason: string | null;
  business_license_name: string | null;
  fda_approval_name: string | null;
  created_at: string;
};

function toApplication(row: VendorRow): VendorApplication {
  const status =
    row.verification_status === "approved"
      ? "approved"
      : row.verification_status === "pending"
        ? "pending"
        : "rejected";
  return {
    id: row.legacy_id ?? row.id,
    cafeName: row.name,
    category: TYPE_TO_CATEGORY[row.type] ?? row.type,
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    businessLicense: documentMeta(row.business_license_name),
    fdaApproval: documentMeta(row.fda_approval_name),
    role: "vendor",
    verificationStatus: status,
    ...(row.rejection_reason ? { rejectionReason: row.rejection_reason } : {}),
    submittedAt: row.created_at,
  };
}

/** Builds the app session for the currently signed-in Supabase user. */
export async function loadSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const authUserId = data.user.id;

  const [profileRes, rolesRes, vendorRes] = await Promise.all([
    supabase.from("profiles").select("full_name, email, phone").eq("id", authUserId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", authUserId),
    supabase
      .from("vendors")
      .select(
        "id, legacy_id, name, type, address, phone, email, latitude, longitude, verification_status, rejection_reason, business_license_name, fda_approval_name, created_at",
      )
      .eq("owner_id", authUserId)
      .maybeSingle(),
  ]);

  const roles = (rolesRes.data ?? []).map((r) => r.role as DbRole);
  const role = appRole(roles);
  const meta = data.user.user_metadata ?? {};
  const vendor = (vendorRes.data as VendorRow | null) ?? null;
  const application = vendor ? toApplication(vendor) : undefined;

  const user: AuthUser = {
    id: authUserId,
    fullName: profileRes.data?.full_name || (meta['full_name'] as string) || "",
    email: profileRes.data?.email || data.user.email || "",
    ...(profileRes.data?.phone || meta['phone']
      ? { phone: (profileRes.data?.phone ?? (meta['phone'] as string)) as string }
      : {}),
    role,
    provider: data.user.app_metadata?.provider === "google" ? "google" : "password",
    ...(application ? { vendorId: application.id } : {}),
  };

  return { user, ...(application ? { vendorApplication: application } : {}) };
}

async function sessionOrThrow(): Promise<AuthSession> {
  const session = await loadSession();
  if (!session) throw new Error("Could not load your account. Please try again.");
  return session;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error("Incorrect email or password.");
  return sessionOrThrow();
}

export async function registerCustomer(
  input: CustomerRegistrationInput,
): Promise<AuthSession> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: {
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        role: "customer",
      },
    },
  });
  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("already")
        ? "An account with this email already exists."
        : error.message,
    );
  }
  if (!data.session) {
    const retry = await supabase.auth.signInWithPassword({ email, password: input.password });
    if (retry.error) {
      throw new Error("Account created. Please confirm your email address, then log in.");
    }
  }
  return sessionOrThrow();
}

export async function registerVendor(
  input: VendorRegistrationInput,
): Promise<AuthSession> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: {
        full_name: input.cafeName.trim(),
        phone: input.phone.trim(),
        role: "food_vendor",
      },
    },
  });
  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("already")
        ? "An account with this email already exists."
        : error.message,
    );
  }
  if (!data.session) {
    const retry = await supabase.auth.signInWithPassword({ email, password: input.password });
    if (retry.error) {
      throw new Error("Account created. Please confirm your email address, then log in.");
    }
  }

  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData.user?.id;
  if (ownerId) {
    // Vendors are never auto-approved — admin verification is required.
    await supabase.from("vendors").insert({
      owner_id: ownerId,
      name: input.cafeName.trim(),
      type: (CATEGORY_TO_TYPE[input.category] ?? "cafe") as never,
      address: input.address.trim(),
      phone: input.phone.trim(),
      email,
      latitude: input.latitude,
      longitude: input.longitude,
      logo_initials: input.cafeName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join(""),
      business_license_name: input.businessLicense.fileName,
      fda_approval_name: input.fdaApproval.fileName,
      verification_status: "pending" as never,
    });
  }

  return sessionOrThrow();
}

export async function loginWithGoogle(): Promise<AuthSession> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) {
    throw new Error("Google sign-in isn't available yet. Please use email and password.");
  }
  // The browser navigates to Google; this resolves only if it did not.
  return sessionOrThrow();
}

export async function logout() {
  await supabase.auth.signOut();
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
