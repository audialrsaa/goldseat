// src/lib/artistService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "./api";

export const fetchArtists = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    
    const response = await fetch(ENDPOINTS.artists, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    const json = await response.json();
    
    if (json.status === "success") {
      return json.data.map((artist: any) => ({
        id: artist.id.toString(),
        name: artist.name,
        photo: artist.photo || "https://via.placeholder.com/150", 
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetch artists:", error);
    return [];
  }
};