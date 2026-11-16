export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";

export const ENDPOINTS = {
  login: `${API_URL}/api/auth/login`,
  register: `${API_URL}/api/auth/register`,
  me: `${API_URL}/api/auth/me`,

  events: `${API_URL}/api/events/`,
  eventCategories: `${API_URL}/api/admin/event-categories/`,
  artists: `${API_URL}/api/artists/`, 
  
  myOrders: `${API_URL}/api/orders/my`,
  tickets: `${API_URL}/api/tickets/`,
};