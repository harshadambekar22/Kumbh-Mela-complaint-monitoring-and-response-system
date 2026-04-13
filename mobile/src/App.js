import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AuthScreen from "./screens/AuthScreen";
import DashboardScreen from "./screens/DashboardScreen";
import MapScreen from "./screens/MapScreen";
import TasksScreen from "./screens/TasksScreen";
import { getAnalyticsSummary, getComplaints, login, register, updateComplaintStatus, warmUpServer } from "./api";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const AUTO_REFRESH_MS = 20000;

const TAB_ICON = {
  Dashboard: "home",
  Map: "map",
  Tasks: "list",
  Profile: "person",
};

function HomeTabs({ user, onLogout, complaints, analytics, onStatusUpdate, refreshData }) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#fff7ed" },
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: "#ea580c",
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: { height: 66, paddingBottom: 8, paddingTop: 8, backgroundColor: "#fff", borderTopColor: "#fed7aa" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
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
        children={() => <DashboardScreen complaints={complaints} analytics={analytics} />}
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
          <View style={styles.profileContainer}>
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
              <Text style={styles.profileRole}>{user?.role}</Text>

              <View style={styles.quickRow}>
                <View style={styles.quickChip}><Text style={styles.quickChipText}>Secure Login</Text></View>
                <View style={styles.quickChip}><Text style={styles.quickChipText}>Live Sync</Text></View>
                <View style={styles.quickChip}><Text style={styles.quickChipText}>AI Routed</Text></View>
              </View>

              <Pressable onPress={onLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          </View>
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
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
              />
            )}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  profileContainer: { flex: 1, backgroundColor: "#fff7ed", padding: 16 },
  profileTopBanner: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#0f172a",
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 14,
  },
  profileTopTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  profileTopSub: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },
  profileCard: {
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fed7aa",
    padding: 18,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#fed7aa",
  },
  profileName: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  profileEmail: { marginTop: 6, color: "#475569" },
  profileRole: { marginTop: 4, color: "#64748b", textTransform: "uppercase", fontSize: 12 },
  quickRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 12 },
  quickChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#fdba74",
    backgroundColor: "#fff7ed",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quickChipText: { color: "#9a3412", fontSize: 11, fontWeight: "700" },
  logoutBtn: { marginTop: 18, backgroundColor: "#0f172a", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  logoutText: { color: "#fff", fontWeight: "700" },
  refreshBtn: {
    marginRight: 10,
    backgroundColor: "#ea580c",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  refreshText: { color: "white", fontSize: 12, fontWeight: "700" },
  tabIconWrap: {
    width: 34,
    height: 26,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: { backgroundColor: "#ffedd5" },
});
