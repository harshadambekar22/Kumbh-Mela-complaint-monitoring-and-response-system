import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function register(payload) {
  const { data } = await api.post("/api/auth/register", payload);
  return data;
}

export async function ingestPosts(posts) {
  const { data } = await api.post("/api/complaints/ingest", { posts });
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

export async function getAlerts() {
  const { data } = await api.get("/api/complaints/alerts");
  return data;
}

export async function updateComplaintStatus(id, status) {
  const { data } = await api.patch(`/api/complaints/${id}/status`, { status });
  return data;
}

export async function assignComplaint(id, assigneeId, assigneeName) {
  const { data } = await api.patch(`/api/complaints/${id}/assign`, { assigneeId, assigneeName });
  return data;
}

export async function addComment(id, text) {
  const { data } = await api.post(`/api/complaints/${id}/comments`, { text });
  return data;
}

export async function bulkUpdate(ids, patch) {
  const { data } = await api.patch("/api/complaints/bulk", { ids, patch });
  return data;
}

export async function reviewComplaint(id, payload) {
  const { data } = await api.post(`/api/complaints/${id}/review`, payload);
  return data;
}

export async function getSavedViews() {
  const { data } = await api.get("/api/complaints/saved-views");
  return data;
}

export async function createSavedView(name, filters) {
  const { data } = await api.post("/api/complaints/saved-views", { name, filters });
  return data;
}
