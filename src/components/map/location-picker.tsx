import { useEffect, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

function markerIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:var(--primary);border:3px solid var(--background);box-shadow:0 6px 16px rgba(0,0,0,.25)"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);
  return null;
}

function ClickCapture({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))),
  });
  return null;
}

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}) {
  const icon = useMemo(() => markerIcon(), []);
  const markerRef = useRef<L.Marker | null>(null);

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      className="h-64 w-full rounded-xl sm:h-72"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={latitude} lng={longitude} />
      <ClickCapture onChange={onChange} />
      <Marker
        position={[latitude, longitude]}
        icon={icon}
        draggable
        ref={markerRef}
        eventHandlers={{
          dragend: () => {
            const pos = markerRef.current?.getLatLng();
            if (pos) onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
          },
        }}
      />
    </MapContainer>
  );
}
