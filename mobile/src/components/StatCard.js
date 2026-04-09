import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function StatCard({ title, value, color = "#0f172a" }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 12, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.7 },
  value: { fontSize: 26, fontWeight: "800" },
});
