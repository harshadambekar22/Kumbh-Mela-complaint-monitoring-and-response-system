import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";

const NEXT_STATUS = {
  new: "assigned",
  assigned: "in-progress",
  "in-progress": "resolved",
  resolved: "resolved",
};

const statusColor = {
  new: "#94a3b8",
  assigned: "#3b82f6",
  "in-progress": "#a855f7",
  resolved: "#10b981",
};

export default function TasksScreen({ complaints, onStatusUpdate }) {
  return (
    <FlatList
      data={complaints}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.rowTop}>
            <Text style={styles.text} numberOfLines={2}>{item.text}</Text>
            <View style={[styles.badge, { backgroundColor: `${statusColor[item.status] || "#64748b"}22` }]}>
              <Text style={[styles.badgeText, { color: statusColor[item.status] || "#64748b" }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.meta}>{item.locationName} • {item.category}</Text>
          <Text style={styles.meta}>Priority: {item.priority}</Text>
          <Pressable style={styles.button} onPress={() => onStatusUpdate(item._id, NEXT_STATUS[item.status] || "resolved")}>
            <Text style={styles.buttonText}>Move to {NEXT_STATUS[item.status] || "resolved"}</Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={<Text style={{ color: "#64748b", padding: 16 }}>No complaints yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, backgroundColor: "#f8fafc", paddingBottom: 90 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  text: { fontWeight: "700", color: "#0f172a", flex: 1 },
  meta: { fontSize: 12, color: "#475569", marginTop: 4 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  button: {
    marginTop: 10,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
