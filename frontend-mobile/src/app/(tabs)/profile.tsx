// src/app/(tabs)/profile.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- TAMBAHAN

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const COLORS = {
  primary: "#F191AC",
  primaryLight: "#F8CBD7",
  primaryDark: "#C2607A",
  bg: "#F9F3F3",
  cardBg: "#FFFFFF",
  iconBg: "#FAF0F2",
  inputBg: "#FAE6E7",
  textMain: "#4A232E",
  textMuted: "#8C5866",
  textLight: "#B38B95",
  white: "#FFFFFF",
  border: "rgba(194, 96, 122, 0.12)",
  danger: "#E74C3C",
  dangerBg: "#FDF2F2",
  gold: "#E8964B",
  overlay: "rgba(74, 35, 46, 0.4)",
};

// Sistem Tier disederhanakan (VIP dihapus)
function getMembershipTier(totalPurchasedTickets: number) {
  if (totalPurchasedTickets >= 5) return { name: "Gold Member", level: 2 };
  if (totalPurchasedTickets >= 1) return { name: "Silver Member", level: 1 };
  return { name: "New Member", level: 0 };
}

const TIER_BENEFITS = [
  { level: 0, name: "New Member", req: "0 Tickets", perk: "Basic access to standard events." },
  { level: 1, name: "Silver Member", req: "1-4 Tickets", perk: "Standard Presale Access & Member Badge." },
  { level: 2, name: "Gold Member", req: "5+ Tickets", perk: "Early Presale Access + 5% Cashback Points." },
];

interface MenuItem {
  id: string;
  icon: IoniconName;
  title: string;
  subtitle?: string;
  route: string;
}

interface MenuSection {
  sectionTitle: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    sectionTitle: "ACCOUNT SETTINGS",
    items: [
      { id: "personal_info", icon: "person-outline", title: "Personal Information", route: "/profile/edit" },
      { id: "my_tickets", icon: "ticket-outline", title: "My Tickets", route: "/(tabs)/my-tickets" },
      { id: "payment_methods", icon: "card-outline", title: "Payment Methods", route: "/profile/payment" },
      { id: "change_password", icon: "lock-closed-outline", title: "Change Password", route: "/profile/change-password" },
    ],
  },
  {
    sectionTitle: "PREFERENCES & SECURITY",
    items: [
      { id: "notifications", icon: "notifications-outline", title: "Notifications", route: "/(tabs)/notification" },
      { id: "privacy", icon: "shield-checkmark-outline", title: "Privacy & Security", route: "/profile/privacy" },
      { id: "language", icon: "language-outline", title: "Language", subtitle: "English (US)", route: "/profile/language" },
      { id: "theme", icon: "color-palette-outline", title: "Theme", subtitle: "Light Mode", route: "/profile/theme" },
    ],
  },
  {
    sectionTitle: "APP & SUPPORT",
    items: [
      { id: "help", icon: "help-circle-outline", title: "Help & Support", route: "/profile/help" },
      { id: "about", icon: "information-circle-outline", title: "About SMEncore", route: "/profile/about" },
    ],
  },
];

