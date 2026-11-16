// src/app/(tabs)/notification.tsx
import { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Animated, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, type Href } from "expo-router";
import { fetchMyNotifications } from "../../lib/notificationService";

const COLORS = {
  primary: "#F191AC",
  primaryLight: "#F4BBC9",
  primaryDark: "#C2607A",
  bg: "#F7EEED",
  cardBg: "#FFFFFF",
  inputBg: "#FAE6E7",
  textMain: "#5A2E3B",
  textMuted: "#B0788A",
  textLight: "#C4AAB3",
  white: "#FFFFFF",
  border: "rgba(90,46,59,0.06)",
  shadow: "rgba(90,46,59,0.08)",
};

function AnimatedPressable({ children, style, onPress }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start()}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function NotificationScreen() {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil data notifikasi dari API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const fetchedData = await fetchMyNotifications();
      setNotifications(fetchedData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const unreadCount = notifications.filter((a) => !a.read).length;

  const handleReadAlert = (id: string) => {
    setNotifications((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((alert) => ({ ...alert, read: true })));
  };

  const getIconName = (type: string, read: boolean) => {
    if (read) return "notifications-outline";
    switch (type) {
      case "ticket": return "ticket";
      case "promo": return "pricetag";
      case "payment": return "card";
      case "reminder": return "alarm";
      default: return "notifications";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textMuted }}>Memuat notifikasi...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, notifications.length === 0 && { flex: 1 }]}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptySubtitle}>
                We'll notify you when there are new events, ticket updates, or promos.
              </Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push("/(tabs)" as Href)}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.exploreGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.exploreText}>Back to Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            notifications.map((alert) => (
              <AnimatedPressable
                key={alert.id}
                style={[styles.alertCard, !alert.read && styles.alertCardUnread]}
                onPress={() => handleReadAlert(alert.id)}
              >
                <View style={[styles.alertIcon, !alert.read && styles.alertIconUnread]}>
                  <Ionicons name={getIconName(alert.type, alert.read)} size={20} color={alert.read ? COLORS.textMuted : COLORS.primary} />
                </View>

                <View style={styles.alertContent}>
                  <View style={styles.alertTitleRow}>
                    <Text style={[styles.alertTitle, !alert.read && styles.alertTitleUnread]} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text style={styles.alertTime}>{alert.time}</Text>
                  </View>
                  <Text style={[styles.alertMessage, !alert.read && styles.alertMessageUnread]} numberOfLines={2}>
                    {alert.message}
                  </Text>
                </View>

                {!alert.read && <View style={styles.unreadDot} />}
              </AnimatedPressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: COLORS.bg },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.textMain, letterSpacing: -0.5 },
  unreadBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  unreadBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  markAllText: { fontSize: 12, fontWeight: "600", color: COLORS.primary, marginBottom: 4 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  alertCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.shadow, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  alertCardUnread: { borderColor: COLORS.primary + "40", backgroundColor: "#FFF9FA" },
  alertIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", marginRight: 12 },
  alertIconUnread: { backgroundColor: COLORS.primary + "15" },
  alertContent: { flex: 1 },
  alertTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  alertTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textMuted, flex: 1, marginRight: 8 },
  alertTitleUnread: { color: COLORS.textMain, fontWeight: "700" },
  alertMessage: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  alertMessageUnread: { color: COLORS.textMain, opacity: 0.8 },
  alertTime: { fontSize: 11, color: COLORS.textLight, fontWeight: "500" },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginLeft: 12 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: COLORS.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textMain, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: 40, lineHeight: 20, marginBottom: 20 },
  exploreBtn: { borderRadius: 20, overflow: "hidden", shadowColor: COLORS.primaryDark, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  exploreGradient: { paddingHorizontal: 24, paddingVertical: 12 },
  exploreText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
});