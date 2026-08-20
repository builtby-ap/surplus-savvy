/** Mock delivery-address book persisted in localStorage. */

export interface SavedAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  city: string;
  notes?: string;
  isDefault: boolean;
}

export type AddressInput = Omit<SavedAddress, "id">;

const KEY = "phoeLaMin_addresses";
const isBrowser = () => typeof window !== "undefined";

export function listAddresses(): SavedAddress[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedAddress[]) : [];
    return list.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  } catch {
    return [];
  }
}

function persist(list: SavedAddress[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

function normalizeDefaults(list: SavedAddress[], defaultId?: string): SavedAddress[] {
  if (list.length === 0) return list;
  const target = defaultId ?? list.find((a) => a.isDefault)?.id ?? list[0].id;
  return list.map((a) => ({ ...a, isDefault: a.id === target }));
}

export function saveAddress(input: AddressInput, id?: string): SavedAddress[] {
  const list = listAddresses();
  let next: SavedAddress[];
  let targetId = id;
  if (id) {
    next = list.map((a) => (a.id === id ? { ...input, id } : a));
  } else {
    targetId = `addr-${Date.now()}`;
    next = [...list, { ...input, id: targetId }];
  }
  next = normalizeDefaults(next, input.isDefault ? targetId : undefined);
  persist(next);
  return next;
}

export function removeAddress(id: string): SavedAddress[] {
  const next = normalizeDefaults(listAddresses().filter((a) => a.id !== id));
  persist(next);
  return next;
}

export function setDefaultAddress(id: string): SavedAddress[] {
  const next = normalizeDefaults(listAddresses(), id);
  persist(next);
  return next;
}

/** Seeds one demo address so the page isn't empty on first visit. */
export function ensureDemoAddresses(recipient = "Aung Aung", phone = "+95 9 770 000 111") {
  if (!isBrowser() || window.localStorage.getItem(KEY)) return;
  persist([
    {
      id: "addr-demo",
      label: "Home",
      recipient,
      phone,
      line1: "No. 42, Bogyoke Aung San Rd",
      city: "Yangon",
      notes: "Blue gate, ring the bell twice.",
      isDefault: true,
    },
  ]);
}
