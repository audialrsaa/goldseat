
"use client";

import { useEffect, useMemo, useState } from "react";

// =========================================================
// CONFIG
// =========================================================

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

// =========================================================
// HELPERS
// =========================================================

// Ambil token JWT dari localStorage.
function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("smencore_token");
}

// Decode payload JWT untuk mengambil informasi user.
// Ini hanya untuk membaca payload di frontend.
// Verifikasi token tetap dilakukan oleh backend.
function decodeJwt(token) {
  try {
    if (!token) return null;

    const payload = token.split(".")[1];

    if (!payload) return null;

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedBase64 = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "="
    );

    const json = atob(paddedBase64);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Request GET ke backend Flask.
async function apiGet(path) {
  const token = getToken();

  // Pastikan prefix /api tidak ditambahkan dua kali.
  const endpoint = path.startsWith("/api/")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || body.status === "error") {
    throw new Error(
      body.message || `Gagal memuat ${path}`
    );
  }

  return body.data;
}

// Format rupiah.
function formatRupiah(value) {
  const amount = Number(value) || 0;

  if (amount >= 1_000_000_000) {
    return `Rp${(amount / 1_000_000_000)
      .toFixed(2)
      .replace(/\.00$/, "")} M`;
  }

  if (amount >= 1_000_000) {
    return `Rp${(amount / 1_000_000)
      .toFixed(1)
      .replace(/\.0$/, "")} Jt`;
  }

  return `Rp${amount.toLocaleString("id-ID")}`;
}

// Format angka.
function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("id-ID");
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({
  label,
  value,
  trend,
  trendUp,
  loading,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#121016] p-5">
      <p className="text-[11px] tracking-wide text-white/40">
        {label}
      </p>

      {loading ? (
        <div className="mt-3 h-8 w-24 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="mt-2 text-3xl font-semibold text-white">
          {value}
        </p>
      )}

      {trend != null && !loading && (
        <p
          className={`mt-2 text-xs font-medium ${
            trendUp
              ? "text-emerald-400"
              : "text-rose-400"
          }`}
        >
          {trendUp ? "▲" : "▼"} {trend}
        </p>
      )}
    </div>
  );
}

// =========================================================
// SALES BAR CHART
// =========================================================

