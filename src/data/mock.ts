import bagBakery from "@/assets/bag-bakery.jpg";
import bagMeals from "@/assets/bag-meals.jpg";
import bagProduce from "@/assets/bag-produce.jpg";
import bagGrocery from "@/assets/bag-grocery.jpg";
import bagDesserts from "@/assets/bag-desserts.jpg";
import storeCafe from "@/assets/store-cafe.jpg";

export type BusinessType =
  | "restaurant"
  | "cafe"
  | "bakery"
  | "grocery"
  | "fresh_market"
  | "snack_shop"
  | "convenience"
  | "producer";

export type BagCategory =
  | "mixed_meals"
  | "bakery"
  | "grocery"
  | "produce"
  | "snacks"
  | "beverages"
  | "desserts";

export type FulfillmentType = "pickup" | "delivery" | "both";

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  description: string;
  address: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  image: string;
  logoInitials: string;
  fulfillment: FulfillmentType;
  mealsRescued: number;
  verified: boolean;
  lat: number;
  lng: number;
}

export interface MysteryBag {
  id: string;
  businessId: string;
  title: string;
  category: BagCategory;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  quantityLeft: number;
  totalQuantity: number;
  availableFrom: string;
  availableUntil: string;
  fulfillment: FulfillmentType;
  image: string;
  rating: number;
}

export const businessTypeLabels: Record<BusinessType, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe",
  bakery: "Bakery",
  grocery: "Grocery store",
  fresh_market: "Fresh market",
  snack_shop: "Snack shop",
  convenience: "Convenience store",
  producer: "Food producer",
};

export const bagCategoryLabels: Record<BagCategory, string> = {
  mixed_meals: "Mixed meals",
  bakery: "Bakery",
  grocery: "Grocery",
  produce: "Produce",
  snacks: "Snacks",
  beverages: "Beverages",
  desserts: "Desserts",
};

export const categoryImages: Record<BagCategory, string> = {
  mixed_meals: bagMeals,
  bakery: bagBakery,
  grocery: bagGrocery,
  produce: bagProduce,
  snacks: bagGrocery,
  beverages: bagDesserts,
  desserts: bagDesserts,
};

export const storefrontImage = storeCafe;

