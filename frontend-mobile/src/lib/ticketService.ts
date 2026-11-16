// src/lib/ticketService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "./api";

export const fetchMyTickets = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) return [];

    const response = await fetch(ENDPOINTS.tickets, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();

    if (json.status === "success") {
      return json.data.map((ticket: any) => ({
        id: ticket.id.toString(),
        type: "E-TICKET", 
        title: ticket.event_name || "Event Name", 
        subtitle: ticket.ticket_number ? `No. ${ticket.ticket_number}` : "Standard",
        date: ticket.event_date || "TBA",
        venue: ticket.venue_name || "Venue TBA",
        status: ticket.status === "issued" ? "upcoming" : (ticket.status === "used" ? "used" : "active"),
        seat: ticket.seat_name || ticket.seat_number || "General Admission",
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetch my tickets:", error);
    return [];
  }
};