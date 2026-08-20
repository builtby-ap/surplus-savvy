import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authService from "./auth-service";
import type {
  AuthSession,
  AuthUser,
  CustomerRegistrationInput,
  VendorApplication,
  VendorRegistrationInput,
} from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  vendorApplication: VendorApplication | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  registerCustomer: (input: CustomerRegistrationInput) => Promise<AuthSession>;
  registerVendor: (input: VendorRegistrationInput) => Promise<AuthSession>;
  loginWithGoogle: () => Promise<AuthSession>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void authService.seedDemoAccounts().then(() => {
      if (!active) return;
      setSession(authService.loadSession());
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const next = await authService.login(email, password);
    setSession(next);
    return next;
  }, []);

  const registerCustomer = useCallback(async (input: CustomerRegistrationInput) => {
    const next = await authService.registerCustomer(input);
    setSession(next);
    return next;
  }, []);

  const registerVendor = useCallback(async (input: VendorRegistrationInput) => {
    const next = await authService.registerVendor(input);
    setSession(next);
    return next;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const next = await authService.loginWithGoogle();
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      vendorApplication: session?.vendorApplication ?? null,
      isAuthenticated: Boolean(session?.user),
      isLoading,
      login,
      registerCustomer,
      registerVendor,
      loginWithGoogle,
      logout,
    }),
    [session, isLoading, login, registerCustomer, registerVendor, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** Where a signed-in user should land, based on role + vendor verification. */
export function homePathForSession(session: AuthSession): string {
  const { user, vendorApplication } = session;
  if (user.role === "admin") return "/admin";
  if (user.role === "vendor") {
    return vendorApplication?.verificationStatus === "approved"
      ? "/dashboard"
      : "/vendor/application-status";
  }
  return "/";
}
