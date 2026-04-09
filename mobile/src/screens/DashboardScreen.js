import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, ImageBackground } from "react-native";
import StatCard from "../components/StatCard";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1524492449090-1f0f25c00b7b?auto=format&fit=crop&w=1400&q=80";

export default function DashboardScreen({ complaints, analytics }) {
  const stats = useMemo(() => {
    const total = complaints.length;
    const high = complaints.filter((c) => c.priority === "high").length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const inProgress = complaints.filter((c) => c.status === "in-progress").length;
    return { total, high, resolved, inProgress };
  }, [complaints]);

  return (
    <FlatList
      data={analytics?.departmentPerformance || []}
      keyExtractor={(item) => item.department}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.hero} imageStyle={styles.heroImage}>
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Kumbh Command Center</Text>
              <Text style={styles.heroSubtitle}>Live complaint monitoring and action console</Text>
            </View>
          </ImageBackground>

          <View style={styles.statsGrid}>
            <StatCard title="Total" value={stats.total} />
            <StatCard title="High" value={stats.high} color="#dc2626" />
            <StatCard title="Resolved" value={stats.resolved} color="#059669" />
            <StatCard title="In Progress" value={stats.inProgress} color="#d97706" />
          </View>

          <Text style={styles.sectionTitle}>Department Performance</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.rowCard}>
          <Text style={styles.depName}>{item.department}</Text>
          <Text style={styles.depText}>Total: {item.total}</Text>
          <Text style={styles.depText}>Resolved: {item.resolved}</Text>
          <Text style={styles.depText}>Resolution Rate: {item.resolutionRate}%</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, backgroundColor: "#f8fafc", paddingBottom: 90 },
  hero: { height: 160, borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  heroImage: { borderRadius: 16 },
  heroOverlay: { flex: 1, justifyContent: "flex-end", padding: 12, backgroundColor: "rgba(2,6,23,0.35)" },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroSubtitle: { color: "#e2e8f0", fontSize: 12 },
  statsGrid: { gap: 10 },
  sectionTitle: { fontWeight: "700", color: "#0f172a", marginTop: 14, marginBottom: 8 },
  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  depName: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  depText: { color: "#475569", fontSize: 12 },
});
