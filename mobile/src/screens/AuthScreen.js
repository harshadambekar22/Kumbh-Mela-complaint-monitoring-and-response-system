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
import { colors, motion, radii, shadows } from "../theme/tokens";

const BG_IMAGES = [
  "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1600&q=80",
];

export default function AuthScreen({ onLogin, onRegister, busy = false }) {
  const { width, height } = useWindowDimensions();
  const [bgIdx, setBgIdx] = useState(0);
  const [bgAIdx, setBgAIdx] = useState(0);
  const [bgBIdx, setBgBIdx] = useState(1 % BG_IMAGES.length);
  const [showBgA, setShowBgA] = useState(true);
  const [bgFailed, setBgFailed] = useState(false);
  const bgAOpacity = useRef(new Animated.Value(1)).current;
  const bgBOpacity = useRef(new Animated.Value(0)).current;
  const cardLift = useRef(new Animated.Value(0)).current;
  const [activeField, setActiveField] = useState("");
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIdx((prev) => {
        const next = (prev + 1) % BG_IMAGES.length;
        if (showBgA) {
          setBgBIdx(next);
          Animated.parallel([
            Animated.timing(bgAOpacity, { toValue: 0, duration: motion.slow, useNativeDriver: true }),
            Animated.timing(bgBOpacity, { toValue: 1, duration: motion.slow, useNativeDriver: true }),
          ]).start(() => {
            setShowBgA(false);
          });
        } else {
          setBgAIdx(next);
          Animated.parallel([
            Animated.timing(bgAOpacity, { toValue: 1, duration: motion.slow, useNativeDriver: true }),
            Animated.timing(bgBOpacity, { toValue: 0, duration: motion.slow, useNativeDriver: true }),
          ]).start(() => {
            setShowBgA(true);
          });
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [bgAOpacity, bgBOpacity, showBgA]);

  useEffect(() => {
    Animated.timing(cardLift, {
      toValue: activeField ? 1 : 0,
      duration: motion.fast,
      useNativeDriver: true,
    }).start();
  }, [activeField, cardLift]);

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
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgAOpacity }]}>
        <ImageBackground
          source={bgFailed ? require("../../assets/kumbh-login-fallback.png") : { uri: BG_IMAGES[bgAIdx] }}
          onError={() => setBgFailed(true)}
          style={styles.bg}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: bgBOpacity }]}>
        <ImageBackground
          source={bgFailed ? require("../../assets/kumbh-login-fallback.png") : { uri: BG_IMAGES[bgBIdx] }}
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
            <Animated.View
              style={[
                styles.card,
                {
                  padding: width < 360 ? 14 : 18,
                  transform: [
                    { translateY: cardLift.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
                    { scale: cardLift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] }) },
                  ],
                },
              ]}
            >
              <Text style={[styles.title, { fontSize: width < 360 ? 18 : 22 }]}>Kumbh Complaint Mobile</Text>
              <Text style={styles.subtitle}>{mode === "login" ? "Sign in" : "Create account"}</Text>
              <View style={styles.dotRow}>
                {BG_IMAGES.map((_, idx) => (
                  <View key={idx} style={[styles.dot, idx === bgIdx && styles.dotActive]} />
                ))}
              </View>

              {mode === "register" && (
                <>
                  <Animated.View style={[styles.inputWrap, activeField === "name" && styles.inputWrapActive]}>
                    <TextInput
                      placeholder="Name"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setActiveField("name")}
                      onBlur={() => setActiveField("")}
                      style={[styles.input, activeField === "name" && styles.inputActive]}
                      placeholderTextColor={colors.textDim}
                    />
                  </Animated.View>
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
                  <Animated.View style={[styles.inputWrap, activeField === "department" && styles.inputWrapActive]}>
                    <TextInput
                      placeholder="Department (optional)"
                      value={department}
                      onChangeText={setDepartment}
                      onFocus={() => setActiveField("department")}
                      onBlur={() => setActiveField("")}
                      style={[styles.input, activeField === "department" && styles.inputActive]}
                      placeholderTextColor={colors.textDim}
                    />
                  </Animated.View>
                </>
              )}

              <Animated.View style={[styles.inputWrap, activeField === "email" && styles.inputWrapActive]}>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setActiveField("email")}
                  onBlur={() => setActiveField("")}
                  autoCapitalize="none"
                  style={[styles.input, activeField === "email" && styles.inputActive]}
                  placeholderTextColor={colors.textDim}
                />
              </Animated.View>
              <Animated.View style={[styles.inputWrap, activeField === "password" && styles.inputWrapActive]}>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setActiveField("password")}
                  onBlur={() => setActiveField("")}
                  secureTextEntry
                  style={[styles.input, activeField === "password" && styles.inputActive]}
                  placeholderTextColor={colors.textDim}
                />
              </Animated.View>

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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6,13,20,0.46)" },
  container: { flexGrow: 1, justifyContent: "center", paddingVertical: 16 },
  infoBanner: {
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  infoTitle: { color: colors.gold, fontWeight: "800" },
  infoSub: { color: colors.text, fontSize: 12, marginTop: 3 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dotRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(229,216,154,0.4)" },
  dotActive: { width: 16, backgroundColor: colors.gold },
  title: { fontWeight: "900", color: colors.gold },
  subtitle: { fontSize: 14, color: colors.textDim, marginBottom: 14 },
  input: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  inputWrap: { marginBottom: 10 },
  inputWrapActive: { transform: [{ translateX: 3 }] },
  inputActive: {
    borderColor: "rgba(232,192,64,0.72)",
    shadowColor: colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  roleWrap: { flexDirection: "row", gap: 8, marginBottom: 10 },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
  },
  roleChipActive: {
    backgroundColor: "rgba(232,192,64,0.2)",
    borderColor: "rgba(232,192,64,0.5)",
  },
  roleChipText: { fontSize: 12, color: colors.textDim, fontWeight: "600" },
  roleChipTextActive: { color: colors.text },
  error: { color: "#fca5a5", marginBottom: 8 },
  primaryButton: { backgroundColor: "rgba(232,192,64,0.85)", borderRadius: radii.sm, paddingVertical: 12, alignItems: "center", marginTop: 4, borderWidth: 1, borderColor: colors.border },
  primaryPressed: { backgroundColor: "rgba(232,192,64,0.68)" },
  buttonDisabled: { opacity: 0.7 },
  primaryText: { color: "#13210d", fontWeight: "700" },
  secondaryButton: { borderRadius: radii.sm, paddingVertical: 12, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(15,32,24,0.85)" },
  secondaryPressed: { backgroundColor: "rgba(15,32,24,1)" },
  secondaryText: { color: colors.text, fontWeight: "600" },
});
