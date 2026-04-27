import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { View, Text, Pressable, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import MapScreen from "./screens/MapScreen";
import TasksScreen from "./screens/TasksScreen";
import { getAnalyticsSummary, getComplaints, login, register, updateComplaintStatus, warmUpServer } from "./api";
import { colors, radii, shadows } from "./theme/tokens";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const AUTO_REFRESH_MS = 20000;

const TAB_ICON = {
  Dashboard: "home",
  Map: "map",
  Tasks: "list",
  Profile: "person",
};

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.crashWrap}>
          <Text style={styles.crashTitle}>Something went wrong</Text>
          <Text style={styles.crashText}>Please close and reopen the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function HomeTabs({ user, onLogout, complaints, analytics, onStatusUpdate, refreshData, refreshing }) {
  const { width } = useWindowDimensions();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bgSoft },
        headerTitleStyle: { fontWeight: "700", color: colors.gold },
        headerTintColor: colors.gold,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: { height: width < 360 ? 62 : 66, paddingBottom: 8, paddingTop: 8, backgroundColor: colors.bgSoft, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size, focused }) => (
          <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
            <Ionicons
              name={focused ? TAB_ICON[route.name] : `${TAB_ICON[route.name]}-outline`}
              size={size}
              color={color}
            />
          </View>
        ),
      })}
    >
      <Tabs.Screen
        name="Dashboard"
        children={() => <DashboardScreen complaints={complaints} analytics={analytics} loading={refreshing && !analytics} />}
        options={{
          headerRight: () => (
            <Pressable onPress={refreshData} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={14} color="#fff" />
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="Map" children={() => <MapScreen complaints={complaints} />} />
      <Tabs.Screen name="Tasks" children={() => <TasksScreen complaints={complaints} onStatusUpdate={onStatusUpdate} />} />
      <Tabs.Screen
        name="Profile"
        children={() => (
          <ScrollView contentContainerStyle={styles.profileContainer}>
            <View style={styles.profileTopBanner}>
              <Text style={styles.profileTopTitle}>Field Operations Profile</Text>
              <Text style={styles.profileTopSub}>Realtime command access and rapid response controls</Text>
            </View>
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={34} color="#ea580c" />
              </View>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileRole}>{String(user?.role || "").split("_").join(" ").toUpperCase()}</Text>

              <View style={styles.quickRow}>
                <View style={styles.quickChip}><Text style={styles.quickChipText}>Secure Login</Text></View>
                <View style={styles.quickChip}><Text style={styles.quickChipText}>Live Sync</Text></View>
                <View style={styles.quickChip}><Text style={styles.quickChipText}>AI Routed</Text></View>
              </View>

              <Pressable onPress={onLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      />
    </Tabs.Navigator>
  );
}

export default function App() {
  const [auth, setAuth] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [list, summary] = await Promise.all([getComplaints({ limit: 200 }), getAnalyticsSummary()]);
      setComplaints(list.items || []);
      setAnalytics(summary);
    } catch (_error) {
      // Keep current UI state; transient network failures should not break navigation.
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = await AsyncStorage.getItem("mobile_auth_token");
      const userRaw = await AsyncStorage.getItem("mobile_auth_user");
      if (token && userRaw) {
        setAuth({ token, user: JSON.parse(userRaw) });
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (!auth) return;
    refreshData();
    const timer = setInterval(refreshData, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [auth]);

  const onLogin = async (email, password) => {
    setAuthBusy(true);
    try {
      await warmUpServer();
      const data = await login(email, password);
      await AsyncStorage.setItem("mobile_auth_token", data.token);
      await AsyncStorage.setItem("mobile_auth_user", JSON.stringify(data.user));
      setAuth({ token: data.token, user: data.user });
    } finally {
      setAuthBusy(false);
    }
  };

  const onRegister = async (payload) => {
    setAuthBusy(true);
    try {
      await warmUpServer();
      await register(payload);
    } finally {
      setAuthBusy(false);
    }
  };

  const onLogout = async () => {
    await AsyncStorage.multiRemove(["mobile_auth_token", "mobile_auth_user"]);
    setAuth(null);
  };

  const onStatusUpdate = async (id, status) => {
    await updateComplaintStatus(id, status);
    await refreshData();
  };

  return (
    <AppErrorBoundary>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
          {!auth ? (
            <Stack.Screen name="Auth" children={() => <AuthScreen onLogin={onLogin} onRegister={onRegister} busy={authBusy} />} />
          ) : (
            <Stack.Screen
              name="Home"
              children={() => (
                <HomeTabs
                  user={auth.user}
                  onLogout={onLogout}
                  complaints={complaints}
                  analytics={analytics}
                  onStatusUpdate={onStatusUpdate}
                  refreshData={refreshData}
                refreshing={refreshing}
                />
              )}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  profileContainer: { flexGrow: 1, backgroundColor: colors.bg, padding: 16, paddingBottom: 110 },
  profileTopBanner: {
    marginTop: 16,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  profileTopTitle: { color: colors.gold, fontSize: 16, fontWeight: "800" },
  profileTopSub: { color: colors.text, fontSize: 12, marginTop: 4 },
  profileCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    alignItems: "center",
    ...shadows.card,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  profileName: { fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center", width: "100%" },
  profileEmail: { marginTop: 6, color: colors.textDim, textAlign: "center", width: "100%", flexWrap: "wrap" },
  profileRole: { marginTop: 4, color: colors.textDim, fontSize: 12, textAlign: "center", width: "100%" },
  quickRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 12 },
  quickChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(232,192,64,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickChipText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  logoutBtn: { marginTop: 18, backgroundColor: "rgba(232,192,64,0.9)", borderRadius: radii.sm, paddingHorizontal: 18, paddingVertical: 10 },
  logoutText: { color: "#13210d", fontWeight: "700" },
  refreshBtn: {
    marginRight: 10,
    backgroundColor: "rgba(232,192,64,0.85)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshText: { color: "#13210d", fontSize: 12, fontWeight: "700" },
  tabIconWrap: {
    width: 34,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: { backgroundColor: "rgba(232,192,64,0.22)" },
  crashWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: 24 },
  crashTitle: { fontSize: 22, fontWeight: "800", color: colors.gold, marginBottom: 8, textAlign: "center" },
  crashText: { fontSize: 14, color: colors.textDim, textAlign: "center" },
});
