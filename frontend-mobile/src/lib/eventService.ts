// src/lib/eventService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "./api";

const getToken = async () => await AsyncStorage.getItem("access_token");

export const fetchCategories = async () => {
  try {
    const token = await getToken();

    // Kategori ada di /api/admin/ dan butuh JWT.
    // Belum login: lewati request, kembalikan list kosong.
    if (!token) return [];

    const response = await fetch(ENDPOINTS.eventCategories, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await response.json();
    if (json.status === "success") {
      return json.data.map((cat: any) => ({
        id: cat.id.toString(),
        name: cat.name,
        icon: "musical-notes", // Icon default, bisa disesuaikan
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetch categories:", error);
    return [];
  }
};

export const fetchEvents = async () => {
  try {
    const response = await fetch(ENDPOINTS.events, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();
    if (json.status === "success") {
      return json.data.map((ev: any) => {
        const dateObj = ev.event_date ? new Date(ev.event_date) : new Date();
        const month = dateObj.toLocaleString("default", { month: "short" });
        const day = dateObj.getDate();

        return {
          id: ev.id.toString(),
          title: ev.title || "Untitled Event",
          subtitle: ev.description || "Event description",
          venue: ev.venue?.name || ev.venue_name || "Venue TBA",
          price: ev.ticket_price ? `Rp ${ev.ticket_price}` : "Rp -",
          image: ev.poster || ev.banner || "https://via.placeholder.com/400",
          date: `${day} ${month}`,
          rawDate: ev.event_date,
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetch events:", error);
    return [];
  }
};