// Animasi Pressable
function AnimatedPressable({ children, style, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start()}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // STATE UNTUK DATA USER DARI DATABASE
  const [profile, setProfile] = useState({
    name: "Loading...",
    email: "Loading...",
    avatarUrl: "https://i.pravatar.cc/150?img=1", // Default avatar
  });

  const [showTierModal, setShowTierModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // NGAMBIL DATA USER DARI ASYNCSTORAGE PAS HALAMAN DIBUKA
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem("user_data");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setProfile({
            name: userData.full_name || "User",
            email: userData.email || "No Email",
            avatarUrl: userData.photo || "https://i.pravatar.cc/150?img=1", // Kalau ada foto profil dari backend, pakai. Kalau nggak, pakai default.
          });
        }
      } catch (error) {
        console.error("Gagal ambil data user:", error);
      }
    };
    loadUserData();
  }, []);

  const ticketStats = {
    confirmed: 6, // Nanti ini bisa diganti dengan data API tiket
    upcoming: 2,
  };

  const currentTierInfo = getMembershipTier(ticketStats.confirmed);

  // FUNGSI LOGOUT (HAPUS TOKEN & LEMPAR KE LOGIN)
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("user_data");
      setShowLogoutModal(false);
      router.replace("/(auth)/login" as Href);
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === "ios" ? insets.top + 10 : 20,
          paddingBottom: 40,
        }}
      >
        {/* Header Profile Section */}
        <View style={styles.headerProfile}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            <TouchableOpacity
              style={styles.cameraBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/profile/edit" as Href)}
            >
              <Ionicons name="camera" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>

          {/* Tier Badge */}
          <AnimatedPressable
            style={styles.tierBadgeContainer}
            onPress={() => setShowTierModal(true)}
          >
            <Ionicons name="sparkles" size={14} color={COLORS.gold} />
            <Text style={styles.userTier}>{currentTierInfo.name}</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.primaryDark} />
          </AnimatedPressable>
        </View>

        {/* Ticket Stats Card */}
        <View style={styles.statsCardContainer}>
          <AnimatedPressable
            style={styles.statsCard}
            onPress={() => router.push("/(tabs)/my-tickets" as Href)}
          >
            <View style={styles.statsCol}>
              <Text style={styles.statsLabel}>TOTAL TICKETS</Text>
              <Text style={styles.statsValue}>{ticketStats.confirmed}</Text>
            </View>

            <View style={styles.statsDivider} />

            <View style={styles.statsCol}>
              <Text style={styles.statsLabel}>UPCOMING</Text>
              <Text style={styles.statsValue}>{ticketStats.upcoming}</Text>
            </View>
          </AnimatedPressable>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSectionContainer}>
          {MENU_SECTIONS.map((section, sIdx) => (
            <View key={sIdx} style={styles.sectionBlock}>
              <Text style={styles.sectionHeaderTitle}>{section.sectionTitle}</Text>
              
              <View style={styles.cardGroup}>
                {section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      iIdx === section.items.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    activeOpacity={0.6}
                    onPress={() => router.push(item.route as Href)}
                  >
                    <View style={styles.menuLeft}>
                      <View style={styles.iconBox}>
                        <Ionicons name={item.icon} size={18} color={COLORS.primaryDark} />
                      </View>
                      <View>
                        <Text style={styles.menuTitle}>{item.title}</Text>
                        {!!item.subtitle && (
                          <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <AnimatedPressable 
            style={styles.logoutBtn} 
            onPress={() => setShowLogoutModal(true)}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
            <Text style={styles.logoutText}>Logout Account</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>

      {/* MODAL TIER MEMBERSHIP */}
      <Modal visible={showTierModal} transparent animationType="slide" onRequestClose={() => setShowTierModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowTierModal(false)}>
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            <View style={styles.tierModalHeader}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.tierIconBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="ribbon" size={28} color={COLORS.white} />
              </LinearGradient>
              <Text style={styles.modalTitle}>{currentTierInfo.name}</Text>
              <Text style={styles.modalSubTitle}>
                Total Purchased: <Text style={styles.boldText}>{ticketStats.confirmed} Tickets</Text>
              </Text>
            </View>

            <Text style={styles.sheetSectionTitle}>MEMBERSHIP TIERS</Text>
            <View style={styles.tierListContainer}>
              {TIER_BENEFITS.map((item) => {
                const isCurrent = currentTierInfo.level === item.level;
                return (
                  <View key={item.level} style={[styles.tierItemCard, isCurrent && styles.tierItemActive]}>
                    <View style={styles.tierItemHeader}>
                      <Text style={[styles.tierItemTitle, isCurrent && styles.tierItemTitleActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.tierReqBadge}>{item.req}</Text>
                    </View>
                    <Text style={styles.tierPerkText}>{item.perk}</Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={styles.closeSheetBtn} activeOpacity={0.85} onPress={() => setShowTierModal(false)}>
              <LinearGradient
                colors={[COLORS.primaryLight, COLORS.primary, COLORS.primaryDark]}
                style={styles.closeBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.closeBtnText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL KONFIRMASI LOGOUT */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.modalOverlayCenter} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={styles.alertBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.alertIconWrap}>
              <Ionicons name="log-out" size={28} color={COLORS.danger} />
            </View>
            <Text style={styles.alertTitle}>Logout Account?</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to log out? You will need to enter your password again.
            </Text>
            <View style={styles.alertButtonRow}>
              <TouchableOpacity 
                style={[styles.alertBtn, styles.alertBtnCancel]} 
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.alertBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.alertBtn, styles.alertBtnConfirm]} 
                onPress={handleLogout}
              >
                <Text style={styles.alertBtnTextConfirm}>Yes, Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerProfile: { alignItems: "center", paddingHorizontal: 20, marginBottom: 24 },
  avatarContainer: { position: "relative", marginBottom: 12 },
  avatar: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: COLORS.primaryLight },
  cameraBtn: { position: "absolute", bottom: 2, right: 2, backgroundColor: COLORS.primaryDark, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white },
  userName: { fontSize: 22, fontWeight: "800", color: COLORS.textMain, marginBottom: 2 },
  userEmail: { fontSize: 13, color: COLORS.textMuted, marginBottom: 10 },
  tierBadgeContainer: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.inputBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryLight },
  userTier: { fontSize: 12, fontWeight: "800", color: COLORS.primaryDark },
  statsCardContainer: { paddingHorizontal: 20, marginBottom: 28 },
  statsCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, elevation: 2, shadowColor: COLORS.textMain, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
  statsCol: { flex: 1, alignItems: "center" },
  statsLabel: { fontSize: 10, fontWeight: "800", color: COLORS.primaryDark, letterSpacing: 0.8, marginBottom: 4 },
  statsValue: { fontSize: 26, fontWeight: "800", color: COLORS.textMain },
  statsDivider: { width: 1, height: 40, backgroundColor: COLORS.border, marginHorizontal: 12 },
  menuSectionContainer: { paddingHorizontal: 20, gap: 20 },
  sectionBlock: { gap: 8 },
  sectionHeaderTitle: { fontSize: 10, fontWeight: "800", color: COLORS.textLight, letterSpacing: 1, marginLeft: 4 },
  cardGroup: { backgroundColor: COLORS.cardBg, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden", elevation: 1, shadowColor: COLORS.textMain, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.iconBg, alignItems: "center", justifyContent: "center" },
  menuTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textMain },
  menuSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: "500" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.dangerBg, paddingVertical: 15, borderRadius: 18, borderWidth: 1, borderColor: "rgba(231, 76, 60, 0.2)", marginTop: 8 },
  logoutText: { fontSize: 14, fontWeight: "700", color: COLORS.danger },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: "flex-end" },
  sheetContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 16 },
  tierModalHeader: { alignItems: "center", marginBottom: 20 },
  tierIconBadge: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textMain, marginBottom: 2 },
  modalSubTitle: { fontSize: 12, color: COLORS.textMuted },
  boldText: { fontWeight: "700", color: COLORS.primaryDark },
  sheetSectionTitle: { fontSize: 10, fontWeight: "800", color: COLORS.textLight, letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  tierListContainer: { gap: 10, marginBottom: 20 },
  tierItemCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  tierItemActive: { backgroundColor: COLORS.inputBg, borderColor: COLORS.primary },
  tierItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  tierItemTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  tierItemTitleActive: { color: COLORS.primaryDark, fontWeight: "800" },
  tierReqBadge: { fontSize: 10, fontWeight: "700", color: COLORS.textLight },
  tierPerkText: { fontSize: 11, color: COLORS.textMain, lineHeight: 16 },
  closeSheetBtn: { borderRadius: 16, overflow: "hidden" },
  closeBtnGradient: { paddingVertical: 14, alignItems: "center" },
  closeBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
  modalOverlayCenter: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  alertBox: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, width: "100%", maxWidth: 340, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  alertIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.dangerBg, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textMain, marginBottom: 8 },
  alertMessage: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  alertButtonRow: { flexDirection: "row", gap: 12, width: "100%" },
  alertBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  alertBtnCancel: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  alertBtnConfirm: { backgroundColor: COLORS.danger },
  alertBtnTextCancel: { fontSize: 14, fontWeight: "700", color: COLORS.textMain },
  alertBtnTextConfirm: { fontSize: 14, fontWeight: "700", color: COLORS.white },
});