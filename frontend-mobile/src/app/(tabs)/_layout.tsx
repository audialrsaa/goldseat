// src/app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const COLORS = {
  primary: "#F191AC",
  primaryDark: "#C2607A",
  textMuted: "#B0788A",
  white: "#FFFFFF",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "rgba(90,46,59,0.06)",
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          position: "relative",
          overflow: "visible", // Biar tombol melayang gak terpotong
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="my-tickets"
        options={{
          title: "My Tickets",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "ticket" : "ticket-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* FLOATING EXPLORE TAB */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "",
          tabBarIcon: () => (
            <View style={styles.floatingBtnWrapper}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.floatingBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="search" size={22} color={COLORS.white} />
              </LinearGradient>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="notification"
        options={{
          title: "Notification",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* SUB PAGES (HIDDEN FROM TAB BAR) */}
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="profile/help" options={{ href: null }} />
      <Tabs.Screen name="profile/payment" options={{ href: null }} />
      <Tabs.Screen name="profile/language" options={{ href: null }} />
      <Tabs.Screen name="profile/theme" options={{ href: null }} />
      <Tabs.Screen name="profile/about" options={{ href: null }} />
      <Tabs.Screen name="profile/privacy" options={{ href: null }} />
      <Tabs.Screen name="profile/change-password" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingBtnWrapper: {
    position: "absolute",
    top: -18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  floatingBtnGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
});