import { useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GEOFENCES = [
  { id: "panchavati", name: "Panchavati", latitude: 20.0102, longitude: 73.7987, radius: 800 },
  { id: "ramkund", name: "Ramkund", latitude: 20.0059, longitude: 73.7924, radius: 700 },
  { id: "tentcity", name: "Tent City", latitude: 19.9925, longitude: 73.7831, radius: 900 },
];

const PRIORITY_COLOR = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#16a34a",
};

export default function MapPage({ complaints }) {
  const [satellite, setSatellite] = useState(true);
  const [showHighOnly, setShowHighOnly] = useState(false);
  const [showZones, setShowZones] = useState(true);

  const validComplaints = useMemo(
    () =>
      (Array.isArray(complaints) ? complaints : []).filter((c) => {
        const lat = Number(c?.latitude);
        const lng = Number(c?.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [complaints]
  );

  const filteredComplaints = useMemo(
    () => (showHighOnly ? validComplaints.filter((c) => c.priority === "high") : validComplaints),
    [validComplaints, showHighOnly]
  );

  const summary = useMemo(
    () => ({
      total: filteredComplaints.length,
      high: validComplaints.filter((x) => x.priority === "high").length,
    }),
    [filteredComplaints, validComplaints]
  );

  const tileUrl = satellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="space-y-4">
      <div className="kumbh-glass rounded-xl border border-white/70 p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Live Map Summary</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSatellite((v) => !v)}
              className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600"
            >
              {satellite ? "Satellite" : "Street"}
            </button>
            <button
              type="button"
              onClick={() => setShowHighOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                showHighOnly ? "bg-orange-700 text-white" : "bg-orange-100 text-orange-800"
              }`}
            >
              High only
            </button>
            <button
              type="button"
              onClick={() => setShowZones((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                showZones ? "bg-orange-700 text-white" : "bg-orange-100 text-orange-800"
              }`}
            >
              Zones
            </button>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-3">
          <p>Total complaints: <span className="font-semibold">{summary.total}</span></p>
          <p>High priority: <span className="font-semibold">{summary.high}</span></p>
          <p>Zones: <span className="font-semibold">{GEOFENCES.map((z) => z.name).join(", ")}</span></p>
        </div>

        <div className="h-[520px] overflow-hidden rounded-xl border border-slate-200">
          <MapContainer center={[19.9975, 73.7898]} zoom={13} scrollWheelZoom className="h-full w-full">
            <TileLayer url={tileUrl} />

            {showZones &&
              GEOFENCES.map((zone) => (
                <Circle
                  key={zone.id}
                  center={[zone.latitude, zone.longitude]}
                  radius={zone.radius}
                  pathOptions={{
                    color: "#f97316",
                    fillColor: "#fb923c",
                    fillOpacity: 0.15,
                  }}
                >
                  <Popup>{zone.name}</Popup>
                </Circle>
              ))}

            {filteredComplaints.map((c) => {
              const color = PRIORITY_COLOR[c.priority] || "#64748b";
              const category = c.category || "issue";
              const status = c.status || "new";
              return (
                <CircleMarker
                  key={c._id || `${c.platform}-${c.createdAt}-${c.text?.slice(0, 16)}`}
                  center={[Number(c.latitude), Number(c.longitude)]}
                  radius={7}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}
                >
                  <Popup>
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold capitalize">{category} - {status}</p>
                      <p className="text-slate-700">{c.locationName || "Unknown location"}</p>
                      <p className="text-slate-500">{c.text || "No text"}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/StatusBadge";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const NASHIK_CENTER = [19.9975, 73.7898];

const geofences = [
  { name: "Panchavati Zone", center: [20.0102, 73.7987], radius: 800 },
  { name: "Ramkund Zone", center: [20.0059, 73.7924], radius: 700 },
  { name: "Tent City Zone", center: [19.9925, 73.7831], radius: 900 },
];

const PHOTO_SET = [
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1529312266916-d52f0e44aa57?auto=format&fit=crop&w=800&q=80",
];

function makeClusterKey(lat, lng) {
  return `${lat.toFixed(3)}:${lng.toFixed(3)}`;
}

export default function MapPage({ complaints }) {
  const clustered = useMemo(() => {
    const map = new Map();
    for (const complaint of complaints) {
      const key = makeClusterKey(complaint.latitude, complaint.longitude);
      if (!map.has(key)) {
        map.set(key, {
          key,
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          items: [],
        });
      }
      map.get(key).items.push(complaint);
    }
    return Array.from(map.values());
  }, [complaints]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      <div className="xl:col-span-3 kumbh-glass rounded-xl border border-white/70 p-2 h-[80vh]">
        <MapContainer center={NASHIK_CENTER} zoom={13} className="h-full w-full rounded-xl">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {geofences.map((zone) => (
            <Circle key={zone.name} center={zone.center} radius={zone.radius} pathOptions={{ fillOpacity: 0.08 }}>
              <Popup>{zone.name}</Popup>
            </Circle>
          ))}

          {clustered.map((cluster) => (
            <Marker key={cluster.key} position={[cluster.latitude, cluster.longitude]}>
              <Popup>
                <div className="space-y-2 max-w-xs">
                  <p className="text-sm font-semibold">Cluster size: {cluster.items.length}</p>
                  {cluster.items.slice(0, 3).map((complaint) => (
                    <div key={complaint._id} className="rounded border p-2">
                      <p className="text-xs font-semibold">{complaint.text}</p>
                      <p className="text-[11px]">Category: {complaint.category}</p>
                      <div className="flex gap-2 mt-1">
                        <PriorityBadge priority={complaint.priority} />
                        <StatusBadge status={complaint.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="space-y-3">
        <div className="kumbh-glass rounded-xl border border-white/70 p-3">
          <h3 className="font-semibold mb-2">Live Scene Gallery</h3>
          <div className="space-y-2">
            {PHOTO_SET.map((src, i) => (
              <img key={i} src={src} alt="Kumbh crowd" className="card-lift h-24 w-full rounded-lg object-cover" />
            ))}
          </div>
        </div>
        <div className="kumbh-glass rounded-xl border border-white/70 p-3 text-sm">
          <h3 className="font-semibold">Map Interactions</h3>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>• Geofences for priority zones</li>
            <li>• Cluster marker summary popup</li>
            <li>• Badge view for category + status</li>
            <li>• Auto-refresh synced with dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
