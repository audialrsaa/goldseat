import { getToken } from "./api";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body || body.status === "error") {
    throw new Error(
      body?.message || `Permintaan gagal (${response.status})`
    );
  }

  return body.data;
}

export async function fetchOngoingEvents() {
  const events = await request("/events/ongoing");

  if (!Array.isArray(events)) {
    throw new Error("Format daftar event dari server tidak valid.");
  }

  return events;
}

export async function fetchAllEvents() {
  const events = await request("/events/");

  if (!Array.isArray(events)) {
    throw new Error("Format daftar event dari server tidak valid.");
  }

  return events;
}

export async function fetchCheckinDashboard() {
  const dashboard = await request("/check-ins/dashboard");

  if (!dashboard || typeof dashboard !== "object") {
    throw new Error("Format dashboard check-in dari server tidak valid.");
  }

  return dashboard;
}

export async function fetchCheckinHistory({
  eventId,
  page = 1,
  perPage = 20,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  if (eventId) {
    params.set("event_id", String(eventId));
  }

  const result = await request(
    `/check-ins/history?${params.toString()}`
  );

  if (!Array.isArray(result?.data) || !result?.pagination) {
    throw new Error("Format riwayat check-in dari server tidak valid.");
  }

  return result;
}

export async function submitTicketCheckin({ qr_code, event_id }) {
  const result = await request("/tickets/check-in", {
    method: "POST",
    body: JSON.stringify({ qr_code, event_id }),
  });

  if (!result?.ticket || !result?.checkin) {
    throw new Error("Format hasil check-in dari server tidak valid.");
  }

  return result;
}
