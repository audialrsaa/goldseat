// Base URL backend (Flask). Atur lewat .env, fallback ke localhost:5000.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const ENDPOINTS = {
  login: `${API_URL}/api/auth/login`,
  register: `${API_URL}/api/auth/register`,
  me: `${API_URL}/api/auth/me`,
  // Trailing slash wajib: tanpa slash Flask redirect 308,
  // dan redirect diblokir preflight CORS.
  events: `${API_URL}/api/events/`,
  // Perhatikan prefix /api/admin/ untuk kategori (butuh JWT)
  eventCategories: `${API_URL}/api/admin/event-categories/`,
};