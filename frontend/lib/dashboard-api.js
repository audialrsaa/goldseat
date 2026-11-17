
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// AMBIL DATA DASHBOARD SUPER ADMIN
export async function fetchDashboardStats(token) {
  if (!token) {
    throw new Error("Token autentikasi tidak ditemukan.");
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/dashboard`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      }
    );

    let json = {};

    try {
      json = await res.json();
    } catch {
      // Response bukan JSON
    }

    if (!res.ok) {
      throw new Error(
        json.message ||
        `Gagal mengambil data dashboard (${res.status})`
      );
    }

    return json.data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Request dashboard timeout. Periksa backend Flask."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// FORMAT RUPIAH
export function formatRupiahShort(value = 0) {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000)
      .toFixed(2)
      .replace(".", ",")} M`;
  }

  if (abs >= 1_000_000) {
    return `Rp ${(value / 1_000_000)
      .toFixed(1)
      .replace(".", ",")} Jt`;
  }

  if (abs >= 1_000) {
    return `Rp ${(value / 1_000)
      .toFixed(0)} Rb`;
  }

  return `Rp ${value.toFixed(0)}`;
}

// FORMAT ANGKA
export function formatNumber(value = 0) {
  return new Intl.NumberFormat("id-ID").format(value);
}

// FORMAT WAKTU
export function formatTimeAgo(iso) {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) return "-";

  const now = Date.now();

  const diffMs = Math.max(0, now - then);
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} mnt`;

  const diffHour = Math.floor(diffMin / 60);

  if (diffHour < 24) return `${diffHour} jam`;

  const diffDay = Math.floor(diffHour / 24);

  return `${diffDay} hari`;
}
