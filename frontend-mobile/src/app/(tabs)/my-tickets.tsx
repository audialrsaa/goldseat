// src/app/(tabs)/my-tickets.tsx
import { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Pressable, Animated, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { fetchMyTickets } from "../../lib/ticketService";

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
  shadow: "rgba(90,46,59,0.08)",
  border: "rgba(90,46,59,0.06)",
  success: "#2E7D32",
  successBg: "#E8F5E9",
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

export default function MyTicketsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // STATE UNTUK DATA TIKET DARI API
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // AMBIL DATA DARI API
  useEffect(() => {
    const loadTickets = async () => {
      setIsLoading(true);
      const fetchedTickets = await fetchMyTickets();
      setTickets(fetchedTickets);
      setIsLoading(false);
    };
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => ticket.status === activeTab);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="ticket-outline" size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No {activeTab} tickets</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "upcoming"
          ? "You don't have any upcoming events yet. Let's find one!"
          : activeTab === "active"
          ? "No active tickets right now."
          : "You haven't used any tickets yet."}
      </Text>
      {activeTab === "upcoming" && (
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => router.push("/(tabs)/index" as Href)}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.exploreGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.exploreText}>Explore Events</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["upcoming", "active", "used"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textMuted }}>Memuat tiket...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, filteredTickets.length === 0 && { flex: 1 }]}
        >
          {filteredTickets.length === 0 ? (
            renderEmptyState()
          ) : (
            filteredTickets.map((ticket) => (
              <AnimatedPressable
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() =>
                  router.push({
                    pathname: "/ticket-detail/[id]",
                    params: { id: ticket.id },
                  } as Href)
                }
              >
                {/* Bagian Atas Tiket */}
                <View style={styles.ticketTop}>
                  <View style={styles.ticketHeaderRow}>
                    <View style={styles.badgeWrap}>
                      <Text style={styles.ticketType}>{ticket.type}</Text>
                    </View>
                    <View style={[styles.statusBadge, ticket.status === "active" && styles.statusActive, ticket.status === "used" && styles.statusUsed]}>
                      <Text style={styles.statusText}>{ticket.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.ticketTitle}>{ticket.title}</Text>
                  <Text style={styles.ticketSubtitle}>{ticket.subtitle}</Text>

                  <View style={styles.ticketInfo}>
                    <View style={styles.ticketInfoRow}>
                      <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.ticketInfoText}>{ticket.date}</Text>
                    </View>
                    <View style={styles.ticketInfoRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.ticketInfoText}>{ticket.venue}</Text>
                    </View>
                  </View>
                </View>

                {/* Garis Putus-putus */}
                <View style={styles.dashedLineWrap}>
                  <View style={styles.notchLeft} />
                  <View style={styles.dashedLine} />
                  <View style={styles.notchRight} />
                </View>

                {/* Bagian Bawah Tiket */}
                <View style={styles.ticketBottom}>
                  <View>
                    <Text style={styles.seatLabel}>SEAT / SECTION</Text>
                    <Text style={styles.seatText}>{ticket.seat}</Text>
                  </View>
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code" size={32} color={COLORS.textMain} />
                  </View>
                </View>
              </AnimatedPressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, backgroundColor: COLORS.bg },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.textMain, letterSpacing: -0.5 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", shadowColor: COLORS.shadow, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabContainer: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  tabTextActive: { color: COLORS.white },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
  ticketCard: { backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 16, shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: "hidden" },
  ticketTop: { padding: 16 },
  ticketHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badgeWrap: { backgroundColor: COLORS.inputBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ticketType: { fontSize: 10, fontWeight: "700", color: COLORS.primaryDark, textTransform: "uppercase", letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: COLORS.border },
  statusActive: { backgroundColor: COLORS.successBg },
  statusUsed: { backgroundColor: COLORS.border, opacity: 0.7 },
  statusText: { fontSize: 10, fontWeight: "700", color: COLORS.textMain, textTransform: "capitalize" },
  ticketTitle: { fontSize: 18, fontWeight: "800", color: COLORS.textMain, letterSpacing: -0.3, marginBottom: 2 },
  ticketSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12 },
  ticketInfo: { gap: 6 },
  ticketInfoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketInfoText: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },
  dashedLineWrap: { flexDirection: "row", alignItems: "center", height: 20, position: "relative" },
  dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: COLORS.border, borderStyle: "dashed", marginHorizontal: 10 },
  notchLeft: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.bg, marginLeft: -8 },
  notchRight: { width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.bg, marginRight: -8 },
  ticketBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 10 },
  seatLabel: { fontSize: 10, fontWeight: "600", color: COLORS.textMuted, marginBottom: 2, textTransform: "uppercase" },
  seatText: { fontSize: 14, fontWeight: "700", color: COLORS.textMain },
  qrPlaceholder: { width: 50, height: 50, borderRadius: 8, backgroundColor: COLORS.inputBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: COLORS.shadow, shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textMain, marginBottom: 8, textTransform: "capitalize" },
  emptySubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: 40, lineHeight: 20, marginBottom: 20 },
  exploreBtn: { borderRadius: 20, overflow: "hidden", shadowColor: COLORS.primaryDark, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  exploreGradient: { paddingHorizontal: 24, paddingVertical: 12 },
  exploreText: { color: COLORS.white, fontSize: 14, fontWeight: "700" },
});