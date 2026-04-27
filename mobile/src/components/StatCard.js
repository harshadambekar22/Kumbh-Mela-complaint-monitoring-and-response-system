import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radii, shadows } from "../theme/tokens";

export default function StatCard({ title, value, color = colors.text }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <View style={styles.pulseLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  title: { fontSize: 12, color: colors.textDim, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.7 },
  value: { fontSize: 26, fontWeight: "800" },
  pulseLine: {
    marginTop: 10,
    height: 4,
    borderRadius: 4,
    width: "72%",
    backgroundColor: colors.gold,
  },
});
