// src/app/onboarding/index.tsx
import { useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";

const { width } = Dimensions.get("window");

const COLORS = {
  bgStart: "#F8F0EE",
  bgEnd: "#FCE8EA",
  accent: "#E8829C",
  accentLight: "#F5B8CC",
  accentDark: "#D46A86",
  textPrimary: "#3D232B",
  textSecondary: "#8B6B78",
  textMuted: "#C4AAB3",
  white: "#FFFFFF",
  seatSold: "#D9D2D5",
  seatAvailable: "#FFFFFF",
  card: "rgba(255,255,255,0.85)",
  cardBorder: "rgba(232,130,156,0.18)",
};

type Slide = {
  id: string;
  kind: "seat" | "photo" | "phone";
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    kind: "seat",
    title: "Choose Your Perfect Seat",
    description: "Select your preferred ticket category and choose your seat easily.",
  },
  {
    id: "2",
    kind: "photo",
    title: "Discover Amazing Concerts",
    description: "Discover the best concerts near you, curated for your unique taste.",
  },
  {
    id: "3",
    kind: "phone",
    title: "Enjoy the Ultimate Concert Experience",
    description: "Receive your QR ticket instantly and enjoy a seamless concert experience.",
  },
];

// Baris x kolom kursi untuk ilustrasi seat map (bukan data booking asli)
const SEAT_ROWS = [
  ["available", "available", "selected", "available", "available"],
  ["available", "sold", "available", "available", "sold"],
  ["sold", "available", "available", "selected", "available"],
  ["available", "available", "sold", "available", "available"],
];

function SeatMapIllustration() {
  return (
    <View style={styles.seatCard}>
      <View style={styles.stageBar}>
        <Text style={styles.stageText}>STAGE</Text>
      </View>

      <View style={styles.seatGrid}>
        {SEAT_ROWS.map((row, rIdx) => (
          <View key={rIdx} style={styles.seatRow}>
            {row.map((seat, cIdx) => (
              <View
                key={cIdx}
                style={[
                  styles.seatDot,
                  seat === "sold" && styles.seatDotSold,
                  seat === "selected" && styles.seatDotSelected,
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.seatLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderWidth: 1.5, borderColor: COLORS.accentLight }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.seatDotSold]} />
          <Text style={styles.legendText}>Sold</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.seatDotSelected]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
      </View>

      <View style={styles.tierRow}>
        <View style={styles.tierCard}>
          <Text style={styles.tierName}>TIER 1</Text>
          <Text style={styles.tierPrice}>$250</Text>
        </View>
        <View style={[styles.tierCard, styles.tierCardActive]}>
          <Text style={[styles.tierName, styles.tierNameActive]}>TIER 2</Text>
          <Text style={[styles.tierPrice, styles.tierPriceActive]}>$350</Text>
          <Text style={styles.tierSub}>Premium Seating</Text>
        </View>
      </View>
    </View>
  );
}

function PhotoCardIllustration() {
  return (
    <View style={styles.photoCard}>
      <LinearGradient
        colors={[COLORS.accentDark, COLORS.accent, COLORS.accentLight]}
        style={styles.photoBlock}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.stageLights}>
          <View style={[styles.lightBeam, { left: "15%" }]} />
          <View style={[styles.lightBeam, { left: "45%" }]} />
          <View style={[styles.lightBeam, { left: "75%" }]} />
        </View>
        <View style={styles.crowdRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.crowdDot} />
          ))}
        </View>
      </LinearGradient>
      <View style={styles.photoCaption}>
        <Ionicons name="musical-notes" size={14} color={COLORS.accent} />
        <Text style={styles.photoCaptionText}>Live tonight • 3 venues near you</Text>
      </View>
    </View>
  );
}