function SalesBarChart({ data, loading }) {
  const max = Math.max(
    1,
    ...data.map((d) => d.value)
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121016] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">
          Penjualan Tiket — per Event
        </h3>

        <span className="text-xs text-white/40">
          Event Saya
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-end gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-md bg-white/10"
              style={{
                height: `${40 + (i % 3) * 20}%`,
              }}
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-white/40">
          Belum ada data penjualan.
        </div>
      ) : (
        <div className="flex h-64 items-end gap-3">
          {data.map((d) => {
            const heightPct = Math.max(
              6,
              (d.value / max) * 100
            );

            const isTop = d.value === max && max > 0;

            return (
              <div
                key={d.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${heightPct}%`,
                    background: isTop
                      ? "linear-gradient(180deg, #f5b942, #b8791f)"
                      : "linear-gradient(180deg, #8b5cf6, #4c2f8f)",
                  }}
                  title={`${d.label}: ${formatNumber(
                    d.value
                  )} tiket`}
                />

                <span className="max-w-[64px] truncate text-[10px] text-white/40">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =========================================================
// DASHBOARD PAGE
// =========================================================

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [events, setEvents] = useState([]);
  const [ticketCategories, setTicketCategories] = useState([]);
  const [refunds, setRefunds] = useState([]);

  // =======================================================
  // LOAD DATA
  // =======================================================

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const token = getToken();

        if (!token) {
          throw new Error(
            "Token login tidak ditemukan. Silakan login kembali."
          );
        }

        const me = decodeJwt(token);

        const myUserId =
          me?.sub ??
          me?.identity ??
          me?.user_id ??
          me?.id ??
          null;

        const [
          eventsData,
          ticketCategoriesData,
          refundsData,
        ] = await Promise.all([
          apiGet("/events"),
          apiGet("/ticket-categories"),

          // Refund mungkin hanya dapat diakses role tertentu.
          apiGet("/refunds").catch(() => []),
        ]);

        if (cancelled) return;

        // Filter event berdasarkan pemiliknya.
        const myEvents = myUserId
          ? eventsData.filter(
              (event) =>
                String(event.created_by) ===
                String(myUserId)
            )
          : eventsData;

        setEvents(
          Array.isArray(myEvents) ? myEvents : []
        );

        setTicketCategories(
          Array.isArray(ticketCategoriesData)
            ? ticketCategoriesData
            : []
        );

        setRefunds(
          Array.isArray(refundsData)
            ? refundsData
            : []
        );
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // =======================================================
  // EVENT IDS
  // =======================================================

  const myEventIds = useMemo(
    () => new Set(events.map((event) => event.id)),
    [events]
  );

  // =======================================================
  // FILTER TICKET CATEGORIES
  // =======================================================

  const myTicketCategories = useMemo(
    () =>
      ticketCategories.filter((tc) =>
        myEventIds.has(tc.event_id)
      ),
    [ticketCategories, myEventIds]
  );

  // =======================================================
  // REVENUE
  // =======================================================

  const revenue = useMemo(
    () =>
      myTicketCategories.reduce(
        (sum, tc) =>
          sum +
          (Number(tc.price) || 0) *
            (Number(tc.sold) || 0),
        0
      ),
    [myTicketCategories]
  );

  // =======================================================
  // ACTIVE EVENTS
  // =======================================================

  const eventAktifCount = useMemo(
    () =>
      events.filter(
        (event) =>
          event.publish_status === "published"
      ).length,
    [events]
  );

  // =======================================================
  // SOLD TICKETS
  // =======================================================

  const tiketTerjual = useMemo(
    () =>
      myTicketCategories.reduce(
        (sum, tc) =>
          sum + (Number(tc.sold) || 0),
        0
      ),
    [myTicketCategories]
  );

  // =======================================================
  // PENDING REFUNDS
  // =======================================================

  const refundMenunggu = useMemo(
    () =>
      refunds.filter(
        (refund) => refund.status === "requested"
      ).length,
    [refunds]
  );

  // =======================================================
  // SALES BY EVENT
  // =======================================================

  const salesByEvent = useMemo(() => {
    const map = new Map();

    for (const tc of myTicketCategories) {
      const event = events.find(
        (e) => String(e.id) === String(tc.event_id)
      );

      const label = event
        ? event.title
        : `Event #${tc.event_id}`;

      map.set(
        label,
        (map.get(label) || 0) +
          (Number(tc.sold) || 0)
      );
    }

    return Array.from(map.entries())
      .map(([label, value]) => ({
        label,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [myTicketCategories, events]);

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="bg-[#0b0a0f] text-white">

      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <p className="text-xs text-white/40">
            Event Manager / Dashboard
          </p>

          <h1 className="mt-1 text-2xl font-semibold">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-white/50">
            Performa event yang kamu kelola
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            Gagal memuat data dashboard: {error}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            label="REVENUE EVENT SAYA"
            value={formatRupiah(revenue)}
            loading={loading}
          />

          <StatCard
            label="EVENT AKTIF"
            value={formatNumber(eventAktifCount)}
            loading={loading}
          />

          <StatCard
            label="TIKET TERJUAL"
            value={formatNumber(tiketTerjual)}
            loading={loading}
          />

          <StatCard
            label="REFUND MENUNGGU"
            value={formatNumber(refundMenunggu)}
            loading={loading}
          />

        </div>

        {/* SALES CHART */}
        <SalesBarChart
          data={salesByEvent}
          loading={loading}
        />

      </main>
    </div>
  );
}
