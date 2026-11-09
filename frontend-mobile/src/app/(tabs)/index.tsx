// src/app/(tabs)/index.tsx
import { useRef, useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Image,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator, // Tambahan untuk loading
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";

// IMPORT SERVICE API
import { fetchCategories, fetchEvents } from "../../lib/eventService";

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
  whiteAlpha: "rgba(255,255,255,0.9)",
  shadow: "rgba(90,46,59,0.08)",
  border: "rgba(90,46,59,0.06)",
  overlay: "rgba(90,46,59,0.4)",
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_ITEM_WIDTH = SCREEN_WIDTH - 60;
const HERO_GAP = 12;
const HERO_SNAP = HERO_ITEM_WIDTH + HERO_GAP;
const AUTOPLAY_INTERVAL = 3500;

const HERO_BANNERS = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop",
    badge: "Featured",
    badgeIcon: "sparkles" as const,
    title: "Find your favorite idols",
    subtitle: "and secure your seat today",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=400&fit=crop",
    badge: "Trending",
    badgeIcon: "flame" as const,
    title: "Concerts near you",
    subtitle: "don't miss the hottest shows",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    badge: "Limited",
    badgeIcon: "flash" as const,
    title: "Early bird tickets",
    subtitle: "grab discounted seats now",
  },
];

const SORT_OPTIONS = [
  { id: "date_asc", label: "Tanggal Terdekat" },
  { id: "price_asc", label: "Harga Terendah" },
  { id: "price_desc", label: "Harga Tertinggi" },
  { id: "popular", label: "Paling Populer" },
];

const PRICE_RANGES = [
  { id: "all", label: "Semua Harga" },
  { id: "under_500k", label: "< Rp500rb" },
  { id: "500k_1m", label: "Rp500rb - 1jt" },
  { id: "above_1m", label: "> Rp1jt" },
];

const NOTIFICATIONS = [
  { id: "1", title: "Ticket Ready!", message: "Your ticket for Coldplay is ready.", time: "2h ago", icon: "ticket" },
  { id: "2", title: "Promo Alert!", message: "Diskon 20% untuk konser minggu ini.", time: "5h ago", icon: "pricetag" },
  { id: "3", title: "Reminder", message: "Konser Sheila On 7 besok malam!", time: "1d ago", icon: "calendar" },
];

