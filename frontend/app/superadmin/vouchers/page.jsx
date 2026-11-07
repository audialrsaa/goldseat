"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";

import EventManagerSidebar from "../../components/event-manager/EventManagerSidebar";
import { getToken } from "@/lib/api";

// ============================================================
// KONFIGURASI API
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
const VOUCHERS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/vouchers`;
const EVENTS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/events`;

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

const TYPE_META = {
  percentage: "Persentase",
  fixed: "Nominal Tetap",
};

function formatRupiah(value) {
  const num = Number(value) || 0;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function formatCompactRupiah(value) {
  const num = Number(value) || 0;
  if (num >= 1000000) {
    const jt = num / 1000000;
    return `Rp${jt % 1 === 0 ? jt : jt.toFixed(1)}jt`;
  }
  if (num >= 1000) {
    const rb = num / 1000;
    return `Rp${rb % 1 === 0 ? rb : rb.toFixed(1)}rb`;
  }
  return `Rp${num}`;
}

function formatNilai(voucher) {
  if (voucher.type === "percentage") {
    const maks =
      voucher.max_discount !== null && voucher.max_discount !== undefined
        ? ` (maks ${formatCompactRupiah(voucher.max_discount)})`
        : "";
    return `${Number(voucher.discount)}%${maks}`;
  }
  return formatRupiah(voucher.discount);
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

function formatPeriod(startValue, endValue) {
  if (!startValue || !endValue) return "-";
  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";

  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.getDate().toString().padStart(2, "0")}–${end
      .getDate()
      .toString()
      .padStart(2, "0")} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}`;
  }

  return `${start.getDate().toString().padStart(2, "0")} ${
    MONTHS_SHORT[start.getMonth()]
  }–${end.getDate().toString().padStart(2, "0")} ${MONTHS_SHORT[end.getMonth()]}`;
}

function eventLabel(events, eventId) {
  if (!eventId) return "Semua Event";
  const found = events.find((ev) => String(ev.id) === String(eventId));
  return found ? found.title : "-";
}

// ============================================================
// MODAL TAMBAH / EDIT VOUCHER
// ============================================================

const EMPTY_FORM = {
  event_id: "",
  code: "",
  type: "percentage",
  discount: "",
  min_transaction: "0",
  max_discount: "",
  quota: "",
  start_date: "",
  end_date: "",
};

function VoucherModal({ open, onClose, onSubmit, initialData, saving, events }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (open) {
      setForm({
        event_id: initialData?.event_id ?? "",
        code: initialData?.code || "",
        type: initialData?.type || "percentage",
        discount: initialData?.discount ?? "",
        min_transaction: initialData?.min_transaction ?? "0",
        max_discount: initialData?.max_discount ?? "",
        quota: initialData?.quota ?? "",
        start_date: initialData?.start_date || "",
        end_date: initialData?.end_date || "",
      });
      setError("");
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.code.trim()) return setError("Kode voucher wajib diisi");
    if (form.discount === "" || Number(form.discount) <= 0)
      return setError("Nilai diskon wajib diisi dan lebih dari 0");
    if (form.type === "percentage" && Number(form.discount) > 100)
      return setError("Diskon persentase tidak boleh lebih dari 100");
    if (form.quota === "" || Number(form.quota) < 1)
      return setError("Kuota minimal 1");
    if (!form.start_date || !form.end_date)
      return setError("Periode voucher wajib diisi");
    if (form.end_date < form.start_date)
      return setError("Tanggal selesai tidak boleh sebelum tanggal mulai");

    setError("");

    const payload = {
      event_id: form.event_id === "" ? null : Number(form.event_id),
      code: form.code.trim().toUpperCase(),
      type: form.type,
      discount: Number(form.discount),
      min_transaction: Number(form.min_transaction) || 0,
      max_discount:
        form.type === "percentage" && form.max_discount !== ""
          ? Number(form.max_discount)
          : null,
      quota: Number(form.quota),
      start_date: form.start_date,
      end_date: form.end_date,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.message || "Gagal menyimpan voucher");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Voucher" : "Tambah Voucher"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Kode Voucher
              </label>
              <input
                type="text"
                value={form.code}
                onChange={handleChange("code")}
                placeholder="SMENCORE10"
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white uppercase placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Tipe
              </label>
              <select
                value={form.type}
                onChange={handleChange("type")}
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
              >
                <option value="percentage">Persentase</option>
                <option value="fixed">Nominal Tetap</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Event{" "}
              <span className="text-zinc-600">(kosongkan untuk semua event)</span>
            </label>
            <select
              value={form.event_id}
              onChange={handleChange("event_id")}
              disabled={saving}
              className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
            >
              <option value="">Semua Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                {form.type === "percentage" ? "Diskon (%)" : "Diskon (Rp)"}
              </label>
              <input
                type="number"
                min="0"
                max={form.type === "percentage" ? 100 : undefined}
                value={form.discount}
                onChange={handleChange("discount")}
                placeholder={form.type === "percentage" ? "10" : "50000"}
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
              />
            </div>

            {form.type === "percentage" ? (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Maks. Diskon (Rp){" "}
                  <span className="text-zinc-600">(opsional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.max_discount}
                  onChange={handleChange("max_discount")}
                  placeholder="100000"
                  disabled={saving}
                  className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Kuota
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.quota}
                  onChange={handleChange("quota")}
                  placeholder="500"
                  disabled={saving}
                  className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {form.type === "percentage" && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Kuota
              </label>
              <input
                type="number"
                min="1"
                value={form.quota}
                onChange={handleChange("quota")}
                placeholder="500"
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Minimal Transaksi (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={form.min_transaction}
              onChange={handleChange("min_transaction")}
              placeholder="300000"
              disabled={saving}
              className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={handleChange("start_date")}
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={handleChange("end_date")}
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50 [color-scheme:dark]"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL KONFIRMASI HAPUS
// ============================================================

function DeleteConfirmModal({ open, voucher, onCancel, onConfirm, deleting }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-2">Hapus Voucher?</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Voucher <span className="text-white font-medium">{voucher?.code}</span>{" "}
          akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SKELETON ROW
// ============================================================

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-800/60">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-4 px-6">
          <div className="h-4 w-20 rounded bg-zinc-800 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ============================================================
// HALAMAN UTAMA
// ============================================================

export default function VoucherManagementPage() {
  const [vouchers, setVouchers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [voucherRes, eventRes] = await Promise.all([
        apiFetch(`${VOUCHERS_ENDPOINT}/`, { method: "GET" }),
        apiFetch(`${EVENTS_ENDPOINT}/`, { method: "GET" }).catch(() => ({ data: [] })),
      ]);
      setVouchers(extractArray(voucherRes));
      setEvents(extractArray(eventRes));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredVouchers = vouchers.filter((v) =>
    v.code?.toLowerCase().includes(search.toLowerCase())
  );

  // --------------------------------------------------------
  // ADD / EDIT
  // --------------------------------------------------------
  const openAddModal = () => {
    setEditingVoucher(null);
    setModalOpen(true);
  };

  const openEditModal = (voucher) => {
    setEditingVoucher(voucher);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingVoucher(null);
  };

  const handleSubmitVoucher = async (payload) => {
    setSaving(true);
    try {
      if (editingVoucher) {
        const res = await apiFetch(`${VOUCHERS_ENDPOINT}/${editingVoucher.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setVouchers((prev) =>
          prev.map((v) => (v.id === editingVoucher.id ? res.data : v))
        );
      } else {
        const res = await apiFetch(`${VOUCHERS_ENDPOINT}/`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setVouchers((prev) => [res.data, ...prev]);
      }
      setModalOpen(false);
      setEditingVoucher(null);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------
  // DELETE
  // --------------------------------------------------------
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`${VOUCHERS_ENDPOINT}/${deleteTarget.id}`, { method: "DELETE" });
      setVouchers((prev) => prev.filter((v) => v.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setErrorMsg(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-white">
      <EventManagerSidebar />

      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-6 px-8 py-5 border-b border-zinc-800/80">
          <div>
            <h1 className="text-lg font-semibold text-white">Voucher</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Super Admin / Voucher</p>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari event, order, atau user..."
              className="w-full rounded-lg bg-[#12151c] border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 px-8 py-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Manajemen Voucher</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Kode promo dan diskon lintas event
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Voucher
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="border-b border-zinc-800/80">
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      KODE
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      TIPE
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      NILAI
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      MIN. TRANSAKSI
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      KUOTA
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      PERIODE
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      EVENT
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

                  {!loading && filteredVouchers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-sm text-zinc-500">
                        {search ? "Voucher tidak ditemukan." : "Belum ada voucher."}
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredVouchers.map((voucher) => (
                      <tr
                        key={voucher.id}
                        className="border-b border-zinc-800/60 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="inline-block rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-amber-400">
                            {voucher.code}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-300">
                          {TYPE_META[voucher.type] || voucher.type}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-300">
                          {formatNilai(voucher)}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-300">
                          {formatRupiah(voucher.min_transaction)}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-300">
                          {voucher.quota}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-400">
                          {formatPeriod(voucher.start_date, voucher.end_date)}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-300">
                          {eventLabel(events, voucher.event_id)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(voucher)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                              title="Edit voucher"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(voucher)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                              title="Hapus voucher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <VoucherModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitVoucher}
        initialData={editingVoucher}
        saving={saving}
        events={events}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        voucher={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}