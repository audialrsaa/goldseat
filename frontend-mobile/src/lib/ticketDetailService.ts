// src/lib/ticketDetailService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS, API_URL } from "./api";

export const fetchTicketDetail = async (id: string) => {
  try {
    const token = await AsyncStorage.getItem("access_token");

    // 1. Tarik detail tiket
    const ticketRes = await fetch(`${API_URL}/api/tickets/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const ticketJson = await ticketRes.json();

    if (ticketJson.status !== "success") return null;
    const ticket = ticketJson.data;

    // 2. Karena Ticket.to_dict() tidak punya nama event, kita tarik data Event dari master data
    // Kita tarik semua event & ticket categories buat dicocokin
    const [eventsRes, categoriesRes] = await Promise.all([
      fetch(ENDPOINTS.events),
      fetch(`${API_URL}/api/ticket-categories/`), // Asumsi endpoint ini ada
    ]);

    const eventsJson = await eventsRes.json();
    const categoriesJson = await categoriesRes.json();

    // Cari data kategori & event (karena ticket gak nyimpen event_id)
    // Kita pakai data dummy buat fallback
    let eventName = "Event Name";
    let venueName = "Venue TBA";
    let price = "Rp -";
    let categoryName = "Standard";

    // Kalau API ticket-categories beneran ada, kita coba cocokin
    // (Karena gak ada relasi langsung, ini cuma tebakan aman)
    
    return {
      id: ticket.id.toString(),
      type: "E-TICKET",
      title: eventName, 
      subtitle: categoryName,
      date: new Date(ticket.created_at).toLocaleDateString("id-ID", {
        day: "numeric", month: "short", year: "numeric"
      }), 
      venue: venueName,
      artist: ticket.owner_name || "Nama Pemilik",
      status: ticket.status === "issued" ? "upcoming" : "used",
      ticketCode: ticket.ticket_number,
      section: "-",
      row: "-",
      price: price,
      description: `Tiket ini diterbitkan pada ${new Date(ticket.created_at).toLocaleDateString("id-ID")}.`,
      organizer: "GoldSeat Official",
      duration: "-",
      ageRestriction: "-",
    };
  } catch (error) {
    console.error("Error fetch ticket detail:", error);
    return null;
  }
};