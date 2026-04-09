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
