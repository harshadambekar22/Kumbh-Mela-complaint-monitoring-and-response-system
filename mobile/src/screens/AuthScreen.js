import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ImageBackground, ActivityIndicator } from "react-native";

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1524492449090-1f0f25c00b7b?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?auto=format&fit=crop&w=1400&q=80",
];

export default function AuthScreen({ onLogin, onRegister, busy = false }) {
  const [bgIdx, setBgIdx] = useState(0);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setBgIdx((prev) => (prev + 1) % BG_IMAGES.length), 3500);
    return () => clearInterval(timer);
  }, []);

  const submit = async () => {
    setError("");
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister({ name, email, password, role, department });
        setMode("login");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Request failed");
    }
  };

  return (
    <ImageBackground source={{ uri: BG_IMAGES[bgIdx] }} style={styles.bg}>
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Kumbh Complaint Mobile</Text>
          <Text style={styles.subtitle}>{mode === "login" ? "Sign in" : "Create account"}</Text>
          <View style={styles.dotRow}>
            {BG_IMAGES.map((_, idx) => (
              <View key={idx} style={[styles.dot, idx === bgIdx && styles.dotActive]} />
            ))}
          </View>

          {mode === "register" && (
            <>
              <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} placeholderTextColor="#64748b" />
              <View style={styles.roleWrap}>
                <Pressable
                  onPress={() => setRole("operator")}
                  style={[styles.roleChip, role === "operator" && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, role === "operator" && styles.roleChipTextActive]}>Operator</Text>
                </Pressable>
                <Pressable
                  onPress={() => setRole("department_officer")}
                  style={[styles.roleChip, role === "department_officer" && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, role === "department_officer" && styles.roleChipTextActive]}>Department Officer</Text>
                </Pressable>
              </View>
              <TextInput
                placeholder="Department (optional)"
                value={department}
                onChangeText={setDepartment}
                style={styles.input}
                placeholderTextColor="#64748b"
              />
            </>
          )}

          <TextInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" style={styles.input} placeholderTextColor="#64748b" />
          <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholderTextColor="#64748b" />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={[styles.primaryButton, busy && styles.buttonDisabled]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{mode === "login" ? "Login" : "Create Account"}</Text>}
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setMode((m) => (m === "login" ? "register" : "login"))} disabled={busy}>
            <Text style={styles.secondaryText}>{mode === "login" ? "Create new account" : "Back to login"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.45)" },
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fdba74",
  },
  dotRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#cbd5e1" },
  dotActive: { width: 16, backgroundColor: "#f97316" },
  title: { fontSize: 27, fontWeight: "900", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#475569", marginBottom: 14 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: "#0f172a",
  },
  roleWrap: { flexDirection: "row", gap: 8, marginBottom: 10 },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  roleChipActive: {
    backgroundColor: "#ffedd5",
    borderColor: "#fdba74",
  },
  roleChipText: { fontSize: 12, color: "#334155", fontWeight: "600" },
  roleChipTextActive: { color: "#9a3412" },
  error: { color: "#dc2626", marginBottom: 8 },
  primaryButton: { backgroundColor: "#ea580c", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.7 },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "#cbd5e1" },
  secondaryText: { color: "#0f172a", fontWeight: "600" },
});
