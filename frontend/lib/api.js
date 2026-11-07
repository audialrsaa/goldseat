// lib/api.js
// helper buat manggil endpoint auth di backend flask (auth_controller.py)
// sesuaikan API_BASE_URL dan prefix "/auth" kalau url_prefix blueprint-nya beda

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function handleResponse(res) {
  let data = {};
  try {
    data = await res.json();
  } catch (e) {
    // response kosong / bukan json
  }

  if (!res.ok) {
    const error = new Error(data.message || "terjadi kesalahan, coba lagi");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function registerUser({ full_name, email, phone, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, phone, password }),
  });
  return handleResponse(res);
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export function saveSession({ access_token, user }) {
  if (typeof window === "undefined") return;
  localStorage.setItem("smencore_token", access_token);
  localStorage.setItem("smencore_user", JSON.stringify(user));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smencore_token");
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("smencore_token");
  localStorage.removeItem("smencore_user");
  document.cookie = "smencore_token=; path=/; max-age=0";
}

export function getUserRole() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("smencore_user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.role || null;
  } catch {
    return null;
  }
}
