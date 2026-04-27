import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ImageBackground, ScrollView, useWindowDimensions, Animated, Image } from "react-native";
import StatCard from "../components/StatCard";

const HERO_IMAGES = [
  require("../../assets/hero-1.jpg"),
  require("../../assets/hero-2.jpg"),
  require("../../assets/hero-3.jpg"),
];

export default function DashboardScreen({ complaints, analytics, loading = false }) {
  const { width } = useWindowDimensions();
  const slideWidth = Math.max(280, width - 28);
  const scrollRef = useRef(null);
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const [slideIndex, setSlideIndex] = useState(0);
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [entranceAnim]);

  useEffect(() => {
    HERO_IMAGES.forEach((img) => {
      if (typeof img === "string") {
        Image.prefetch(img).catch(() => null);
      }
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => {
        const next = (prev + 1) % HERO_IMAGES.length;
        scrollRef.current?.scrollTo({ x: next * slideWidth, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [slideWidth]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const high = complaints.filter((c) => c.priority === "high").length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const inProgress = complaints.filter((c) => c.status === "in-progress").length;
    return { total, high, resolved, inProgress };
  }, [complaints]);

  return (
    <Animated.View style={{ flex: 1, opacity: entranceAnim, transform: [{ translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            snapToInterval={slideWidth}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
              setSlideIndex(idx);
            }}
          >
            {HERO_IMAGES.map((uri) => (
              <ImageBackground
                key={String(uri)}
                source={heroImageFailed ? require("../../assets/kumbh-login-fallback.png") : uri}
                onError={() => setHeroImageFailed(true)}
                style={[styles.hero, { width: slideWidth, height: Math.max(180, width * 0.48) }]}
                imageStyle={styles.heroImage}
              >
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

        <Text style={styles.sectionTitle}>Department Performance</Text>
        {(analytics?.departmentPerformance || []).length === 0 ? (
          <View style={styles.rowCard}>
            <Text style={styles.depHint}>No department data yet. Add/ingest complaints to populate this section.</Text>
          </View>
        ) : (
          (analytics?.departmentPerformance || []).map((item) => (
            <View key={item.department} style={styles.rowCard}>
              <View style={styles.depTopRow}>
                <Text style={styles.depName}>{item.department}</Text>
                <View style={[styles.rateBadge, item.resolutionRate >= 75 ? styles.rateGood : item.resolutionRate >= 45 ? styles.rateMedium : styles.rateLow]}>
                  <Text style={styles.rateBadgeText}>{item.resolutionRate}%</Text>
                </View>
              </View>

              <View style={styles.depStatsRow}>
                <View style={styles.depStatItem}>
                  <Text style={styles.depStatLabel}>Total</Text>
                  <Text style={styles.depStatValue}>{item.total}</Text>
                </View>
                <View style={styles.depStatItem}>
                  <Text style={styles.depStatLabel}>Resolved</Text>
                  <Text style={styles.depStatValue}>{item.resolved}</Text>
                </View>
                <View style={styles.depStatItem}>
                  <Text style={styles.depStatLabel}>Pending</Text>
                  <Text style={styles.depStatValue}>{Math.max(0, (item.total || 0) - (item.resolved || 0))}</Text>
                </View>
              </View>

              <View style={styles.depProgressTrack}>
                <View style={[styles.depProgressFill, { width: `${Math.max(0, Math.min(100, Number(item.resolutionRate) || 0))}%` }]} />
              </View>
              <Text style={styles.depHint}>Resolution progress</Text>
            </View>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, backgroundColor: "#f8fafc", paddingBottom: 90 },
  hero: { borderRadius: 16, overflow: "hidden", marginBottom: 6, marginRight: 0 },
  heroImage: { borderRadius: 16, resizeMode: "cover" },
  heroOverlay: { flex: 1, justifyContent: "flex-end", padding: 12, backgroundColor: "rgba(2,6,23,0.4)" },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroSubtitle: { color: "#e2e8f0", fontSize: 12 },
  dotsWrap: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#cbd5e1" },
  dotActive: { width: 18, backgroundColor: "#f97316" },
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
  depTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  depName: { fontSize: 14, fontWeight: "700", color: "#0f172a", flex: 1, marginRight: 10 },
  rateBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  rateGood: { backgroundColor: "#dcfce7" },
  rateMedium: { backgroundColor: "#fef3c7" },
  rateLow: { backgroundColor: "#fee2e2" },
  rateBadgeText: { fontSize: 11, fontWeight: "800", color: "#0f172a" },
  depStatsRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  depStatItem: { flex: 1, borderRadius: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", paddingVertical: 7, alignItems: "center" },
  depStatLabel: { fontSize: 11, color: "#64748b", marginBottom: 2 },
  depStatValue: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  depProgressTrack: { height: 8, borderRadius: 999, backgroundColor: "#e2e8f0", overflow: "hidden" },
  depProgressFill: { height: "100%", backgroundColor: "#f97316", borderRadius: 999 },
  depHint: { marginTop: 6, color: "#64748b", fontSize: 11 },
});
