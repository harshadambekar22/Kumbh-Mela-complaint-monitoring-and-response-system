import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, ImageBackground, ScrollView, Dimensions, Pressable } from "react-native";
import StatCard from "../components/StatCard";

const { width } = Dimensions.get("window");
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1524492449090-1f0f25c00b7b?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1400&q=80",
];
const PHOTO_STRIP = [
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1200&q=80",
];

export default function DashboardScreen({ complaints, analytics }) {
  const scrollRef = useRef(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => {
        const next = (prev + 1) % HERO_IMAGES.length;
        scrollRef.current?.scrollTo({ x: next * (width - 28), animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const total = complaints.length;
    const high = complaints.filter((c) => c.priority === "high").length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const inProgress = complaints.filter((c) => c.status === "in-progress").length;
    return { total, high, resolved, inProgress };
  }, [complaints]);

  const aiPrediction = useMemo(() => {
    const unresolved = complaints.filter((c) => c.status !== "resolved");
    const high = unresolved.filter((c) => c.priority === "high").length;
    const traffic = unresolved.filter((c) => c.category === "traffic").length;
    const likelyNextHour = Math.max(1, Math.round(unresolved.length * 0.18 + high * 0.4));
    const riskLevel = high >= 5 ? "High" : high >= 2 ? "Medium" : "Low";
    const advisory =
      traffic > 0
        ? "Traffic flow may degrade near Ramkund and Panchavati in next 60 min."
        : "No major traffic spike predicted. Keep monitoring medical and sanitation streams.";
    return { likelyNextHour, riskLevel, advisory };
  }, [complaints]);

  const responseMomentum = useMemo(() => {
    const unresolved = complaints.filter((c) => c.status !== "resolved").length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const score = Math.max(10, Math.min(98, Math.round((resolved / Math.max(1, unresolved + resolved)) * 100)));
    return { score, unresolved };
  }, [complaints]);

  return (
    <FlatList
      data={analytics?.departmentPerformance || []}
      keyExtractor={(item) => item.department}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <View>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 28));
                setSlideIndex(idx);
              }}
            >
              {HERO_IMAGES.map((uri) => (
                <ImageBackground key={uri} source={{ uri }} style={styles.hero} imageStyle={styles.heroImage}>
                  <View style={styles.heroOverlay}>
                    <Text style={styles.heroTitle}>Kumbh Command Center</Text>
                    <Text style={styles.heroSubtitle}>Live complaint monitoring and action console</Text>
                  </View>
                </ImageBackground>
              ))}
            </ScrollView>
            <View style={styles.dotsWrap}>
              {HERO_IMAGES.map((_, idx) => (
                <View key={idx} style={[styles.dot, idx === slideIndex && styles.dotActive]} />
              ))}
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard title="Total" value={stats.total} />
            <StatCard title="High" value={stats.high} color="#dc2626" />
            <StatCard title="Resolved" value={stats.resolved} color="#059669" />
            <StatCard title="In Progress" value={stats.inProgress} color="#d97706" />
          </View>

          <View style={styles.predictionCard}>
            <Text style={styles.predictionTitle}>AI Prediction (Next 60 min)</Text>
            <Text style={styles.predictionKpi}>Expected new complaints: {aiPrediction.likelyNextHour}</Text>
            <Text style={styles.predictionMeta}>Operational risk: {aiPrediction.riskLevel}</Text>
            <Text style={styles.predictionMeta}>{aiPrediction.advisory}</Text>
            <View style={styles.featureRow}>
              <Pressable style={styles.featureChip}>
                <Text style={styles.featureChipText}>SLA Watch</Text>
              </Pressable>
              <Pressable style={styles.featureChip}>
                <Text style={styles.featureChipText}>Crowd Heat</Text>
              </Pressable>
              <Pressable style={styles.featureChip}>
                <Text style={styles.featureChipText}>Escalation</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.momentumCard}>
            <Text style={styles.momentumTitle}>Response Momentum</Text>
            <View style={styles.momentumTrack}>
              <View style={[styles.momentumFill, { width: `${responseMomentum.score}%` }]} />
            </View>
            <Text style={styles.momentumMeta}>
              Efficiency score: {responseMomentum.score}% • Active unresolved: {responseMomentum.unresolved}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Kumbh Moments</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripWrap}>
            {PHOTO_STRIP.map((uri) => (
              <ImageBackground key={uri} source={{ uri }} style={styles.stripCard} imageStyle={styles.stripImage}>
                <View style={styles.stripOverlay}>
                  <Text style={styles.stripText}>Live crowd watch</Text>
                </View>
              </ImageBackground>
            ))}
          </ScrollView>

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
  hero: { height: 180, width: width - 28, borderRadius: 16, overflow: "hidden", marginBottom: 6, marginRight: 8 },
  heroImage: { borderRadius: 16 },
  heroOverlay: { flex: 1, justifyContent: "flex-end", padding: 12, backgroundColor: "rgba(2,6,23,0.4)" },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroSubtitle: { color: "#e2e8f0", fontSize: 12 },
  dotsWrap: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#cbd5e1" },
  dotActive: { width: 18, backgroundColor: "#f97316" },
  statsGrid: { gap: 10 },
  predictionCard: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
  },
  momentumCard: {
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    backgroundColor: "#eef2ff",
  },
  momentumTitle: { fontSize: 13, fontWeight: "800", color: "#312e81", marginBottom: 8 },
  momentumTrack: { height: 10, backgroundColor: "#c7d2fe", borderRadius: 999, overflow: "hidden" },
  momentumFill: { height: "100%", backgroundColor: "#6366f1", borderRadius: 999 },
  momentumMeta: { marginTop: 7, fontSize: 12, color: "#475569" },
  predictionTitle: { fontSize: 13, fontWeight: "800", color: "#9a3412", marginBottom: 4 },
  predictionKpi: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 3 },
  predictionMeta: { fontSize: 12, color: "#475569" },
  featureRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  featureChip: {
    backgroundColor: "#ffedd5",
    borderColor: "#fdba74",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featureChipText: { color: "#9a3412", fontSize: 11, fontWeight: "700" },
  stripWrap: { paddingBottom: 4, gap: 8 },
  stripCard: { width: 170, height: 90, borderRadius: 12, overflow: "hidden" },
  stripImage: { borderRadius: 12 },
  stripOverlay: { flex: 1, justifyContent: "flex-end", padding: 8, backgroundColor: "rgba(15,23,42,0.25)" },
  stripText: { color: "#fff", fontSize: 11, fontWeight: "700" },
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
