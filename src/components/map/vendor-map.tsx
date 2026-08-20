import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import {
  businessTypeLabels,
  cityCenter,
  formatPrice,
  haversineKm,
  type Business,
  type MysteryBag,
} from "@/data/mock";
import { Button } from "@/components/ui/button";

export interface VendorPin {
  business: Business;
  bags: MysteryBag[];
  distanceKm: number;
}

function pinIcon(count: number) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:var(--primary);color:var(--primary-foreground);font:600 12px/1 system-ui;box-shadow:0 6px 16px rgba(0,0,0,.25);border:2px solid var(--background)">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
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
}: {
  pins: VendorPin[];
  userLocation: { lat: number; lng: number } | null;
}) {
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
      zoom={userLocation ? 14 : 13}
      scrollWheelZoom
      className="h-[560px] w-full rounded-2xl"
      style={{ zIndex: 0 }}
    >
      <Recenter center={center} zoom={userLocation ? 14 : 13} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
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
      )}

      {pins.map(({ business, bags, distanceKm }) => {
        const prices = bags.map((b) => b.discountedPrice);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const dist = userLocation
          ? haversineKm(userLocation, business)
          : distanceKm;
        return (
          <Marker
            key={business.id}
            position={[business.lat, business.lng]}
            icon={pinIcon(bags.length)}
          >
            <Popup>
              <div className="min-w-[190px] space-y-1">
                <p className="text-sm font-semibold text-foreground">{business.name}</p>
                <p className="text-xs text-muted-foreground">
                  {businessTypeLabels[business.type]} · {dist.toFixed(1)} km away
                </p>
                <p className="text-xs text-muted-foreground">
                  {bags.length} available post{bags.length === 1 ? "" : "s"} ·{" "}
                  {min === max
                    ? formatPrice(min)
                    : `${formatPrice(min)} – ${formatPrice(max)}`}
                </p>
                <Button asChild size="sm" className="mt-2 h-8 w-full">
                  <Link to="/business/$businessId" params={{ businessId: business.id }}>
                    View food posts
                  </Link>
                </Button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
