"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Search, X, Loader2, ChevronDown, ArrowUpRight } from "lucide-react";

import { getToken } from "@/lib/api";

// ============================================================
// KONFIGURASI API
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
const REFUNDS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/refunds`;
const ORDERS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/orders`;

async function apiFetch(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new Error(payload?.message || `Terjadi kesalahan server (${res.status})`);
  }

  return payload;
}

function extractArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

// ============================================================
// HELPERS
// ============================================================

const STATUS_META = {
  requested: { label: "Diajukan", dot: "bg-amber-400", pill: "bg-amber-500/15 text-amber-400" },
  approved: { label: "Disetujui", dot: "bg-emerald-400", pill: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Ditolak", dot: "bg-red-400", pill: "bg-red-500/15 text-red-400" },
  processed: { label: "Diproses", dot: "bg-violet-400", pill: "bg-violet-500/15 text-violet-400" },
};

const STATUS_OPTIONS = ["requested", "approved", "rejected", "processed"];

const REFUND_METHOD_LABEL = {
  original_payment: "Dana ke rekening asal (via Midtrans)",
  bank_transfer: "Transfer Bank",
  wallet_credit: "Saldo / Wallet Credit",
};

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.requested;
}

function formatRupiah(value) {
  const num = Number(value) || 0;
  return `Rp${num.toLocaleString("id-ID")}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })}, ${date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatTimeAgo(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;
  return formatDate(value);
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

// ============================================================
// RINGKASAN / ANALYTICS
// ============================================================

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] p-5">
      <div className="text-xs text-zinc-500 mb-2">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function RefundTrendChart({ refunds }) {
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS_SHORT[d.getMonth()], diajukan: 0, diproses: 0 });
    }
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));

    refunds.forEach((r) => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (byKey[key]) {
        byKey[key].diajukan += 1;
        if (r.status === "processed") byKey[key].diproses += 1;
      }
    });

    return buckets;
  }, [refunds]);

  const max = Math.max(1, ...monthly.map((m) => Math.max(m.diajukan, m.diproses)));

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Tren Pengajuan Refund</h3>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-amber-400" /> Diajukan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-400" /> Diproses
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 h-40">
        {monthly.map((m) => (
          <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end justify-center gap-1 h-32">
              <div
                className="w-1/2 rounded-t bg-amber-400/80"
                style={{ height: `${(m.diajukan / max) * 100}%`, minHeight: m.diajukan ? 4 : 0 }}
                title={`${m.diajukan} diajukan`}
              />
              <div
                className="w-1/2 rounded-t bg-emerald-400/80"
                style={{ height: `${(m.diproses / max) * 100}%`, minHeight: m.diproses ? 4 : 0 }}
                title={`${m.diproses} diproses`}
              />
            </div>
            <span className="text-[11px] text-zinc-500">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDistributionChart({ refunds }) {
  const counts = useMemo(() => {
    const base = { requested: 0, approved: 0, rejected: 0, processed: 0 };
    refunds.forEach((r) => {
      if (base[r.status] !== undefined) base[r.status] += 1;
    });
    return base;
  }, [refunds]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const COLORS = {
    requested: "#fbbf24",
    approved: "#34d399",
    rejected: "#f87171",
    processed: "#a78bfa",
  };

  let cumulative = 0;
  const segments = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => {
      const pct = total ? (count / total) * 100 : 0;
      const start = cumulative;
      cumulative += pct;
      return { status, count, pct, start, end: cumulative, color: COLORS[status] };
    });

  const gradient =
    total === 0
      ? "#27272a"
      : `conic-gradient(${segments
          .map((s) => `${s.color} ${s.start}% ${s.end}%`)
          .join(", ")})`;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] p-5">
      <h3 className="text-sm font-semibold text-white mb-5">Distribusi Status Refund</h3>

      <div className="flex items-center gap-6">
        <div
          className="relative w-32 h-32 rounded-full shrink-0"
          style={{ background: gradient }}
        >
          <div className="absolute inset-3 rounded-full bg-[#12151c] flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">{total}</span>
            <span className="text-[10px] text-zinc-500">Total</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {STATUS_OPTIONS.map((status) => (
            <div key={status} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-zinc-400">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[status] }}
                />
                {STATUS_META[status].label}
              </span>
              <span className="text-white font-medium">{counts[status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentRefundsList({ refunds, onSelect }) {
  const recent = useMemo(() => {
    return [...refunds]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 4);
  }, [refunds]);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Pengajuan Refund Terbaru</h3>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6 text-center">Belum ada pengajuan refund.</p>
      ) : (
        <div className="divide-y divide-zinc-800/60">
          {recent.map((r) => {
            const meta = statusMeta(r.status);
            return (
              <div key={r.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400">#ORD-{r.order_id}</span>
                    <span className="text-[11px] text-zinc-600">{formatTimeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 truncate mt-0.5 max-w-xs">
                    {r.reason || "-"}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-white">
                    {formatRupiah(r.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelect(r)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Detail <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SKELETON ROW
// ============================================================

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-800/60">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="py-4 px-6">
          <div className="h-4 w-20 rounded bg-zinc-800 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ============================================================
// MODAL DETAIL PENGAJUAN REFUND
// ============================================================

function RefundDetailModal({ open, refund, onClose, onApprove, onReject, processing }) {
  if (!open || !refund) return null;

  const meta = statusMeta(refund.status);
  const isPending = refund.status === "requested";
  const canAutoApprove = refund.refund_method === "original_payment";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Detail Pengajuan Refund</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Order</span>
            <span className="font-mono text-white">#ORD-{refund.order_id}</span>
          </div>

          {refund.order_info && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Pengguna</span>
                <span className="text-white">{refund.order_info.user_name || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Event</span>
                <span className="text-white text-right">{refund.order_info.event_title || "-"}</span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Jumlah</span>
            <span className="font-semibold text-white">{formatRupiah(refund.amount)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Diajukan</span>
            <span className="text-white">{formatDateTime(refund.created_at)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Status</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.pill}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>

          {refund.processed_at && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Diproses</span>
              <span className="text-white">{formatDateTime(refund.processed_at)}</span>
            </div>
          )}
        </div>

        <div className="mt-5">
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Alasan dari Pengguna
          </label>
          <div className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300 whitespace-pre-wrap">
            {refund.reason || "-"}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Metode Pengembalian Dana
          </label>
          <div className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2.5 text-sm text-zinc-300">
            {REFUND_METHOD_LABEL[refund.refund_method] || refund.refund_method}
          </div>
          {isPending && !canAutoApprove && (
            <p className="mt-1.5 text-xs text-amber-400">
              Persetujuan otomatis via Midtrans hanya berlaku untuk metode "Dana ke rekening
              asal". Metode ini perlu diproses manual di luar sistem.
            </p>
          )}
        </div>

        {isPending && (
          <div className="flex items-center justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onReject}
              disabled={processing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              Tolak
            </button>
            <button
              type="button"
              onClick={onApprove}
              disabled={processing || !canAutoApprove}
              title={
                !canAutoApprove
                  ? "Hanya bisa disetujui otomatis untuk metode original_payment"
                  : undefined
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              Setujui Refund
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// DROPDOWN STATUS FILTER
// ============================================================

function StatusFilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = value ? STATUS_META[value]?.label : "Semua Status";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-3 min-w-[160px] rounded-lg bg-[#12151c] border border-zinc-800 px-4 py-2.5 text-sm text-white"
      >
        <span>{current}</span>
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-zinc-800 bg-[#12151c] shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === "" ? "bg-amber-500/10 text-amber-400" : "text-zinc-300 hover:bg-white/[0.04]"
              }`}
            >
              Semua Status
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === s ? "bg-amber-500/10 text-amber-400" : "text-zinc-300 hover:bg-white/[0.04]"
                }`}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// HALAMAN UTAMA
// ============================================================

export default function RefundManagementPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedRefund, setSelectedRefund] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // --------------------------------------------------------
  // LOAD REFUNDS
  // --------------------------------------------------------
  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiFetch(`${REFUNDS_ENDPOINT}/`, { method: "GET" });
      const data = extractArray(res);
      setRefunds(data);

      // Best-effort: ambil info pengguna & event dari endpoint order.
      // Endpoint /api/orders/<id> belum dikonfirmasi bentuk responsnya,
      // jadi kegagalan di sini tidak menghentikan tampilan tabel utama.
      data.forEach(async (refund) => {
        try {
          const orderRes = await apiFetch(`${ORDERS_ENDPOINT}/${refund.order_id}`, {
            method: "GET",
          });
          const order = orderRes?.data || orderRes;
          const userName = order?.user?.full_name || order?.user_name || null;
          const eventTitle =
            order?.event?.title ||
            order?.items?.[0]?.ticket_category?.event?.title ||
            order?.order_items?.[0]?.ticket_category?.event?.title ||
            null;

          if (userName || eventTitle) {
            setRefunds((prev) =>
              prev.map((r) =>
                r.id === refund.id
                  ? { ...r, order_info: { user_name: userName, event_title: eventTitle } }
                  : r
              )
            );
          }
        } catch {
          // Diamkan — kolom PENGGUNA/EVENT akan menampilkan "-"
        }
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const filteredRefunds = refunds.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const orderLabel = `ord-${r.order_id}`;
      if (!orderLabel.includes(q) && !String(r.order_id).includes(q)) return false;
    }
    return true;
  });

  // --------------------------------------------------------
  // DETAIL / APPROVE / REJECT
  // --------------------------------------------------------
  const openDetail = (refund) => {
    setSelectedRefund(refund);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    if (processing) return;
    setDetailOpen(false);
    setSelectedRefund(null);
  };

  const handleApprove = async () => {
    if (!selectedRefund) return;
    setProcessing(true);
    setErrorMsg("");
    try {
      const res = await apiFetch(`${REFUNDS_ENDPOINT}/${selectedRefund.id}/approve`, {
        method: "POST",
      });
      const updated = res?.data?.refund || res?.data;
      setRefunds((prev) =>
        prev.map((r) => (r.id === selectedRefund.id ? { ...r, ...updated } : r))
      );
      setDetailOpen(false);
      setSelectedRefund(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRefund) return;
    setProcessing(true);
    setErrorMsg("");
    try {
      const res = await apiFetch(`${REFUNDS_ENDPOINT}/${selectedRefund.id}/reject`, {
        method: "POST",
      });
      const updated = res?.data;
      setRefunds((prev) =>
        prev.map((r) => (r.id === selectedRefund.id ? { ...r, ...updated } : r))
      );
      setDetailOpen(false);
      setSelectedRefund(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-[#0b0e14] text-white">
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <div className="flex justify-end border-b border-zinc-800/80 px-4 py-4 sm:px-8 sm:py-5">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari event, order, atau user..."
              className="w-full rounded-lg bg-[#12151c] border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* CONTENT */}
        <main className="flex-1 px-8 py-7">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Manajemen Refund</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Pengajuan pengembalian dana lintas event
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* RINGKASAN — selalu tampil, nilainya nol kalau belum ada data */}
          {!loading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Pengajuan" value={refunds.length} />
                <StatCard
                  label="Total Nominal Diproses"
                  value={formatRupiah(
                    refunds
                      .filter((r) => r.status === "processed")
                      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
                  )}
                />
                <StatCard
                  label="Menunggu Persetujuan"
                  value={refunds.filter((r) => r.status === "requested").length}
                />
                <StatCard
                  label="Ditolak"
                  value={refunds.filter((r) => r.status === "rejected").length}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <RefundTrendChart refunds={refunds} />
                <StatusDistributionChart refunds={refunds} />
              </div>

              <div className="mb-6">
                <RecentRefundsList refunds={refunds} onSelect={openDetail} />
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-4 mb-6">
            <StatusFilterDropdown value={statusFilter} onChange={setStatusFilter} />

            <div className="relative w-[240px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor order..."
                className="w-full rounded-lg bg-[#12151c] border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[950px]">
                <thead>
                  <tr className="border-b border-zinc-800/80">
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      ORDER
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      PENGGUNA
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      EVENT
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      JUMLAH
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      DIAJUKAN
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      STATUS
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  )}

                  {!loading && filteredRefunds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-zinc-500">
                        {search || statusFilter
                          ? "Tidak ada pengajuan refund yang cocok."
                          : "Belum ada pengajuan refund."}
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredRefunds.map((refund) => {
                      const meta = statusMeta(refund.status);
                      return (
                        <tr
                          key={refund.id}
                          className="border-b border-zinc-800/60 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-4 px-6 text-sm font-mono text-white">
                            #ORD-{refund.order_id}
                          </td>
                          <td className="py-4 px-6 text-sm text-zinc-300">
                            {refund.order_info?.user_name || "-"}
                          </td>
                          <td className="py-4 px-6 text-sm text-zinc-300">
                            {refund.order_info?.event_title || "-"}
                          </td>
                          <td className="py-4 px-6 text-sm text-zinc-300">
                            {formatRupiah(refund.amount)}
                          </td>
                          <td className="py-4 px-6 text-sm text-zinc-400">
                            {formatDate(refund.created_at)}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.pill}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() => openDetail(refund)}
                              className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                            >
                              Lihat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <RefundDetailModal
        open={detailOpen}
        refund={selectedRefund}
        onClose={closeDetail}
        onApprove={handleApprove}
        onReject={handleReject}
        processing={processing}
      />
    </div>
  );
}