import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Default to deployed backend for Expo Go / APK reliability.
// Override with EXPO_PUBLIC_API_URL for LAN/Wi-Fi or custom environments.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://kumbh-backend-tlo1.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("mobile_auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function register(payload) {
  const { data } = await api.post("/api/auth/register", payload);
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function getComplaints(params = {}) {
  const { data } = await api.get("/api/complaints", { params });
  return data;
}

export async function getAnalyticsSummary() {
  const { data } = await api.get("/api/complaints/analytics/summary");
  return data;
}

export async function updateComplaintStatus(id, status) {
  const { data } = await api.patch(`/api/complaints/${id}/status`, { status });
  return data;
}

// Render free services can be asleep; a quick health call helps warm up before auth.
export async function warmUpServer() {
  try {
    await api.get("/health", { timeout: 12000 });
    return true;
  } catch (_error) {
    return false;
  }
}
