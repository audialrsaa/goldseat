"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Download, AlertTriangle } from "lucide-react";

import SuperAdminSidebar from "../components/SuperAdminSidebar";

// Aman dipakai baik env berisi "http://localhost:5000" maupun "http://localhost:5000/api"
const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "") + "/api";
const PAGE_SIZE = 8;

const STATUS_STYLES = {
  aktif: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "sold out": "border-red-400/30 bg-red-400/10 text-red-300",
  nonaktif: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
  "belum mulai": "border-amber-400/30 bg-amber-400/10 text-amber-300",
  berakhir: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
};

const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function getStatus(cat) {
  const now = new Date();
  const start = cat.sale_start_at ? new Date(cat.sale_start_at) : null;
  const end = cat.sale_end_at ? new Date(cat.sale_end_at) : null;

  if (!cat.active) return "nonaktif";
  if (Number(cat.sold) >= Number(cat.stock) && Number(cat.stock) > 0)
    return "sold out";
  if (start && now < start) return "belum mulai";
  if (end && now > end) return "berakhir";
  return "aktif";
}

export default function TicketCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catRes, evRes] = await Promise.all([
        fetch(`${API_URL}/ticket-categories/`),
        fetch(`${API_URL}/events/`),
      ]);

      const catJson = await catRes.json();
      if (!catRes.ok) throw new Error(catJson.message || "Gagal memuat data");
      setCategories(catJson.data || []);

      // daftar event hanya untuk nama & filter, tidak fatal jika gagal
      if (evRes.ok) {
        const evJson = await evRes.json();
        setEvents(evJson.data || []);
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const eventName = useCallback(
    (id) => {
      const ev = events.find((e) => String(e.id) === String(id));
      return ev?.title || ev?.name || `Event #${id}`;
    },
    [events]
  );

  const rows = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        status: getStatus(c),
        eventLabel: eventName(c.event_id),
      })),
    [categories, eventName]
  );

  const stats = useMemo(() => {
    const totalStock = rows.reduce((a, c) => a + Number(c.stock || 0), 0);
    const totalSold = rows.reduce((a, c) => a + Number(c.sold || 0), 0);
    const revenue = rows.reduce(
      (a, c) => a + Number(c.sold || 0) * Number(c.price || 0),
      0
    );
    return {
      total: rows.length,
      active: rows.filter((c) => c.status === "aktif").length,
      totalStock,
      totalSold,
      revenue,
      soldPct: totalStock ? Math.round((totalSold / totalStock) * 100) : 0,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((c) => {
      if (eventFilter !== "all" && String(c.event_id) !== eventFilter)
        return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (
        q &&
        !`${c.name} ${c.eventLabel}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rows, search, eventFilter, statusFilter]);

  useEffect(() => setPage(1), [search, eventFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // kategori yang stoknya hampir habis (>= 80% terjual, belum sold out)
  const lowStock = useMemo(
    () =>
      rows
        .filter(
          (c) =>
            c.active &&
            Number(c.stock) > 0 &&
            Number(c.sold) < Number(c.stock) &&
            Number(c.sold) / Number(c.stock) >= 0.8
        )
        .sort(
          (a, b) => b.sold / b.stock - a.sold / a.stock
        )
        .slice(0, 6),
    [rows]
  );

  const exportCsv = () => {
    const header = [
      "ID",
      "Event",
      "Kategori",
      "Harga",
      "Stok",
      "Terjual",
      "Status",
      "Mulai Jual",
      "Akhir Jual",
    ];
    const lines = filtered.map((c) =>
      [
        c.id,
        c.eventLabel,
        c.name,
        c.price,
        c.stock,
        c.sold,
        c.status,
        c.sale_start_at || "",
        c.sale_end_at || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ticket-categories.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: "Total Kategori",
      value: stats.total,
      sub: `${stats.active} kategori aktif`,
      tone: "text-emerald-400",
    },
    {
      label: "Total Stok",
      value: stats.totalStock.toLocaleString("id-ID"),
      sub: "kapasitas seluruh kategori",
      tone: "text-zinc-500",
    },
    {
      label: "Tiket Terjual",
      value: stats.totalSold.toLocaleString("id-ID"),
      sub: `${stats.soldPct}% dari total stok`,
      tone: "text-emerald-400",
    },
    {
      label: "Estimasi Revenue",
      value: rupiah(stats.revenue),
      sub: "terjual × harga tiket",
      tone: "text-zinc-500",
    },
  ];

  const selectClass =
    "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-violet-400/50";

  return (
    <div className="flex min-h-screen bg-[#07070b] text-zinc-100">
      <SuperAdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOPBAR */}
        <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-8 py-4">
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold text-white">
              Ticket Categories
            </div>
            <div className="font-mono text-[11px] tracking-wide text-zinc-500">
              Super Admin / Ticketing / Ticket Categories
            </div>
          </div>

          <div className="relative hidden w-full max-w-md lg:block">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori atau event..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-violet-400/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-zinc-800 px-3 py-2 font-mono text-[13px] text-zinc-200">
              Super Admin
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500 text-sm font-bold text-white">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">
          {/* HEADING */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">
                Ticket Categories
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Monitoring stok, penjualan, dan status seluruh kategori tiket di
                SMEncore
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-200 transition-colors hover:bg-zinc-900 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <button
                onClick={exportCsv}
                disabled={!filtered.length}
                className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle size={16} />
              <span className="flex-1">{error}</span>
              <button onClick={fetchData} className="underline">
                Coba lagi
              </button>
            </div>
          )}

          {/* STAT CARDS */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6"
              >
                <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  {s.label}
                </div>
                <div className="mt-3 font-display text-3xl font-bold text-white">
                  {loading ? "…" : s.value}
                </div>
                <div className={`mt-2 text-[13px] ${s.tone}`}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* TABLE + SIDE PANEL */}
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-semibold text-white">
                  Daftar Kategori Tiket
                </h2>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className={selectClass}
                  >
                    <option value="all">Semua Event</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={String(ev.id)}>
                        {ev.title || ev.name || `Event #${ev.id}`}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={selectClass}
                  >
                    <option value="all">Semua Status</option>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                    <option value="sold out">Sold Out</option>
                    <option value="belum mulai">Belum Mulai</option>
                    <option value="berakhir">Berakhir</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-800 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                      <th className="pb-3 pr-4 font-medium">Kategori</th>
                      <th className="pb-3 pr-4 font-medium">Harga</th>
                      <th className="pb-3 pr-4 font-medium">Penjualan</th>
                      <th className="pb-3 pr-4 font-medium">Periode Jual</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-zinc-900">
                          <td colSpan={5} className="py-4">
                            <div className="h-4 animate-pulse rounded bg-zinc-900" />
                          </td>
                        </tr>
                      ))}

                    {!loading && paged.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-16 text-center text-sm text-zinc-500"
                        >
                          belum ada kategori tiket
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      paged.map((c) => {
                        const pct = c.stock
                          ? Math.min(
                              100,
                              Math.round((c.sold / c.stock) * 100)
                            )
                          : 0;
                        return (
                          <tr
                            key={c.id}
                            className="border-b border-zinc-900 transition-colors hover:bg-zinc-900/40"
                          >
                            <td className="py-4 pr-4">
                              <div className="font-semibold text-white">
                                {c.name}
                              </div>
                              <div className="mt-0.5 text-[12px] text-zinc-500">
                                {c.eventLabel}
                              </div>
                            </td>

                            <td className="py-4 pr-4 text-zinc-200">
                              {rupiah(c.price)}
                            </td>

                            <td className="py-4 pr-4">
                              <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
                                <span>
                                  {c.sold}/{c.stock}
                                </span>
                                <span>{pct}%</span>
                              </div>
                              <div className="mt-1.5 h-1.5 w-36 overflow-hidden rounded-full bg-zinc-800">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 100
                                      ? "bg-red-400"
                                      : pct >= 80
                                      ? "bg-amber-400"
                                      : "bg-gradient-to-r from-violet-500 to-violet-400"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-4 pr-4 font-mono text-[11px] text-zinc-400">
                              {formatDate(c.sale_start_at)}
                              <span className="mx-1 text-zinc-600">→</span>
                              {formatDate(c.sale_end_at)}
                            </td>

                            <td className="py-4">
                              <span
                                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                                  STATUS_STYLES[c.status]
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {!loading && filtered.length > 0 && (
                <div className="mt-5 flex items-center justify-between font-mono text-[11px] text-zinc-500">
                  <span>
                    {filtered.length} kategori · halaman {page}/{totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-md border border-zinc-800 px-3 py-1.5 text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-md border border-zinc-800 px-3 py-1.5 text-zinc-300 hover:bg-zinc-900 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* STOK HAMPIR HABIS */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
              <h2 className="font-display text-base font-semibold text-white">
                Stok Hampir Habis
              </h2>
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                ≥ 80% terjual
              </p>

              {lowStock.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
                  belum ada kategori kritis
                </div>
              ) : (
                <ul className="mt-5 flex flex-col gap-4">
                  {lowStock.map((c) => {
                    const pct = Math.round((c.sold / c.stock) * 100);
                    return (
                      <li key={c.id}>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-semibold text-white">
                            {c.name}
                          </span>
                          <span className="font-mono text-[11px] text-amber-300">
                            sisa {c.stock - c.sold}
                          </span>
                        </div>
                        <div className="text-[12px] text-zinc-500">
                          {c.eventLabel}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}