export const businesses: Business[] = [
  {
    id: "b1",
    name: "Golden Crust Bakery",
    type: "bakery",
    description:
      "Family bakery baking sourdough, croissants and cakes fresh every morning since 1998.",
    address: "18 Maple Street",
    neighborhood: "Old Town",
    rating: 4.8,
    reviewCount: 412,
    image: storeCafe,
    logoInitials: "GC",
    fulfillment: "both",
    mealsRescued: 3120,
    verified: true,
    lat: 51.5121,
    lng: -0.123,
  },
  {
    id: "b2",
    name: "Saffron House Kitchen",
    type: "restaurant",
    description: "Slow-cooked curries, grilled plates and rice bowls made in small batches.",
    address: "44 River Road",
    neighborhood: "Riverside",
    rating: 4.6,
    reviewCount: 289,
    image: storeCafe,
    logoInitials: "SH",
    fulfillment: "both",
    mealsRescued: 2480,
    verified: true,
    lat: 51.5052,
    lng: -0.1108,
  },
  {
    id: "b3",
    name: "Cloud & Bean Cafe",
    type: "cafe",
    description: "Neighbourhood coffee bar with pastries, sandwiches and cold brew on tap.",
    address: "7 Lantern Lane",
    neighborhood: "Midtown",
    rating: 4.7,
    reviewCount: 356,
    image: storeCafe,
    logoInitials: "CB",
    fulfillment: "pickup",
    mealsRescued: 1890,
    verified: true,
    lat: 51.5194,
    lng: -0.137,
  },
  {
    id: "b4",
    name: "Greenfield Grocers",
    type: "grocery",
    description: "Independent grocery with pantry staples, dairy and chilled goods.",
    address: "120 Harvest Avenue",
    neighborhood: "Northgate",
    rating: 4.4,
    reviewCount: 198,
    image: storeCafe,
    logoInitials: "GG",
    fulfillment: "both",
    mealsRescued: 4210,
    verified: true,
    lat: 51.5285,
    lng: -0.118,
  },
  {
    id: "b5",
    name: "Sunrise Fresh Market",
    type: "fresh_market",
    description: "Open-air market stalls with seasonal fruit, vegetables and herbs.",
    address: "3 Market Square",
    neighborhood: "Old Town",
    rating: 4.5,
    reviewCount: 233,
    image: storeCafe,
    logoInitials: "SF",
    fulfillment: "pickup",
    mealsRescued: 2760,
    verified: false,
    lat: 51.5142,
    lng: -0.13,
  },
  {
    id: "b6",
    name: "Crunch Corner",
    type: "snack_shop",
    description: "Crisps, nuts, dried fruit and sweet treats by weight.",
    address: "51 Beacon Street",
    neighborhood: "Midtown",
    rating: 4.2,
    reviewCount: 96,
    image: storeCafe,
    logoInitials: "CC",
    fulfillment: "pickup",
    mealsRescued: 640,
    verified: false,
    lat: 51.517,
    lng: -0.142,
  },
  {
    id: "b7",
    name: "NightOwl Convenience",
    type: "convenience",
    description: "Late-night shop for drinks, ready meals and everyday essentials.",
    address: "88 Station Way",
    neighborhood: "Station District",
    rating: 4.1,
    reviewCount: 141,
    image: storeCafe,
    logoInitials: "NO",
    fulfillment: "both",
    mealsRescued: 1120,
    verified: true,
    lat: 51.53,
    lng: -0.125,
  },
  {
    id: "b8",
    name: "Meadowmilk Dairy Co.",
    type: "producer",
    description: "Small-batch yoghurt, butter and cheese from a family dairy outside the city.",
    address: "Unit 4, Meadow Works",
    neighborhood: "Southfields",
    rating: 4.9,
    reviewCount: 87,
    image: storeCafe,
    logoInitials: "MD",
    fulfillment: "delivery",
    mealsRescued: 980,
    verified: true,
    lat: 51.495,
    lng: -0.118,
  },
  {
    id: "b9",
    name: "Basil & Fig Trattoria",
    type: "restaurant",
    description: "Wood-fired pizza and handmade pasta served in a tiny 20-seat dining room.",
    address: "22 Olive Court",
    neighborhood: "Riverside",
    rating: 4.7,
    reviewCount: 302,
    image: storeCafe,
    logoInitials: "BF",
    fulfillment: "both",
    mealsRescued: 1740,
    verified: true,
    lat: 51.503,
    lng: -0.12,
  },
  {
    id: "b10",
    name: "Sweet Thistle Patisserie",
    type: "bakery",
    description: "Layer cakes, tarts and macarons made fresh daily, never sold the next day.",
    address: "9 Rosewood Place",
    neighborhood: "Northgate",
    rating: 4.8,
    reviewCount: 214,
    image: storeCafe,
    logoInitials: "ST",
    fulfillment: "pickup",
    mealsRescued: 1330,
    verified: true,
    lat: 51.532,
    lng: -0.105,
  },
];

function bag(
  id: string,
  businessId: string,
  title: string,
  category: BagCategory,
  description: string,
  originalPrice: number,
  discountedPrice: number,
  quantityLeft: number,
  totalQuantity: number,
  availableFrom: string,
  availableUntil: string,
  fulfillment: FulfillmentType,
  rating: number,
): MysteryBag {
  return {
    id,
    businessId,
    title,
    category,
    description,
    originalPrice,
    discountedPrice,
    quantityLeft,
    totalQuantity,
    availableFrom,
    availableUntil,
    fulfillment,
    image: categoryImages[category],
    rating,
  };
}

