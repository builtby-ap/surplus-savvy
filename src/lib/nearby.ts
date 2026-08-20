/** Last location the customer used for nearby discovery, shared across pages. */
const KEY = "phoelamin.location";

export interface LatLng {
  lat: number;
  lng: number;
}

export function saveNearbyLocation(loc: LatLng | null) {
  if (typeof window === "undefined") return;
  if (!loc) window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, JSON.stringify(loc));
}

export function getNearbyLocation(): LatLng | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LatLng;
    return typeof parsed?.lat === "number" && typeof parsed?.lng === "number" ? parsed : null;
  } catch {
    return null;
  }
}
