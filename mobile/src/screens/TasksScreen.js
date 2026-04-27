import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { colors, radii, shadows } from "../theme/tokens";

const columns = [
  { key: "new", label: "New" },
  { key: "assigned", label: "Assigned" },
  { key: "in-progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

const nextStatus = {
  new: "assigned",
  assigned: "in-progress",
  "in-progress": "resolved",
};

export default function TasksScreen({ complaints, onStatusUpdate }) {
  const grouped = useMemo(() => {
    const list = Array.isArray(complaints) ? complaints : [];
    return columns.reduce((acc, c) => {
      acc[c.key] = list.filter((x) => x.status === c.key);
      return acc;
    }, {});
  }, [complaints]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Task Board</Text>
      <Text style={styles.sub}>Manage live complaints by workflow stage.</Text>
      {columns.map((column) => (
        <View key={column.key} style={styles.column}>
          <Text style={styles.columnTitle}>{column.label}</Text>
          {(grouped[column.key] || []).slice(0, 20).map((item) => (
            <View key={item._id} style={styles.card}>
              <Text style={styles.cardText} numberOfLines={2}>{item.text || "No complaint text"}</Text>
              <Text style={styles.meta}>{item.locationName || "Unknown location"}</Text>
              <Text style={styles.meta}>Priority: {item.priority || "low"}</Text>
              {nextStatus[item.status] ? (
                <Pressable onPress={() => onStatusUpdate?.(item._id, nextStatus[item.status])} style={styles.action}>
                  <Text style={styles.actionText}>Move to {nextStatus[item.status]}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {(grouped[column.key] || []).length === 0 ? <Text style={styles.empty}>No complaints in this stage.</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, backgroundColor: colors.bg, paddingBottom: 100 },
  title: { color: colors.gold, fontWeight: "800", fontSize: 20 },
  sub: { color: colors.textDim, marginTop: 2, marginBottom: 10 },
  column: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: 10,
    marginBottom: 10,
    ...shadows.card,
  },
  columnTitle: { color: colors.text, fontWeight: "700", marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    marginBottom: 8,
  },
  cardText: { color: colors.text, fontSize: 13, marginBottom: 4 },
  meta: { color: colors.textDim, fontSize: 11 },
  action: {
    marginTop: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(232,192,64,0.85)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: { color: "#13210d", fontWeight: "700", fontSize: 11 },
  empty: { color: colors.textDim, fontSize: 12, fontStyle: "italic" },
});
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
      ListHeaderComponent={
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Complaint Workflow Desk</Text>
          <Text style={styles.headerSub}>Review, triage, and push complaints through status stages.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.rowTop}>
            <Text style={styles.text} numberOfLines={2}>{item.text}</Text>
            <View style={[styles.badge, { backgroundColor: `${statusColor[item.status] || "#64748b"}22` }]}>
              <Text style={[styles.badgeText, { color: statusColor[item.status] || "#64748b" }]}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{item.locationName || "Unknown location"}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>{item.category || "general"}</Text>
          </View>
          <View style={styles.priorityChip}>
            <Text style={styles.priorityText}>Priority: {item.priority || "medium"}</Text>
          </View>
          <Pressable style={styles.button} onPress={() => onStatusUpdate(item._id, NEXT_STATUS[item.status] || "resolved")}>
            <Text style={styles.buttonText}>Move to {NEXT_STATUS[item.status] || "resolved"}</Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No complaints yet</Text>
          <Text style={styles.emptySub}>Incoming items from ingestion and operators will appear here.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, backgroundColor: "#f8fafc", paddingBottom: 90, gap: 10 },
  headerCard: {
    borderRadius: 14,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    marginBottom: 4,
  },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 14 },
  headerSub: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  text: { fontWeight: "700", color: "#0f172a", flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  meta: { fontSize: 12, color: "#475569", marginTop: 4 },
  dot: { marginHorizontal: 4, color: "#94a3b8" },
  priorityChip: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fdba74",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  priorityText: { fontSize: 11, color: "#9a3412", fontWeight: "700" },
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
  emptyCard: { borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", padding: 16 },
  emptyTitle: { color: "#0f172a", fontWeight: "800", marginBottom: 3 },
  emptySub: { color: "#64748b", fontSize: 12 },
});
