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
      <div className="nashik-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold nashik-title">Live Map Summary</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSatellite((v) => !v)}
              className="nashik-btn-primary rounded-full px-3 py-1 text-xs font-semibold"
            >
              {satellite ? "Satellite" : "Street"}
            </button>
            <button
              type="button"
              onClick={() => setShowHighOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                showHighOnly ? "bg-[rgba(232,192,64,0.35)] text-[var(--nashik-text)]" : "nashik-chip"
              }`}
            >
              High only
            </button>
            <button
              type="button"
              onClick={() => setShowZones((v) => !v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                showZones ? "bg-[rgba(232,192,64,0.35)] text-[var(--nashik-text)]" : "nashik-chip"
              }`}
            >
              Zones
            </button>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-2 text-sm nashik-subtitle md:grid-cols-3">
          <p>Total complaints: <span className="font-semibold">{summary.total}</span></p>
          <p>High priority: <span className="font-semibold">{summary.high}</span></p>
          <p>Zones: <span className="font-semibold">{GEOFENCES.map((z) => z.name).join(", ")}</span></p>
        </div>

        <div className="h-[520px] overflow-hidden rounded-xl border border-[var(--nashik-border)]">
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
