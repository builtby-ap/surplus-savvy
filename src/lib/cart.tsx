import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartLine {
  bagId: string;
  quantity: number;
}

const STORAGE_KEY = "surplus-rescue:cart";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  add: (bagId: string, quantity?: number, max?: number) => void;
  setQuantity: (bagId: string, quantity: number) => void;
  remove: (bagId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.bagId) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(read());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const add = useCallback((bagId: string, quantity = 1, max = 99) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.bagId === bagId);
      if (!existing) return [...prev, { bagId, quantity: Math.min(quantity, max) }];
      return prev.map((l) =>
        l.bagId === bagId ? { ...l, quantity: Math.min(l.quantity + quantity, max) } : l,
      );
    });
  }, []);

  const setQuantity = useCallback((bagId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.bagId !== bagId)
        : prev.map((l) => (l.bagId === bagId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((bagId: string) => {
    setLines((prev) => prev.filter((l) => l.bagId !== bagId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
