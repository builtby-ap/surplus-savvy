import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import {
  bagCategoryLabels,
  businessTypeLabels,
  cityCenter,
  discountPercent,
  formatPrice,
  haversineKm,
  type BagCategory,
  type Business,
  type BusinessType,
  type MysteryBag,
} from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface VendorPin {
  business: Business;
  bags: MysteryBag[];
  distanceKm: number;
}

const typeEmoji: Record<BusinessType, string> = {
  bakery: "🥐",
  cafe: "☕",
  restaurant: "🍱",
  grocery: "🛒",
  fresh_market: "🥬",
  snack_shop: "🍿",
  convenience: "🏪",
  producer: "🧀",
};

const categoryEmoji: Record<BagCategory, string> = {
  bakery: "🥐",
  desserts_cakes: "🍰",
  mixed_meals: "🍱",
  rice_meals: "🍛",
  noodles: "🍜",
  fast_food: "🍔",
  bbq_grills: "🍢",
  cafe_tea: "☕",
  beverages: "☕",
};

export function pinEmoji(business: Business, bags: MysteryBag[]) {
  const first = bags[0];
  return first ? (categoryEmoji[first.category] ?? typeEmoji[business.type]) : typeEmoji[business.type];
}

function pinIcon(emoji: string, count: number) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9999px;background:var(--background);font-size:19px;line-height:1;box-shadow:0 6px 16px rgba(0,0,0,.25);border:2px solid var(--primary)">${emoji}<span style="position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;border-radius:9999px;background:var(--primary);color:var(--primary-foreground);font:600 11px/18px system-ui;text-align:center">${count}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]);
  return null;
}

export default function VendorMap({
  pins,
  userLocation,
  radiusKm,
  onAddToCart,
}: {
  pins: VendorPin[];
  userLocation: { lat: number; lng: number } | null;
  radiusKm?: number;
  onAddToCart?: (bag: MysteryBag) => void;
}) {
  const zoom = radiusKm ? (radiusKm <= 1 ? 15 : radiusKm <= 2 ? 14 : radiusKm <= 5 ? 13 : radiusKm <= 10 ? 12 : 11) : 13;
  const center = useMemo<[number, number]>(
    () =>
      userLocation
        ? [userLocation.lat, userLocation.lng]
        : pins[0]
          ? [pins[0].business.lat, pins[0].business.lng]
          : [cityCenter.lat, cityCenter.lng],
    [userLocation, pins],
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className="h-[420px] w-full rounded-2xl sm:h-[560px]"
      style={{ zIndex: 0 }}
    >
      <Recenter center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <>
          {radiusKm ? (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "var(--primary)", weight: 1, fillOpacity: 0.06 }}
            />
          ) : null}
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: "",
              html: `<div style="width:16px;height:16px;border-radius:9999px;background:var(--ring);border:3px solid var(--background);box-shadow:0 0 0 6px color-mix(in oklab, var(--ring) 25%, transparent)"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup>You are here</Popup>
          </Marker>
        </>
      )}

      {pins.map(({ business, bags, distanceKm }) => {
        const dist = userLocation ? haversineKm(userLocation, business) : distanceKm;
        return (
          <Marker
            key={business.id}
            position={[business.lat, business.lng]}
            icon={pinIcon(pinEmoji(business, bags), bags.length)}
          >
            <Popup>
              <div className="w-[248px] space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{business.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {businessTypeLabels[business.type]} · {dist.toFixed(1)} km away
                  </p>
                </div>
                {bags.slice(0, 2).map((bag) => (
                  <div key={bag.id} className="space-y-1.5 rounded-xl border border-border p-2">
                    <img
                      src={bag.image}
                      alt={bag.title}
                      loading="lazy"
                      className="h-20 w-full rounded-lg object-cover"
                    />
                    <p className="text-[13px] font-semibold text-foreground">{bag.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="rounded-full text-[10px] font-normal">
                        {categoryEmoji[bag.category]} {bagCategoryLabels[bag.category]}
                      </Badge>
                      <Badge className="rounded-full bg-success text-[10px] font-normal text-success-foreground">
                        -{discountPercent(bag)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-accent">
                        {formatPrice(bag.discountedPrice)}
                      </span>{" "}
                      <span className="line-through">{formatPrice(bag.originalPrice)}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {bag.quantityLeft} left · pickup {bag.availableFrom}–{bag.availableUntil}
                    </p>
                    <div className="flex gap-1.5 pt-0.5">
                      <Button asChild size="sm" variant="outline" className="h-8 flex-1 text-xs">
                        <Link to="/bag/$bagId" params={{ bagId: bag.id }}>
                          View details
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 flex-1 bg-accent text-xs text-accent-foreground hover:bg-accent/90"
                        onClick={() => onAddToCart?.(bag)}
                      >
                        Add to cart
                      </Button>
                    </div>
                  </div>
                ))}
                {bags.length > 2 && (
                  <p className="text-[11px] text-muted-foreground">
                    +{bags.length - 2} more secret bag{bags.length - 2 === 1 ? "" : "s"} here
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
