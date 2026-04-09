import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";

const REGION = {
  latitude: 19.9975,
  longitude: 73.7898,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const GEOFENCES = [
  { id: "panchavati", name: "Panchavati", latitude: 20.0102, longitude: 73.7987, radius: 800 },
  { id: "ramkund", name: "Ramkund", latitude: 20.0059, longitude: 73.7924, radius: 700 },
  { id: "tentcity", name: "Tent City", latitude: 19.9925, longitude: 73.7831, radius: 900 },
];

export default function MapScreen({ complaints }) {
  const summary = useMemo(() => ({
    total: complaints.length,
    high: complaints.filter((x) => x.priority === "high").length,
  }), [complaints]);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={REGION}>
        {GEOFENCES.map((zone) => (
          <Circle
            key={zone.id}
            center={{ latitude: zone.latitude, longitude: zone.longitude }}
            radius={zone.radius}
            fillColor="rgba(249,115,22,0.12)"
            strokeColor="rgba(249,115,22,0.7)"
          />
        ))}
        {complaints.map((c) => (
          <Marker
            key={c._id}
            coordinate={{ latitude: c.latitude, longitude: c.longitude }}
            pinColor={c.priority === "high" ? "#dc2626" : c.priority === "medium" ? "#d97706" : "#16a34a"}
            title={`${c.category} • ${c.status}`}
            description={c.locationName}
          />
        ))}
      </MapView>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Live Map Summary</Text>
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
  summaryText: { fontSize: 12, color: "#475569" },
});
