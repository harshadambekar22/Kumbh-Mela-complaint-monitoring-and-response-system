import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from "react-native";
import { colors, motion, radii, shadows } from "../theme/tokens";

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
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: motion.normal,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const grouped = useMemo(() => {
    const list = Array.isArray(complaints) ? complaints : [];
    return columns.reduce((acc, c) => {
      acc[c.key] = list.filter((x) => x.status === c.key);
      return acc;
    }, {});
  }, [complaints]);

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.container}
      style={{ opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}
    >
      <Text style={styles.title}>Task Board</Text>
      <Text style={styles.sub}>Manage live complaints by workflow stage.</Text>
      {columns.map((column, columnIndex) => (
        <Animated.View
          key={column.key}
          style={[
            styles.column,
            {
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12 + columnIndex * 3, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.columnTitle}>{column.label}</Text>
          {(grouped[column.key] || []).slice(0, 20).map((item) => (
            <Animated.View key={item._id} style={styles.card}>
              <Text style={styles.cardText} numberOfLines={2}>{item.text || "No complaint text"}</Text>
              <Text style={styles.meta}>{item.locationName || "Unknown location"}</Text>
              <Text style={styles.meta}>Priority: {item.priority || "low"}</Text>
              {nextStatus[item.status] ? (
                <Pressable
                  onPress={() => onStatusUpdate?.(item._id, nextStatus[item.status])}
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                >
                  <Text style={styles.actionText}>Move to {nextStatus[item.status]}</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          ))}
          {(grouped[column.key] || []).length === 0 ? <Text style={styles.empty}>No complaints in this stage.</Text> : null}
        </Animated.View>
      ))}
    </Animated.ScrollView>
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
  actionPressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
  actionText: { color: "#13210d", fontWeight: "700", fontSize: 11 },
  empty: { color: colors.textDim, fontSize: 12, fontStyle: "italic" },
});