function AnimatedPressable({ children, style, onPress, scaleTo = 0.96 }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 6 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start()}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useLocalSearchParams<{ user?: string }>();
  
  // STATE UNTUK API
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<(string | number)[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>("date_asc");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");

  const activeFilterCount =
    selectedCategoryIds.length + (selectedSort !== "date_asc" ? 1 : 0) + (selectedPriceRange !== "all" ? 1 : 0);

  // FETCH DATA DARI BACKEND
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [fetchedCategories, fetchedEvents] = await Promise.all([
        fetchCategories(),
        fetchEvents(),
      ]);
      setCategories(fetchedCategories);
      setEvents(fetchedEvents);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // FILTER DATA DARI API
  const filteredUpcoming = useMemo(() => {
    return events.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.venue.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, events]);

  const filteredRecommended = useMemo(() => {
    return filteredUpcoming; 
  }, [filteredUpcoming]);

  const toggleCategory = (id: string | number) => {
    setSelectedCategoryIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleResetFilter = () => {
    setSelectedCategoryIds([]);
    setSelectedSort("date_asc");
    setSelectedPriceRange("all");
  };

  const handleApplyFilter = () => {
    setShowFilter(false);
  };

  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const heroListRef = useRef<Animated.FlatList<any>>(null);
  const currentIndex = useRef(0);
  const isUserInteracting = useRef(false);
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoplay = () => {
    if (autoplayTimer.current) clearInterval(autoplayTimer.current);
  };

  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimer.current = setInterval(() => {
      if (isUserInteracting.current) return;
      const nextIndex = (currentIndex.current + 1) % HERO_BANNERS.length;
      currentIndex.current = nextIndex;
      heroListRef.current?.scrollToOffset({ offset: nextIndex * HERO_SNAP, animated: true });
    }, AUTOPLAY_INTERVAL);
  };

  useEffect(() => {
    startAutoplay();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();
    return () => stopAutoplay();
  }, []);

  // TAMPILAN LOADING
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textMuted }}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user || "Audia Larasati"}</Text>
            </View>
            <View style={styles.headerActions}>
              <AnimatedPressable style={styles.iconButton} scaleTo={0.88} onPress={() => setShowNotif(true)}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.textMain} />
                <View style={styles.notifBadge} />
              </AnimatedPressable>
              <AnimatedPressable style={styles.avatar} scaleTo={0.9} onPress={() => router.push("/(tabs)/profile" as Href)}>
                <Image source={{ uri: "https://i.pravatar.cc/150?img=1" }} style={styles.avatarImage} />
              </AnimatedPressable>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search music, events, venues..."
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="search"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            <AnimatedPressable style={styles.filterButton} scaleTo={0.88} onPress={() => setShowFilter(true)}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.filterGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="options-outline" size={18} color={COLORS.white} />
                {activeFilterCount > 0 && (
                  <View style={styles.filterCountBadge}>
                    <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                  </View>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </View>

          {/* Hero Banner Carousel (Hardcoded Promo) */}
          {searchQuery.length === 0 && (
            <>
              <Animated.FlatList
                ref={heroListRef}
                data={HERO_BANNERS}
                keyExtractor={(item) => item.id}
                horizontal
                snapToInterval={HERO_SNAP}
                decelerationRate="fast"
                snapToAlignment="start"
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingRight: 20 - HERO_GAP }}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                onScrollBeginDrag={() => { isUserInteracting.current = true; stopAutoplay(); }}
                onMomentumScrollEnd={(e) => {
                  const offsetX = e.nativeEvent.contentOffset.x;
                  const newIndex = Math.round(offsetX / HERO_SNAP);
                  currentIndex.current = Math.max(0, Math.min(newIndex, HERO_BANNERS.length - 1));
                  isUserInteracting.current = false;
                  startAutoplay();
                }}
                renderItem={({ item }) => (
                  <View style={[styles.heroBanner, { width: HERO_ITEM_WIDTH, marginRight: HERO_GAP }]}>
                    <Image source={{ uri: item.image }} style={styles.heroImage} />
                    <LinearGradient colors={["rgba(90,46,59,0.6)", "rgba(241,145,172,0.4)", "rgba(194,96,122,0.6)"]} style={styles.heroOverlay} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                    <View style={styles.heroContent}>
                      <View style={styles.heroBadge}>
                        <Ionicons name={item.badgeIcon} size={14} color={COLORS.primary} />
                        <Text style={styles.heroBadgeText}>{item.badge}</Text>
                      </View>
                      <Text style={styles.heroTitle}>{item.title}</Text>
                      <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
                      <AnimatedPressable style={styles.heroButton} scaleTo={0.92} onPress={() => router.push("/events/upcoming" as Href)}>
                        <Text style={styles.heroButtonText}>Explore</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                      </AnimatedPressable>
                    </View>
                  </View>
                )}
              />
              <View style={styles.dotsContainer}>
                {HERO_BANNERS.map((_, i) => {
                  const inputRange = [(i - 1) * HERO_SNAP, i * HERO_SNAP, (i + 1) * HERO_SNAP];
                  const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 20, 8], extrapolate: "clamp" });
                  const dotOpacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: "clamp" });
                  return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]} />;
                })}
              </View>
            </>
          )}

          {/* Categories (DARI API) */}
          {searchQuery.length === 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <TouchableOpacity onPress={() => router.push("/categories" as Href)}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                {categories.map((category) => (
                  <AnimatedPressable key={category.id} style={styles.categoryItem} scaleTo={0.9} onPress={() => router.push(`/categories/${category.id}` as Href)}>
                    <View style={styles.categoryIcon}>
                      <Ionicons name={category.icon as any} size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </AnimatedPressable>
                ))}
              </ScrollView>
            </>
          )}

          {/* Upcoming Events (DARI API) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{searchQuery ? "Search Results" : "Upcoming Events"}</Text>
            {!searchQuery && (
              <TouchableOpacity onPress={() => router.push("/events/upcoming" as Href)}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {filteredUpcoming.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No events found.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventsScroll}>
              {filteredUpcoming.map((event) => (
                <AnimatedPressable key={event.id} style={styles.eventCard} scaleTo={0.96} onPress={() => router.push(`/concert/${event.id}` as Href)}>
                  <View style={styles.eventImage}>
                    <Image source={{ uri: event.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    <View style={styles.eventDateBadge}>
                      <Text style={styles.eventDateText}>{event.date.split(' ')[1]}</Text>
                      <Text style={styles.eventDateNumber}>{event.date.split(' ')[0]}</Text>
                    </View>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.eventSubtitle} numberOfLines={1}>{event.subtitle}</Text>
                    <View style={styles.eventMeta}>
                      <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.eventMetaText} numberOfLines={1}>{event.venue}</Text>
                    </View>
                    <View style={styles.eventFooter}>
                      <Text style={styles.eventPrice}>{event.price}</Text>
                      <AnimatedPressable style={styles.eventBookButton} scaleTo={0.85} onPress={() => router.push(`/booking/${event.id}` as Href)}>
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.eventBookGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                          <Ionicons name="ticket-outline" size={14} color={COLORS.white} />
                        </LinearGradient>
                      </AnimatedPressable>
                    </View>
                  </View>
                </AnimatedPressable>
              ))}
            </ScrollView>
          )}

          {/* Recommended (DARI API) */}
          {searchQuery.length === 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended for You</Text>
                <TouchableOpacity onPress={() => router.push("/events/recommended" as Href)}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {filteredRecommended.map((event) => (
                <AnimatedPressable key={event.id} style={styles.recommendedCard} scaleTo={0.97} onPress={() => router.push(`/concert/${event.id}` as Href)}>
                  <View style={styles.recommendedImage}>
                    <Image source={{ uri: event.image }} style={{ width: "100%", height: "100%", borderRadius: 12 }} resizeMode="cover" />
                  </View>
                  <View style={styles.recommendedInfo}>
                    <Text style={styles.recommendedTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.recommendedSubtitle} numberOfLines={1}>{event.subtitle}</Text>
                    <View style={styles.recommendedMeta}>
                      <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.recommendedMetaText}>{event.date}</Text>
                      <Ionicons name="location-outline" size={12} color={COLORS.textMuted} style={styles.recommendedMetaIcon} />
                      <Text style={styles.recommendedMetaText} numberOfLines={1}>{event.venue}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </AnimatedPressable>
              ))}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </Animated.View>
      </ScrollView>

      {/* Modal Notifikasi */}
      <Modal visible={showNotif} transparent animationType="fade" onRequestClose={() => setShowNotif(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowNotif(false)}>
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotif(false)}>
                <Ionicons name="close" size={20} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {NOTIFICATIONS.map((notif, idx) => (
                <View key={notif.id} style={[styles.notifItem, idx === NOTIFICATIONS.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.notifIconWrap}>
                    <Ionicons name={notif.icon as any} size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    <Text style={styles.notifMsg}>{notif.message}</Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Filter */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilter(false)}>
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={handleResetFilter} hitSlop={8}><Text style={styles.resetText}>Reset</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={styles.filterSectionLabel}>Kategori</Text>
              <View style={styles.chipsWrap}>
                {categories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <TouchableOpacity key={category.id} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => toggleCategory(category.id)} activeOpacity={0.8}>
                      <Ionicons name={category.icon as any} size={14} color={isSelected ? COLORS.white : COLORS.textMuted} />
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{category.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.filterSectionLabel, { marginTop: 20 }]}>Urutkan</Text>
              <View style={styles.optionsList}>
                {SORT_OPTIONS.map((option) => {
                  const isSelected = selectedSort === option.id;
                  return (
                    <TouchableOpacity key={option.id} style={styles.radioRow} onPress={() => setSelectedSort(option.id)} activeOpacity={0.7}>
                      <Text style={styles.radioLabel}>{option.label}</Text>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.filterSectionLabel, { marginTop: 20 }]}>Rentang Harga</Text>
              <View style={styles.optionsList}>
                {PRICE_RANGES.map((option) => {
                  const isSelected = selectedPriceRange === option.id;
                  return (
                    <TouchableOpacity key={option.id} style={styles.radioRow} onPress={() => setSelectedPriceRange(option.id)} activeOpacity={0.7}>
                      <Text style={styles.radioLabel}>{option.label}</Text>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilter} activeOpacity={0.85}>
              <Text style={styles.applyButtonText}>Terapkan{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  greeting: { color: COLORS.textMuted, fontSize: 12, fontWeight: "500", letterSpacing: 0.5, marginBottom: 2 },
  userName: { color: COLORS.textMain, fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", shadowColor: COLORS.shadow, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  notifBadge: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: "hidden", borderWidth: 2, borderColor: COLORS.primary },
  avatarImage: { width: "100%", height: "100%" },
  searchContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 20, backgroundColor: COLORS.white, borderRadius: 14, paddingHorizontal: 16, shadowColor: COLORS.shadow, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, paddingVertical: 14, color: COLORS.textMain, fontSize: 14 },
  filterButton: { marginLeft: 8, borderRadius: 10, overflow: "visible" },
  filterGradient: { padding: 8, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  filterCountBadge: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.textMain, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  filterCountText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },
  heroBanner: { borderRadius: 20, overflow: "hidden", height: 160, position: "relative" },
  heroImage: { position: "absolute", width: "100%", height: "100%", resizeMode: "cover" },
  heroOverlay: { position: "absolute", width: "100%", height: "100%" },
  heroContent: { flex: 1, zIndex: 1, padding: 24, justifyContent: "center" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.white, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  heroBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  heroTitle: { color: COLORS.white, fontSize: 20, fontWeight: "700", letterSpacing: -0.3, marginBottom: 2 },
  heroSubtitle: { color: COLORS.whiteAlpha, fontSize: 14, fontWeight: "400", marginBottom: 14, opacity: 0.95 },
  heroButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  heroButtonText: { color: COLORS.white, fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  dotsContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { color: COLORS.textMain, fontSize: 17, fontWeight: "700", letterSpacing: -0.3 },
  seeAll: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 30, paddingHorizontal: 20 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 10, textAlign: "center" },
  categoriesScroll: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  categoryItem: { alignItems: "center", gap: 6 },
  categoryIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", shadowColor: COLORS.shadow, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  categoryName: { color: COLORS.textMuted, fontSize: 11, fontWeight: "500" },
  eventsScroll: { paddingHorizontal: 20, gap: 14, marginBottom: 24 },
  eventCard: { width: 220, backgroundColor: COLORS.white, borderRadius: 16, overflow: "hidden", shadowColor: COLORS.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  eventImage: { height: 120, backgroundColor: COLORS.inputBg, alignItems: "center", justifyContent: "center", position: "relative" },
  eventEmoji: { fontSize: 44 },
  eventDateBadge: { position: "absolute", top: 10, left: 10, backgroundColor: COLORS.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: "center", shadowColor: COLORS.shadow, shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  eventDateText: { color: COLORS.textMuted, fontSize: 8, fontWeight: "600", textTransform: "uppercase" },
  eventDateNumber: { color: COLORS.textMain, fontSize: 14, fontWeight: "700" },
  eventInfo: { padding: 12 },
  eventTitle: { color: COLORS.textMain, fontSize: 14, fontWeight: "700", marginBottom: 2 },
  eventSubtitle: { color: COLORS.textMuted, fontSize: 11, marginBottom: 6 },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  eventMetaText: { color: COLORS.textLight, fontSize: 10, flex: 1 },
  eventFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eventPrice: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  eventBookButton: { borderRadius: 8, overflow: "hidden" },
  eventBookGradient: { padding: 6, alignItems: "center", justifyContent: "center" },
  recommendedCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, marginHorizontal: 20, marginBottom: 12, padding: 12, borderRadius: 14, shadowColor: COLORS.shadow, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  recommendedImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.inputBg, alignItems: "center", justifyContent: "center", marginRight: 12 },
  recommendedEmoji: { fontSize: 28 },
  recommendedInfo: { flex: 1 },
  recommendedTitle: { color: COLORS.textMain, fontSize: 14, fontWeight: "700" },
  recommendedSubtitle: { color: COLORS.textMuted, fontSize: 11, marginBottom: 2 },
  recommendedMeta: { flexDirection: "row", alignItems: "center" },
  recommendedMetaText: { color: COLORS.textLight, fontSize: 10, marginLeft: 2 },
  recommendedMetaIcon: { marginLeft: 8 },
  bottomSpacer: { height: 20 },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: "flex-end" },
  sheetContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: "center", marginBottom: 14 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textMain },
  resetText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  filterSectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: "transparent" },
  chipSelected: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },
  chipTextSelected: { color: COLORS.white },
  optionsList: { gap: 2 },
  radioRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  radioLabel: { fontSize: 14, color: COLORS.textMain, fontWeight: "500" },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  radioCircleSelected: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  applyButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center", justifyContent: "center", marginTop: 16, shadowColor: COLORS.primaryDark, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  applyButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
  notifItem: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  notifIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.inputBg, alignItems: "center", justifyContent: "center" },
  notifTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textMain, marginBottom: 2 },
  notifMsg: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4, lineHeight: 18 },
  notifTime: { fontSize: 10, color: COLORS.textLight, fontWeight: "500" },
});   