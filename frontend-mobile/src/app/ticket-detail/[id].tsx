// src/app/ticket-detail/[id].tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fetchTicketDetail } from "../../lib/ticketDetailService";

const COLORS = {
  primary: "#F191AC",
  primaryDark: "#C2607A",
  bg: "#F7EEED",
  cardBg: "#FFFFFF",
  textMain: "#4A232E",
  textMuted: "#8C5866",
  textLight: "#B38B95",
  white: "#FFFFFF",
  border: "rgba(194, 96, 122, 0.12)",
  dashed: "#E0C8CF",
  successBg: "rgba(76, 175, 80, 0.15)",
  successText: "#2E7D32",
  expiredBg: "rgba(158, 158, 158, 0.15)",
  expiredText: "#616161",
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();

  const ticketId = Array.isArray(id) ? id[0] : id;

  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;
      setIsLoading(true);
      const data = await fetchTicketDetail(ticketId);
      setTicket(data);
      setIsLoading(false);
    };
    loadTicket();
  }, [ticketId]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textMuted }}>Memuat tiket...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="alert-circle-outline" size={50} color={COLORS.textMuted} />
        <Text style={{ marginTop: 12, color: COLORS.textMuted }}>Tiket tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: COLORS.primary, fontWeight: "700" }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isUpcoming = ticket.status === "upcoming" || ticket.status === "issued";

  return (
    <View style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Detail E-Ticket</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="share-social-outline" size={20} color={COLORS.textMain} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main E-Ticket Card */}
        <View style={styles.ticketCard}>
          
          {/* Header Ticket (Gradient) */}
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.ticketHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.badgeRow}>
              <Text style={styles.ticketType}>{ticket.type}</Text>
              <View style={[
                styles.statusBadge, 
                !isUpcoming && { backgroundColor: COLORS.expiredBg }
              ]}>
                <View style={[
                  styles.statusDot, 
                  !isUpcoming && { backgroundColor: COLORS.expiredText }
                ]} />
                <Text style={[
                  styles.statusText, 
                  !isUpcoming && { color: COLORS.expiredText }
                ]}>
                  {ticket.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.headerTitle}>{ticket.title}</Text>
            <Text style={styles.headerSubtitle}>{ticket.subtitle}</Text>
          </LinearGradient>

          {/* Ticket Cutout Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.cutoutLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.cutoutRight} />
          </View>

          {/* Body Ticket (Details) */}
          <View style={styles.ticketBody}>
            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>TANGGAL & WAKTU</Text>
                <Text style={styles.infoValue}>{ticket.date}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>LOKASI VENUE</Text>
                <Text style={styles.infoValue}>{ticket.venue}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>SEKSI / KURSI</Text>
                <Text style={styles.infoValue}>{ticket.section} ({ticket.row})</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>HARGA</Text>
                <Text style={styles.infoValue}>{ticket.price}</Text>
              </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.codeContainer}>
              <View style={styles.qrWrapper}>
                <Ionicons name="qr-code" size={110} color={COLORS.textMain} />
              </View>
              <Text style={styles.ticketCode}>{ticket.ticketCode}</Text>
              <Text style={styles.codeHint}>Tunjukkan QR Code ini kepada petugas di pintu masuk</Text>
            </View>
          </View>
        </View>

        {/* Informational Cards */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informasi Tambahan</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Promotor / Organizer</Text>
            <Text style={styles.detailValue}>{ticket.organizer}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Durasi Acara</Text>
            <Text style={styles.detailValue}>{ticket.duration}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Batasan Usia</Text>
            <Text style={styles.detailValue}>{ticket.ageRestriction}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ketentuan & Deskripsi</Text>
          <Text style={styles.descriptionText}>{ticket.description}</Text>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="cloud-download-outline" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Download E-Ticket (PDF)</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  navHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", shadowColor: COLORS.textMain, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  navTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textMain },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },
  ticketCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, overflow: "hidden", marginVertical: 8, elevation: 4, shadowColor: COLORS.textMain, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
  ticketHeader: { padding: 22 },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  ticketType: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.85)", letterSpacing: 1.5 },
  statusBadge: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.successText },
  statusText: { fontSize: 10, fontWeight: "700", color: COLORS.successText },
  headerTitle: { fontSize: 22, fontWeight: "800", color: COLORS.white, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  dividerContainer: { height: 24, backgroundColor: COLORS.cardBg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", position: "relative" },
  cutoutLeft: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.bg, marginLeft: -12 },
  cutoutRight: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.bg, marginRight: -12 },
  dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: COLORS.dashed, borderStyle: "dashed", marginHorizontal: 12 },
  ticketBody: { padding: 22, gap: 16 },
  infoGrid: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textLight, letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: "600", color: COLORS.textMain, lineHeight: 20 },
  codeContainer: { alignItems: "center", justifyContent: "center", marginTop: 8, paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  qrWrapper: { padding: 12, backgroundColor: "#FAF6F7", borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  ticketCode: { marginTop: 10, fontSize: 14, fontWeight: "800", letterSpacing: 2, color: COLORS.textMain },
  codeHint: { marginTop: 4, fontSize: 11, color: COLORS.textLight, textAlign: "center" },
  sectionCard: { backgroundColor: COLORS.cardBg, borderRadius: 20, padding: 18, marginTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textMain, marginBottom: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: 13, color: COLORS.textMuted },
  detailValue: { fontSize: 13, fontWeight: "600", color: COLORS.textMain },
  descriptionText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20 },
  actionButton: { marginTop: 20, borderRadius: 16, overflow: "hidden" },
  actionGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 8 },
  actionButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});