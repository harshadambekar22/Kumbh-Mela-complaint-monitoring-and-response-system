import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
  Image,
} from "react-native";

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1600&q=80",
];

export default function AuthScreen({ onLogin, onRegister, busy = false }) {
  const { width, height } = useWindowDimensions();
  const [bgIdx, setBgIdx] = useState(0);
  const [bgFailed, setBgFailed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0.25,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setBgIdx((prev) => (prev + 1) % BG_IMAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }).start();
      });
    }, 4200);
    return () => clearInterval(timer);
  }, [fadeAnim]);

  useEffect(() => {
    BG_IMAGES.forEach((img) => {
      if (typeof img === "string") {
        Image.prefetch(img).catch(() => null);
      }
    });
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
      setError(e?.response?.data?.message || e?.message || "Request failed");
    }
  };

  return (
    <View style={styles.bg}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
        <ImageBackground
          source={bgFailed ? require("../../assets/kumbh-login-fallback.png") : { uri: BG_IMAGES[bgIdx] }}
          onError={() => setBgFailed(true)}
          style={styles.bg}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      </Animated.View>

      <KeyboardAvoidingView style={styles.bg} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={24}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={[styles.container, { paddingHorizontal: Math.max(16, width * 0.05), minHeight: height }]} keyboardShouldPersistTaps="handled">
            <View style={[styles.infoBanner, { marginTop: Math.max(8, height * 0.03) }]}>
              <Text style={[styles.infoTitle, { fontSize: width < 360 ? 24 : 26 }]}>Kumbh Mela Response Grid</Text>
              <Text style={styles.infoSub}>AI-driven grievance intelligence for faster public service action.</Text>
            </View>
            <Animated.View style={[styles.card, { padding: width < 360 ? 14 : 18, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0.25, 1], outputRange: [8, 0] }) }] }]}>
              <Text style={[styles.title, { fontSize: width < 360 ? 18 : 22 }]}>Kumbh Complaint Mobile</Text>
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

              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed, busy && styles.buttonDisabled]}
                onPress={submit}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{mode === "login" ? "Login" : "Create Account"}</Text>}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
                onPress={() => setMode((m) => (m === "login" ? "register" : "login"))}
                disabled={busy}
              >
                <Text style={styles.secondaryText}>{mode === "login" ? "Create new account" : "Back to login"}</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.22)" },
  container: { flexGrow: 1, justifyContent: "center", paddingVertical: 16 },
  infoBanner: {
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 12,
    marginBottom: 12,
  },
  infoTitle: { color: "#fff", fontWeight: "800" },
  infoSub: { color: "#e2e8f0", fontSize: 12, marginTop: 3 },
  card: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#fdba74",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dotRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#cbd5e1" },
  dotActive: { width: 16, backgroundColor: "#f97316" },
  title: { fontWeight: "900", color: "#0f172a" },
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
  primaryPressed: { backgroundColor: "#c2410c" },
  buttonDisabled: { opacity: 0.7 },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryButton: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "#cbd5e1" },
  secondaryPressed: { backgroundColor: "#f8fafc" },
  secondaryText: { color: "#0f172a", fontWeight: "600" },
});
