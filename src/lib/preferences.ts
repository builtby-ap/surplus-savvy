/** Mock customer profile + notification preferences persisted in localStorage. */

export interface CustomerPreferences {
  fullName: string;
  phone: string;
  city: string;
  orderUpdates: boolean;
  newPostsNearby: boolean;
  weeklyImpact: boolean;
  marketing: boolean;
}

const KEY = "phoeLaMin_preferences";
const isBrowser = () => typeof window !== "undefined";

export const DEFAULT_PREFERENCES: CustomerPreferences = {
  fullName: "",
  phone: "",
  city: "Yangon",
  orderUpdates: true,
  newPostsNearby: true,
  weeklyImpact: false,
  marketing: false,
};

export function loadPreferences(): CustomerPreferences {
  if (!isBrowser()) return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw
      ? { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<CustomerPreferences>) }
      : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: CustomerPreferences) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(prefs));
}
