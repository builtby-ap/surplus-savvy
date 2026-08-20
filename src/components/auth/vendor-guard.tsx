import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Keeps food vendors out of the customer-facing marketplace.
 * Redirects them to their own dashboard (or application status).
 */
export function VendorRedirect() {
  const navigate = useNavigate();
  const { user, vendorApplication } = useAuth();
  const isVendor = user?.role === "vendor";
  const approved = vendorApplication?.verificationStatus === "approved";

  useEffect(() => {
    if (!isVendor) return;
    void navigate({
      to: approved ? "/dashboard/analytics" : "/vendor/application-status",
      replace: true,
    });
  }, [isVendor, approved, navigate]);

  return null;
}
