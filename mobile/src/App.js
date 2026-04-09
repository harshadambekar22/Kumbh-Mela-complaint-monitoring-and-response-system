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
import { getAnalyticsSummary, getComplaints, login, register, updateComplaintStatus } from "./api";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

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
        tabBarStyle: {
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          position: "absolute",
          backgroundColor: "#ffffff",
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? TAB_ICON[route.name] : `${TAB_ICON[route.name]}-outline`}
            size={size}
            color={color}
          />
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
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={34} color="#ea580c" />
            </View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileRole}>{user?.role}</Text>
            <Pressable onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
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

  const refreshData = async () => {
    const [list, summary] = await Promise.all([getComplaints({ limit: 200 }), getAnalyticsSummary()]);
    setComplaints(list.items || []);
    setAnalytics(summary);
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
    const timer = setInterval(refreshData, 10000);
    return () => clearInterval(timer);
  }, [auth]);

  const onLogin = async (email, password) => {
    const data = await login(email, password);
    await AsyncStorage.setItem("mobile_auth_token", data.token);
    await AsyncStorage.setItem("mobile_auth_user", JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
  };

  const onRegister = async (payload) => {
    await register(payload);
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
          <Stack.Screen name="Auth" children={() => <AuthScreen onLogin={onLogin} onRegister={onRegister} />} />
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
  profileContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff7ed", padding: 16 },
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
});
