
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Mengolah response backend
async function handleResponse(res) {
  let data = {};

  try {
    data = await res.json();
  } catch {
    // Response kosong atau bukan JSON
  }

  if (!res.ok) {
    const error = new Error(
      data.message || "Terjadi kesalahan, coba lagi"
    );

    error.status = res.status;
    error.data = data;

    throw error;
  }

  return data;
}

// REGISTER
export async function registerUser({
  full_name,
  email,
  phone,
  password,
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name,
      email,
      phone,
      password,
    }),
  });

  return handleResponse(res);
}

// LOGIN
export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return handleResponse(res);
}

// GET USER PROFILE
export async function getMe(token) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return handleResponse(res);
}

// SIMPAN SESSION
export function saveSession({ access_token, user }) {
  if (typeof window === "undefined") return;

  localStorage.setItem("smencore_token", access_token);
  localStorage.setItem("smencore_user", JSON.stringify(user));
}

// AMBIL TOKEN
export function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("smencore_token");
}

// HAPUS SESSION
export function clearSession() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("smencore_token");
  localStorage.removeItem("smencore_user");
}

// AMBIL ROLE USER
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
