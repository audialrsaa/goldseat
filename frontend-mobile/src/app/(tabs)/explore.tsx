// src/app/(tabs)/explore.tsx (atau sesuaikan path-nya)
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import Service API
import { fetchArtists } from "../../lib/artistService"; 
import { fetchEvents } from "../../lib/eventService";

const COLORS = {
  primary: "#F191AC",
  primaryLight: "#F8CBD7",
  primaryDark: "#C2607A",
  bg: "#F9F3F3",
  cardBg: "#FFFFFF",
  inputBg: "#FAF0F2",
  textMain: "#4A232E",
  textMuted: "#8C5866",
  textLight: "#B38B95",
  white: "#FFFFFF",
  border: "rgba(194, 96, 122, 0.12)",
};

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // State dari Backend
  const [artists, setArtists] = useState<any[]>([]);
  const [popularEvents, setPopularEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Data dari Backend & AsyncStorage saat halaman dibuka
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. Ambil data Artists
        const fetchedArtists = await fetchArtists();
        setArtists(fetchedArtists.slice(0, 5)); // Ambil 5 teratas buat Trending

        // 2. Ambil data Events untuk Popular Searches (Ambil 4 event terbaru)
        const fetchedEvents = await fetchEvents();
        setPopularEvents(fetchedEvents.slice(0, 4));

        // 3. Ambil riwayat pencarian dari HP
        const storedSearches = await AsyncStorage.getItem("recent_searches");
        if (storedSearches) {
          setRecentSearches(JSON.parse(storedSearches));
        }
      } catch (error) {
        console.error("Gagal load data explore:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Simpan riwayat pencarian ke AsyncStorage
  const saveRecentSearches = async (newSearches: string[]) => {
    setRecentSearches(newSearches);
    await AsyncStorage.setItem("recent_searches", JSON.stringify(newSearches));
  };

  const handleRemoveRecent = (itemToRemove: string) => {
    const filtered = recentSearches.filter((item) => item !== itemToRemove);
    saveRecentSearches(filtered);
  };

  const handleClearAllRecent = () => {
    saveRecentSearches([]);
  };

  // Navigasi ke Halaman Artist
  const handleArtistPress = (artistId: string) => {
    router.push(`/artist/${artistId}` as Href);
  };

  // Navigasi ke Detail Event / Concert
  const handlePopularPress = (eventId: string, title: string) => {
    if (!recentSearches.includes(title)) {
      const newSearches = [title, ...recentSearches].slice(0, 5); // Maksimal 5
      saveRecentSearches(newSearches);
    }
    router.push(`/concert/${eventId}` as Href);
  };

  // Handler Submit Input Search
  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    if (!recentSearches.includes(query)) {
      const newSearches = [query, ...recentSearches].slice(0, 5);
      saveRecentSearches(newSearches);
    }
    
    // Cari event yang cocok di popularEvents
    const foundEvent = popularEvents.find((e) => 
      e.title.toLowerCase().includes(query.toLowerCase())
    );

    if (foundEvent) {
      router.push(`/concert/${foundEvent.id}` as Href);
    } else {
      // Kalau nggak ketemu, arahkan ke home atau halaman search (sementara ke home)
      router.push("/(tabs)/index" as Href);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === "ios" ? insets.top + 10 : 20,
          paddingBottom: 100,
        }}
      >
        {/* Search Bar Input */}
        <View style={styles.searchBarContainer}>
          <View style={styles.inputBox}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Search for artists, tours, or cities..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearchSubmit(searchQuery)}
              returnKeyType="search"
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Trending Artists Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Artists</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.artistsScroll}
          >
            {artists.map((artist) => (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistCard}
                activeOpacity={0.8}
                onPress={() => handleArtistPress(artist.id)}
              >
                <View style={styles.artistImageRing}>
                  <Image 
                    source={{ uri: artist.photo || "https://via.placeholder.com/150" }} 
                    style={styles.artistImage} 
                  />
                </View>
                <Text style={styles.artistName} numberOfLines={1}>
                  {artist.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Recent Searches Section */}
        {recentSearches.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={handleClearAllRecent} activeOpacity={0.7}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsContainer}>
              {recentSearches.map((item, index) => (
                <View key={index} style={styles.chip}>
                  <TouchableOpacity onPress={() => handleSearchSubmit(item)}>
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveRecent(item)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={14} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Popular Events Section (Menggantikan Popular Searches Dummy) */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
            Popular Events
          </Text>

          {isLoading ? (
             <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <View style={styles.popularList}>
              {popularEvents.map((event, index) => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.popularRow,
                    index === popularEvents.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handlePopularPress(event.id, event.title)}
                >
                  <View style={styles.popularLeft}>
                    <Text style={styles.rankText}>0{index + 1}</Text>
                    <Text style={styles.popularQuery} numberOfLines={1}>{event.title}</Text>
                  </View>
                  <Ionicons
                    name="trending-up-outline"
                    size={18}
                    color={COLORS.primaryDark}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMain,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textMain,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  clearText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  artistsScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 16,
    marginBottom: 24,
  },
  artistCard: {
    alignItems: "center",
    width: 72,
  },
  artistImageRing: {
    padding: 3,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: 6,
  },
  artistImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.inputBg,
  },
  artistName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMain,
    textAlign: "center",
  },
  sectionBlock: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMain,
  },
  popularList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    elevation: 1,
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  popularRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  popularLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  rankText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  popularQuery: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMain,
    flex: 1,
  },
});