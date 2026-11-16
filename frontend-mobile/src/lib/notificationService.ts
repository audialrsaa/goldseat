// src/lib/notificationService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "./api";

export const fetchMyNotifications = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) return [];

    // Tarik data Order dan Ticket secara bersamaan
    const [ordersRes, ticketsRes] = await Promise.all([
      fetch(ENDPOINTS.myOrders, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(ENDPOINTS.tickets, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ]);

    const ordersJson = await ordersRes.json();
    const ticketsJson = await ticketsRes.json();

    let alerts: any[] = [];

    // 1. Mapping dari Orders
    if (ordersJson.status === "success") {
      ordersJson.data.forEach((order: any) => {
        if (order.status === "paid") {
          alerts.push({
            id: `order-${order.id}`,
            type: "payment",
            title: "Payment Successful",
            message: `Pesanan ${order.order_number} berhasil dibayar.`,
            time: new Date(order.updated_at || Date.now()).toLocaleDateString("id-ID"),
            read: false,
          });
        }
      });
    }

    // 2. Mapping dari Tickets
    if (ticketsJson.status === "success") {
      ticketsJson.data.forEach((ticket: any) => {
        if (ticket.status === "issued") {
          alerts.push({
            id: `ticket-${ticket.id}`,
            type: "ticket",
            title: "Ticket Confirmed!",
            message: `Tiket dengan nomor ${ticket.ticket_number} sudah terbit.`,
            time: new Date(ticket.created_at || Date.now()).toLocaleDateString("id-ID"),
            read: false,
          });
        } else if (ticket.status === "used") {
          alerts.push({
            id: `ticket-used-${ticket.id}`,
            type: "reminder",
            title: "Ticket Used",
            message: `Tiket ${ticket.ticket_number} telah berhasil di-scan.`,
            time: new Date(ticket.updated_at || Date.now()).toLocaleDateString("id-ID"),
            read: true,
          });
        }
      });
    }

    return alerts;

  } catch (error) {
    console.error("Error fetch notifications:", error);
    return [];
  }
};