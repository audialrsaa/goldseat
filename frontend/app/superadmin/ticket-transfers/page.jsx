"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, RefreshCw, Download, AlertTriangle } from "lucide-react";

import SuperAdminSidebar from "../components/SuperAdminSidebar";
import { getToken } from "../../../lib/api";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "") + "/api";

const PAGE_SIZE = 8;


const STATUS_STYLES = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  accepted: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-red-400/30 bg-red-400/10 text-red-300",
  expired: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
};

function parseDate(value) {
  if (!value) return null;
  const s = String(value);
  const hasTz = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  const d = new Date(hasTz ? s : s.replace(" ", "T") + "Z");
  return isNaN(d) ? null : d;
}

const formatDateTime = (value) => {
  const d = parseDate(value);
  if (!d) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function timeLeft(value) {
  const d = parseDate(value);
  if (!d) return "-";
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return "lewat batas";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}j ${m}m lagi` : `${m}m lagi`;
}

// pending yang sudah lewat expires_at dianggap expired di tampilan
function effectiveStatus(t) {
  if (t.status === "pending") {
    const exp = parseDate(t.expires_at);
    if (exp && exp.getTime() < Date.now()) return "expired";
  }
  return t.status || "pending";
}

export default function TicketTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const initialFetchStarted = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getToken();
      if (!token) {
        throw new Error(
          "Token tidak ditemukan. Silakan login sebagai Super Admin terlebih dahulu."
        );
      }

      const res = await fetch(`${API_URL}/ticket-transfers/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        throw new Error(
          json.message || json.msg || "Sesi tidak valid. Silakan login ulang."
        );
      }
      if (!res.ok) {
        throw new Error(
          json.message ||
            json.msg ||
            `Gagal memuat data (HTTP ${res.status}).`
        );
      }
      if (!Array.isArray(json.data)) {
        throw new Error("Format data ticket transfer dari server tidak valid.");
      }

      setTransfers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFetchStarted.current) return;
    initialFetchStarted.current = true;
    fetchData();
  }, [fetchData]);

  const rows = useMemo(
    () => transfers.map((t) => ({ ...t, viewStatus: effectiveStatus(t) })),
    [transfers]
  );

  const stats = useMemo(() => {
    const count = (s) => rows.filter((t) => t.viewStatus === s).length;
    const done = count("accepted");
    const closed = done + count("cancelled") + count("expired");
    return {
      total: rows.length,
      pending: count("pending"),
      accepted: done,
      failed: count("cancelled") + count("expired"),
      successRate: closed ? Math.round((done / closed) * 100) : 0,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((t) => {
      if (statusFilter !== "all" && t.viewStatus !== statusFilter) return false;
      if (
        q &&
        !`${t.id} ${t.ticket_id} ${t.from_user_id} ${t.to_user_id ?? ""} ${
          t.to_email ?? ""
        }`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [rows, search, statusFilter]);

  useEffect(() => setPage(1), [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // transfer pending yang akan kedaluwarsa dalam 6 jam
  const expiringSoon = useMemo(() => {
    const limit = Date.now() + 6 * 3600000;
    return rows
      .filter((t) => {
        if (t.viewStatus !== "pending") return false;
        const exp = parseDate(t.expires_at);
        return exp && exp.getTime() <= limit;
      })
      .sort((a, b) => parseDate(a.expires_at) - parseDate(b.expires_at))
      .slice(0, 6);
  }, [rows]);

  const exportCsv = () => {
    const header = [
      "ID",
      "Ticket ID",
      "Dari User ID",
      "Email Penerima",
      "Ke User ID",
      "Status",
      "Kedaluwarsa",
      "Dibuat",
    ];
    const lines = filtered.map((t) =>
      [
        t.id,
        t.ticket_id,
        t.from_user_id,
        t.to_email || "",
        t.to_user_id ?? "",
        t.viewStatus,
        t.expires_at || "",
        t.created_at || "",
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
    a.download = "ticket-transfers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: "Total Transfer",
      value: stats.total,
      sub: "seluruh permintaan transfer",
      tone: "text-zinc-500",
    },
    {
      label: "Menunggu",
      value: stats.pending,
      sub: "belum diterima penerima",
      tone: "text-amber-300",
    },
    {
      label: "Berhasil",
      value: stats.accepted,
      sub: `${stats.successRate}% dari transfer selesai`,
      tone: "text-emerald-400",
    },
    {
      label: "Gagal",
      value: stats.failed,
      sub: "dibatalkan atau kedaluwarsa",
      tone: "text-red-400",
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
              Ticket Transfers
            </div>
            <div className="font-mono text-[11px] tracking-wide text-zinc-500">
              Super Admin / Ticketing / Ticket Transfers
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
              placeholder="Cari email, ID transfer, atau ID tiket..."
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
                Ticket Transfers
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Monitoring perpindahan kepemilikan tiket antar pengguna di
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
                <div className={`mt-2 text-[13px] ${s.tone}`}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* TABLE + SIDE PANEL */}
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-semibold text-white">
                  Riwayat Transfer
                </h2>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-800 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                      <th className="pb-3 pr-4 font-medium">Transfer</th>
                      <th className="pb-3 pr-4 font-medium">Pengirim</th>
                      <th className="pb-3 pr-4 font-medium">Penerima</th>
                      <th className="pb-3 pr-4 font-medium">Kedaluwarsa</th>
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
                          belum ada transfer tiket
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      paged.map((t) => (
                        <tr
                          key={t.id}
                          className="border-b border-zinc-900 transition-colors hover:bg-zinc-900/40"
                        >
                          <td className="py-4 pr-4">
                            <div className="font-semibold text-white">
                              TRF-{t.id}
                            </div>
                            <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                              Tiket #{t.ticket_id}
                            </div>
                          </td>

                          <td className="py-4 pr-4 text-zinc-200">
                            User #{t.from_user_id}
                          </td>

                          <td className="py-4 pr-4">
                            <div className="text-zinc-200">{t.to_email}</div>
                            <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                              {t.to_user_id
                                ? `User #${t.to_user_id}`
                                : "belum terdaftar"}
                            </div>
                          </td>

                          <td className="py-4 pr-4">
                            <div className="font-mono text-[11px] text-zinc-400">
                              {formatDateTime(t.expires_at)}
                            </div>
                            {t.viewStatus === "pending" && (
                              <div className="mt-0.5 font-mono text-[11px] text-amber-300">
                                {timeLeft(t.expires_at)}
                              </div>
                            )}
                          </td>

                          <td className="py-4">
                            <span
                              className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${
                                STATUS_STYLES[t.viewStatus] ||
                                STATUS_STYLES.expired
                              }`}
                            >
                              {t.viewStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {!loading && filtered.length > 0 && (
                <div className="mt-5 flex items-center justify-between font-mono text-[11px] text-zinc-500">
                  <span>
                    {filtered.length} transfer · halaman {page}/{totalPages}
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

            {/* SEGERA KEDALUWARSA */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
              <h2 className="font-display text-base font-semibold text-white">
                Segera Kedaluwarsa
              </h2>
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                pending · kurang dari 6 jam
              </p>

              {expiringSoon.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
                  tidak ada transfer mendesak
                </div>
              ) : (
                <ul className="mt-5 flex flex-col gap-4">
                  {expiringSoon.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3"
                    >
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-semibold text-white">
                          TRF-{t.id}
                        </span>
                        <span className="font-mono text-[11px] text-amber-300">
                          {timeLeft(t.expires_at)}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-[12px] text-zinc-500">
                        Tiket #{t.ticket_id} → {t.to_email}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}