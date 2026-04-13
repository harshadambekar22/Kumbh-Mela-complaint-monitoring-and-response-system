import React, { useMemo, useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { WebView } from "react-native-webview";

const GEOFENCES = [
  { id: "panchavati", name: "Panchavati", latitude: 20.0102, longitude: 73.7987, radius: 800 },
  { id: "ramkund", name: "Ramkund", latitude: 20.0059, longitude: 73.7924, radius: 700 },
  { id: "tentcity", name: "Tent City", latitude: 19.9925, longitude: 73.7831, radius: 900 },
];

export default function MapScreen({ complaints }) {
  const [satellite, setSatellite] = useState(true);
  const [showHighOnly, setShowHighOnly] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const complaintRows = Array.isArray(complaints) ? complaints : [];
  const validComplaints = useMemo(
    () =>
      complaintRows.filter((c) => {
        const lat = Number(c?.latitude);
        const lng = Number(c?.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [complaintRows]
  );

  const filteredComplaints = useMemo(
    () => (showHighOnly ? validComplaints.filter((x) => x.priority === "high") : validComplaints),
    [showHighOnly, validComplaints]
  );

  const summary = useMemo(() => ({
    total: filteredComplaints.length,
    high: validComplaints.filter((x) => x.priority === "high").length,
  }), [filteredComplaints, validComplaints]);

  const mapHtml = useMemo(() => {
    const markers = filteredComplaints.map((c) => ({
      lat: Number(c.latitude),
      lng: Number(c.longitude),
      label: `${c.category || "issue"} - ${c.status || "new"}`,
      color: c.priority === "high" ? "#dc2626" : c.priority === "medium" ? "#d97706" : "#16a34a",
    }));
    const tile = satellite
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    html,body,#map{height:100%;margin:0;padding:0;}
    .leaflet-container{font:12px sans-serif;}
    .legend {
      position: absolute; right: 10px; top: 10px; z-index: 999;
      background: rgba(15,23,42,0.88); color: #fff; border-radius: 10px; padding: 8px;
      min-width: 120px; font-size: 11px;
    }
    .dot { display:inline-block; width:8px; height:8px; border-radius:999px; margin-right:6px; }
    .leaflet-control-attribution { display: none !important; }
  </style>
</head>
<body>
  <div class="legend">
    <div style="font-weight:700;margin-bottom:6px;">Priority legend</div>
    <div><span class="dot" style="background:#dc2626"></span>High</div>
    <div><span class="dot" style="background:#d97706"></span>Medium</div>
    <div><span class="dot" style="background:#16a34a"></span>Low</div>
  </div>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([19.9975, 73.7898], 13);
    L.tileLayer('${tile}', { maxZoom: 20, detectRetina: true }).addTo(map);
    const zones = ${JSON.stringify(GEOFENCES)};
    const showZones = ${showZones ? "true" : "false"};
    if (showZones) {
      zones.forEach(z => {
        L.circle([z.latitude, z.longitude], { radius: z.radius, color: '#f97316', fillColor: '#fb923c', fillOpacity: 0.15 }).addTo(map);
      });
    }
    const markers = ${JSON.stringify(markers)};
    markers.forEach(m => {
      const marker = L.circleMarker([m.lat, m.lng], { radius: 7, color: m.color, fillColor: m.color, fillOpacity: 0.85 });
      marker.bindPopup(m.label);
      marker.addTo(map);
    });
  </script>
</body>
</html>`;
  }, [filteredComplaints, satellite, showZones]);

  return (
    <View style={styles.container}>
      <WebView source={{ html: mapHtml }} style={styles.map} originWhitelist={["*"]} />

      <View style={styles.summaryCard}>
        <View style={styles.topRow}>
          <Text style={styles.summaryTitle}>Live Map Summary</Text>
          <View style={styles.controlsRow}>
            <Pressable style={styles.modeBtn} onPress={() => setSatellite((v) => !v)}>
              <Text style={styles.modeBtnText}>{satellite ? "Satellite" : "Street"}</Text>
            </Pressable>
            <Pressable style={[styles.modeBtn, showHighOnly && styles.modeBtnActive]} onPress={() => setShowHighOnly((v) => !v)}>
              <Text style={styles.modeBtnText}>High only</Text>
            </Pressable>
            <Pressable style={[styles.modeBtn, showZones && styles.modeBtnActive]} onPress={() => setShowZones((v) => !v)}>
              <Text style={styles.modeBtnText}>Zones</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.summaryText}>Total complaints: {summary.total}</Text>
        <Text style={styles.summaryText}>High priority: {summary.high}</Text>
        <Text style={styles.summaryText}>Zones: {GEOFENCES.map((z) => z.name).join(", ")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  map: { flex: 1 },
  summaryCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 18,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  topRow: { marginBottom: 6 },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  modeBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeBtnActive: { backgroundColor: "#c2410c" },
  modeBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  summaryText: { fontSize: 12, color: "#475569" },
});