function PhoneMockupIllustration() {
  return (
    <View style={styles.phoneWrapper}>
      <Ionicons name="flash" size={22} color={COLORS.accentLight} style={styles.boltDeco} />

      <View style={styles.phoneFrame}>
        <View style={styles.phoneNotch} />

        <View style={styles.phoneHeader}>
          <Text style={styles.phoneBrand}>SMEncore</Text>
          <Ionicons name="qr-code-outline" size={16} color={COLORS.accent} />
        </View>

        <View style={styles.ticketCard}>
          <View style={styles.ticketQr}>
            <Ionicons name="qr-code" size={48} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.ticketEvent}>NCT 127 World Tour</Text>
          <Text style={styles.ticketMeta}>Jan 12 • 19:00</Text>
        </View>

        <View style={styles.phoneUserChip}>
          <View style={styles.userAvatar} />
          <Text style={styles.userChipText}>Ready to check-in</Text>
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  const goToLogin = () => {
    router.replace("/(auth)/login" as Href);
  };

  const goTo = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleNext = () => {
    if (isLastSlide) {
      goToLogin();
      return;
    }
    goTo(activeIndex + 1);
  };

  const handleBack = () => {
    if (activeIndex === 0) return;
    goTo(activeIndex - 1);
  };

  const handleMomentumEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const renderIllustration = (kind: Slide["kind"]) => {
    if (kind === "seat") return <SeatMapIllustration />;
    if (kind === "photo") return <PhotoCardIllustration />;
    return <PhoneMockupIllustration />;
  };

  return (
    <LinearGradient colors={[COLORS.bgStart, COLORS.bgEnd]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Ionicons name="musical-note" size={16} color={COLORS.accent} />
          <Text style={styles.brand}>SMEncore</Text>
        </View>

        {!isLastSlide ? (
          <View style={styles.headerRight}>
            <Text style={styles.stepText}>
              Step {activeIndex + 1} of {SLIDES.length}
            </Text>
            <TouchableOpacity onPress={goToLogin} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Ionicons name="phone-portrait-outline" size={18} color={COLORS.accent} />
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.scrollView}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {renderIllustration(slide.kind)}

            <View style={styles.textWrapper}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.footerButtons}>
          {activeIndex > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
            <LinearGradient
              colors={isLastSlide ? [COLORS.accentDark, COLORS.accent] : [COLORS.accent, COLORS.accentLight]}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.nextButtonText}>{isLastSlide ? "Get Started" : "Next"}</Text>
              <Ionicons name={isLastSlide ? "checkmark" : "arrow-forward"} size={16} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brand: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  skipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  textWrapper: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 300,
  },

  // Seat map slide
  seatCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 18,
  },
  stageBar: {
    alignSelf: "center",
    backgroundColor: COLORS.accentLight,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  stageText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  seatGrid: {
    gap: 8,
    marginBottom: 12,
  },
  seatRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  seatDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.accentLight,
    backgroundColor: COLORS.seatAvailable,
  },
  seatDotSold: {
    backgroundColor: COLORS.seatSold,
    borderColor: COLORS.seatSold,
  },
  seatDotSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  seatLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  tierRow: {
    flexDirection: "row",
    gap: 10,
  },
  tierCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  tierCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(232,130,156,0.06)",
  },
  tierName: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  tierNameActive: {
    color: COLORS.accentDark,
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  tierPriceActive: {
    color: COLORS.accentDark,
  },
  tierSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Photo card slide
  photoCard: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  photoBlock: {
    height: 170,
    justifyContent: "flex-end",
    padding: 12,
    overflow: "hidden",
  },
  stageLights: {
    ...StyleSheet.absoluteFill,
  },
  lightBeam: {
    position: "absolute",
    top: 0,
    width: 40,
    height: 170,
    backgroundColor: "rgba(255,255,255,0.15)",
    transform: [{ rotate: "12deg" }],
  },
  crowdRow: {
    flexDirection: "row",
    gap: 6,
  },
  crowdDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  photoCaption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 14,
  },
  photoCaptionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  // Phone mockup slide
  phoneWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  boltDeco: {
    position: "absolute",
    left: -6,
    top: "45%",
    opacity: 0.6,
  },
  phoneFrame: {
    width: 190,
    height: 300,
    borderRadius: 28,
    borderWidth: 6,
    borderColor: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    padding: 14,
    alignItems: "center",
  },
  phoneNotch: {
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
    marginBottom: 10,
  },
  phoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 14,
  },
  phoneBrand: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  ticketCard: {
    width: "100%",
    backgroundColor: "rgba(232,130,156,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: "center",
    padding: 14,
    marginBottom: 14,
  },
  ticketQr: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  ticketEvent: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  ticketMeta: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  phoneUserChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  userAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accentLight,
  },
  userChipText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 44,
    paddingTop: 12,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentLight,
  },
  dotActive: {
    width: 20,
    backgroundColor: COLORS.accent,
  },
  footerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: COLORS.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.accentDark,
  },
  nextButton: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  nextButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});