export const mysteryBags: MysteryBag[] = [
  bag("m1", "b1", "Morning Bakers' Bag", "bakery", "A mix of croissants, rolls and yesterday's sourdough loaves.", 24, 7.5, 3, 12, "17:30", "19:00", "both", 4.8),
  bag("m2", "b1", "Sweet Pastry Surprise", "desserts", "Danishes, cinnamon buns and fruit tarts from the afternoon tray.", 18, 6, 1, 8, "18:00", "19:30", "pickup", 4.7),
  bag("m3", "b2", "Chef's Dinner Rescue", "mixed_meals", "Two to three portions of the day's curries, rice and sides.", 32, 11, 5, 10, "20:30", "22:00", "both", 4.6),
  bag("m4", "b2", "Lunch Box Bundle", "mixed_meals", "Assorted lunch boxes left from the midday service.", 21, 8, 0, 6, "14:30", "15:30", "pickup", 4.4),
  bag("m5", "b3", "Cafe Counter Bag", "bakery", "Sandwiches, muffins and a pastry or two from the counter.", 19, 6.5, 4, 9, "16:30", "18:00", "pickup", 4.7),
  bag("m6", "b3", "Cold Brew Rescue Pack", "beverages", "Bottled cold brew, iced teas and juices close to date.", 15, 5, 6, 10, "17:00", "18:30", "pickup", 4.3),
  bag("m7", "b4", "Pantry Staples Box", "grocery", "Pasta, sauces, tinned goods and cereal near best-before.", 30, 10, 8, 15, "18:00", "20:30", "both", 4.5),
  bag("m8", "b4", "Chilled Dairy Bag", "grocery", "Yoghurt, milk, cheese and butter from the chilled aisle.", 26, 9, 2, 10, "19:00", "20:30", "delivery", 4.4),
  bag("m9", "b5", "Market Veg Haul", "produce", "A generous mix of seasonal vegetables from closing stalls.", 22, 6, 7, 14, "15:30", "17:00", "pickup", 4.6),
  bag("m10", "b5", "Ripe & Ready Fruit Bag", "produce", "Very ripe fruit, perfect for smoothies and baking today.", 16, 4.5, 3, 12, "15:30", "17:00", "pickup", 4.5),
  bag("m11", "b6", "Snack Attack Bag", "snacks", "Crisps, popcorn, nuts and chocolate bars near date.", 14, 4, 9, 12, "17:00", "19:00", "pickup", 4.2),
  bag("m12", "b6", "Dried Fruit & Nut Mix", "snacks", "Mixed bags of dried mango, apricots, almonds and cashews.", 18, 6, 2, 6, "17:30", "19:00", "pickup", 4.1),
  bag("m13", "b7", "Late Night Essentials", "grocery", "Ready meals, bread, drinks and small essentials.", 20, 7, 5, 10, "21:30", "23:30", "both", 4.0),
  bag("m14", "b7", "Fridge Drinks Bundle", "beverages", "Soft drinks, energy drinks and iced coffee near date.", 13, 4, 4, 8, "21:00", "23:00", "pickup", 4.1),
  bag("m15", "b8", "Dairy Producer Crate", "grocery", "Yoghurt pots, butter blocks and a wedge of cheese.", 34, 12, 3, 8, "10:00", "13:00", "delivery", 4.9),
  bag("m16", "b9", "Trattoria Family Bag", "mixed_meals", "Pizza slices, pasta portions and garlic bread for two.", 36, 12.5, 2, 8, "21:00", "22:30", "both", 4.7),
  bag("m17", "b9", "Fresh Pasta Rescue", "grocery", "Handmade pasta and sauces made this morning.", 24, 8.5, 6, 10, "20:00", "21:30", "pickup", 4.6),
  bag("m18", "b10", "Patisserie Cake Box", "desserts", "Two or three cake slices plus macarons from the display.", 28, 9.5, 1, 6, "18:30", "19:30", "pickup", 4.9),
  bag("m19", "b10", "Tart & Treats Bag", "desserts", "Fruit tarts, brownies and eclairs from today's bake.", 22, 7, 4, 8, "18:30", "19:30", "pickup", 4.8),
  bag("m20", "b1", "Bread Basket Bundle", "bakery", "Assorted loaves: rye, seeded, focaccia and baguettes.", 20, 6, 5, 10, "18:30", "19:30", "both", 4.7),
];

export function getBusiness(id: string) {
  return businesses.find((b) => b.id === id);
}

export function getBag(id: string) {
  return mysteryBags.find((b) => b.id === id);
}

export function bagsForBusiness(id: string) {
  return mysteryBags.filter((b) => b.businessId === id);
}

export const platformStats = {
  mealsRescued: 20470,
  co2SavedKg: 51175,
  activeBusinesses: businesses.length,
  moneySaved: 184230,
};

export interface MockOrder {
  id: string;
  bagId: string;
  status: "reserved" | "collected" | "cancelled";
  placedAt: string;
  method: "pickup" | "delivery";
  total: number;
  code: string;
}

export const orders: MockOrder[] = [
  { id: "o1", bagId: "m1", status: "reserved", placedAt: "Today, 16:12", method: "pickup", total: 7.5, code: "SR-4821" },
  { id: "o2", bagId: "m7", status: "collected", placedAt: "Yesterday, 19:40", method: "delivery", total: 10, code: "SR-4712" },
  { id: "o3", bagId: "m18", status: "collected", placedAt: "Mon, 18:55", method: "pickup", total: 9.5, code: "SR-4655" },
  { id: "o4", bagId: "m9", status: "cancelled", placedAt: "Sun, 15:20", method: "pickup", total: 6, code: "SR-4590" },
];

export const favouriteBagIds = ["m1", "m9", "m18"];

export const addresses = [
  { id: "a1", label: "Home", line: "12 Larkspur Terrace, Old Town", isDefault: true },
  { id: "a2", label: "Work", line: "Floor 3, 200 Harbour Point, Midtown", isDefault: false },
];

export function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export function discountPercent(bag: MysteryBag) {
  return Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const cityCenter = { lat: 51.5145, lng: -0.122 };
