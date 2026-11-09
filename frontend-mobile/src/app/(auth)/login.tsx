// src/app/(auth)/login.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import {
  Link,
  useRouter,
  useLocalSearchParams,
  type Href,
} from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ENDPOINTS } from "../../lib/api"; // <-- Diperbaiki jadi ENDPOINTS
import AsyncStorage from "@react-native-async-storage/async-storage";

const BG = "#F7EEED";
const CARD_BG = "#FFFFFF";
const INPUT_BG = "#FAE6E7";
const ACCENT = "#F191AC";
const ACCENT_SOFT = "#F4BBC9";
const ACCENT_DARK = "#C2607A";
const TEXT_MAIN = "#5A2E3B";
const TEXT_MUTED = "#B0788A";

export default function LoginScreen() {
  const router = useRouter();
  const { registered } = useLocalSearchParams<{ registered?: string }>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg("Email dan password wajib diisi");
      return;
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      const response = await fetch(ENDPOINTS.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login gagal");
      }

      // Ambil token dari response backend
      const token = data.data.access_token;

      // SIMPAN TOKEN ke AsyncStorage
      await AsyncStorage.setItem("access_token", token);
      await AsyncStorage.setItem("user_data", JSON.stringify(data.data.user));

      // Arahkan ke halaman utama
      router.replace("/(tabs)" as Href);

    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan pada jaringan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Image
          source={require("../../../assets/images/sment.jpg")}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <Text style={styles.heroTitle}>Login Here</Text>
      </View>

      <View style={styles.card}>
        {registered === "1" ? (
          <Text style={styles.successText}>
            Registrasi berhasil! Silakan login.
          </Text>
        ) : null}

        <TouchableOpacity style={styles.googleButton}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Sign in with Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={TEXT_MUTED}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />

        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor={TEXT_MUTED}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
            <Text style={styles.eyeIcon}>{showPassword ? "🙈" : "👁"}</Text>
          </TouchableOpacity>
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TouchableOpacity 
          onPress={handleLogin} 
          activeOpacity={0.85}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ["#CCC", "#AAA"] : [ACCENT_SOFT, ACCENT, ACCENT_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>
              {isLoading ? "Loading..." : "Login"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By logging in, you agree to our Terms of Service and Privacy Policy.
        </Text>

        <Text style={styles.footerText}>
          Don't have an account?{" "}
          <Link href={"/(auth)/register" as Href} style={styles.footerLink}>
            Register here
          </Link>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  hero: { height: 220, justifyContent: "flex-end", alignItems: "center", paddingBottom: 28 },
  heroImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(90,46,59,0.35)" },
  heroTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  card: { flex: 1, backgroundColor: CARD_BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, padding: 24 },
  successText: { color: "#2E7D32", backgroundColor: "#E8F5E9", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 12, marginBottom: 14, textAlign: "center" },
  googleButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: ACCENT, borderRadius: 24, paddingVertical: 13, marginBottom: 18 },
  googleIcon: { color: ACCENT, fontWeight: "700", fontSize: 13 },
  googleText: { color: ACCENT, fontWeight: "600", fontSize: 13 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: ACCENT_SOFT },
  dividerText: { marginHorizontal: 10, color: TEXT_MUTED, fontSize: 12 },
  input: { backgroundColor: INPUT_BG, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 14, color: TEXT_MAIN },
  passwordWrap: { flexDirection: "row", alignItems: "center", backgroundColor: INPUT_BG, borderRadius: 10, paddingHorizontal: 16, marginBottom: 8 },
  passwordInput: { flex: 1, paddingVertical: 14, color: TEXT_MAIN },
  eyeIcon: { fontSize: 14 },
  errorText: { color: "#D9534F", fontSize: 12, marginBottom: 10, marginTop: 4 },
  submitButton: { borderRadius: 24, paddingVertical: 15, alignItems: "center", marginTop: 12, marginBottom: 16 },
  submitText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  terms: { color: TEXT_MUTED, fontSize: 11, textAlign: "center", marginBottom: 18, lineHeight: 16 },
  footerText: { textAlign: "center", color: TEXT_MAIN, fontSize: 13 },
  footerLink: { color: ACCENT, fontWeight: "700" },
});