// lib/dashboard-api.js
// ambil data dashboard superadmin dari backend flask
// endpoint ini butuh dashboard_controller.py (get_dashboard_stats)
// yang di-mount di GET /api/admin/dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function fetchDashboardStats(token) {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`gagal mengambil data dashboard (${res.status})`);
  }

  const json = await res.json();

  return json.data;
}

// format rupiah singkat: 4820000000 -> "Rp 4,82 M"
export function formatRupiahShort(value) {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
  }

  if (abs >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")} Jt`;
  }

  if (abs >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(0)} Rb`;
  }

  return `Rp ${value.toFixed(0)}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatTimeAgo(iso) {
  const then = new Date(iso).getTime();
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