import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/auth-context";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type CustomerPreferences,
} from "@/lib/preferences";

export const Route = createFileRoute("/account/settings")({
  component: SettingsPage,
});

const NOTIFICATIONS: { key: keyof CustomerPreferences; title: string; description: string }[] = [
  {
    key: "orderUpdates",
    title: "Order updates",
    description: "Status changes from confirmed through to delivered.",
  },
  {
    key: "newPostsNearby",
    title: "New food posts nearby",
    description: "When a vendor near you lists surplus food.",
  },
  {
    key: "weeklyImpact",
    title: "Weekly impact recap",
    description: "A short summary of the meals you rescued.",
  },
  {
    key: "marketing",
    title: "Offers and news",
    description: "Occasional campaigns from Phoe La Min.",
  },
];

function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<CustomerPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = loadPreferences();
    setPrefs({
      ...stored,
      fullName: stored.fullName || user?.fullName || "",
      phone: stored.phone || user?.phone || "",
    });
  }, [user?.fullName, user?.phone]);

  function update<K extends keyof CustomerPreferences>(key: K, value: CustomerPreferences[K]) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      if (typeof value === "boolean") savePreferences(next);
      return next;
    });
  }

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    savePreferences(prefs);
    toast.success("Profile updated");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Your profile details, notifications and account security.
        </p>
      </div>

      <section className="surface-card p-6">
        <h3 className="font-semibold text-foreground">Profile</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Shown to vendors on your orders.
        </p>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={prefs.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={prefs.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Default city</Label>
              <Input
                id="city"
                value={prefs.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </div>
          </div>
          <Button type="submit">Save profile</Button>
        </form>
      </section>

      <section className="surface-card p-6">
        <h3 className="font-semibold text-foreground">Notifications</h3>
        <p className="mb-2 text-sm text-muted-foreground">Choose what we ping you about.</p>
        <div className="divide-y divide-border">
          {NOTIFICATIONS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={Boolean(prefs[item.key])}
                onCheckedChange={(checked) => update(item.key, checked as never)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card space-y-4 p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Account security</h3>
            <p className="text-sm text-muted-foreground">
              Password changes and account deletion are handled by the Phoe La Min team. Email{" "}
              <a className="font-medium text-primary underline" href="mailto:admin@phoelamin.com">
                admin@phoelamin.com
              </a>{" "}
              and we'll help you out.
            </p>
          </div>
        </div>
        <Separator />
        <Button
          variant="outline"
          onClick={() => {
            logout();
            toast.success("Signed out");
            void navigate({ to: "/" });
          }}
        >
          <LogOut className="mr-2 size-4" /> Sign out
        </Button>
      </section>
    </div>
  );
}
