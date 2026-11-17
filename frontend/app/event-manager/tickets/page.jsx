"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getToken } from "@/lib/api";

// ============================================================
// KONFIGURASI API
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
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
    const message = payload?.message || "Terjadi kesalahan pada server";
    throw new Error(message);
  }

  return payload;
}

// ============================================================
// HELPERS
// ============================================================

function formatRupiah(value) {
  const num = Number(value) || 0;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function formatShortDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function formatSalePeriod(start, end) {
  const s = formatShortDate(start);
  const e = formatShortDate(end);
  if (!s && !e) return "-";
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

function formatMaxQty(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `${value}/user`;
}

// ============================================================
// TOGGLE SWITCH
// ============================================================

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0e14] focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-emerald-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ============================================================
// EVENT DROPDOWN (custom, dark theme)
// ============================================================

function EventDropdown({ events, value, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const selected = events.find((ev) => String(ev.id) === String(value));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading || events.length === 0}
        className="flex items-center justify-between gap-3 min-w-[280px] rounded-lg bg-[#12151c] border border-zinc-800 px-4 py-2.5 text-sm text-white disabled:opacity-50"
      >
        <span className="truncate">
          {loading
            ? "Memuat event..."
            : selected?.title || selected?.name || "Pilih event"}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-lg border border-zinc-800 bg-[#12151c] shadow-2xl">
            {events.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => {
                  onChange(ev.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  String(ev.id) === String(value)
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-zinc-300 hover:bg-white/[0.04]"
                }`}
              >
                {ev.title || ev.name}
              </button>
            ))}
            {events.length === 0 && (
              <div className="px-4 py-3 text-sm text-zinc-500">
                Belum ada event
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// MODAL TAMBAH / EDIT KATEGORI TIKET
// ============================================================

const EMPTY_CATEGORY_FORM = {
  name: "",
  price: "",
  stock: "",
  active: true,
  sale_start_at: "",
  sale_end_at: "",
  max_qty_per_user: "",
};

function CategoryModal({ open, onClose, onSubmit, initialData, saving, eventLabel }) {
  const [form, setForm] = useState(EMPTY_CATEGORY_FORM);
  const [error, setError] = useState("");

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (open) {
      setForm({
        name: initialData?.name || "",
        price: initialData?.price ?? "",
        stock: initialData?.stock ?? "",
        active: initialData?.active ?? true,
        sale_start_at: initialData?.sale_start_at
          ? initialData.sale_start_at.slice(0, 16)
          : "",
        sale_end_at: initialData?.sale_end_at
          ? initialData.sale_end_at.slice(0, 16)
          : "",
        max_qty_per_user: initialData?.max_qty_per_user ?? "",
      });
      setError("");
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleChange = (key) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Nama kategori wajib diisi");
      return;
    }
    if (form.price === "" || Number(form.price) < 0) {
      setError("Harga wajib diisi dan tidak boleh negatif");
      return;
    }
    if (form.stock === "" || Number(form.stock) < 0) {
      setError("Stok wajib diisi dan tidak boleh negatif");
      return;
    }

    setError("");

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      active: Boolean(form.active),
      sale_start_at: form.sale_start_at || null,
      sale_end_at: form.sale_end_at || null,
      max_qty_per_user:
        form.max_qty_per_user === "" ? null : Number(form.max_qty_per_user),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.message || "Gagal menyimpan kategori tiket");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Kategori Tiket" : "Tambah Kategori Tiket"}
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
        {eventLabel && (
          <p className="text-xs text-zinc-500 mb-5">Untuk event: {eventLabel}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Nama Kategori
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Contoh: VIP Standing"
              disabled={saving}
              className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Harga (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange("price")}
                placeholder="2850000"
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Stok
              </label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange("stock")}
                placeholder="1200"
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Jadwal Jual Mulai
              </label>
              <input
                type="datetime-local"
                value={form.sale_start_at}
                onChange={handleChange("sale_start_at")}
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Jadwal Jual Selesai
              </label>
              <input
                type="datetime-local"
                value={form.sale_end_at}
                onChange={handleChange("sale_end_at")}
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Batas Beli per User{" "}
              <span className="text-zinc-600">(opsional)</span>
            </label>
            <input
              type="number"
              min="0"
              value={form.max_qty_per_user}
              onChange={handleChange("max_qty_per_user")}
              placeholder="4"
              disabled={saving}
              className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2.5">
            <span className="text-sm text-zinc-300">Status Aktif</span>
            <ToggleSwitch
              checked={form.active}
              onChange={(v) => setForm((prev) => ({ ...prev, active: v }))}
              disabled={saving}
            />
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
              {isEdit ? "Simpan Perubahan" : "Tambah Kategori"}
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

function DeleteConfirmModal({ open, category, onCancel, onConfirm, deleting }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-2">
          Hapus Kategori Tiket?
        </h2>
        <p className="text-sm text-zinc-400 mb-5">
          Kategori <span className="text-white font-medium">{category?.name}</span>{" "}
          beserta seluruh kursi di dalamnya akan dihapus. Tindakan ini tidak
          dapat dibatalkan.
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
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-4 px-6">
          <div className="h-4 w-20 rounded bg-zinc-800 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ============================================================
// DENAH KURSI (SEAT MAP)
// ============================================================

const SEAT_STATUS_META = {
  available: { label: "Tersedia", dot: "bg-emerald-500", cell: "bg-emerald-500/70 hover:bg-emerald-500" },
  locked: { label: "Terkunci", dot: "bg-amber-500", cell: "bg-amber-500/70 hover:bg-amber-500" },
  booked: { label: "Terisi", dot: "bg-zinc-600", cell: "bg-zinc-700 hover:bg-zinc-600" },
};

const SEATS_PER_ROW = 15;

function SeatMap({ category, seats, loading }) {
  const rows = useMemo(() => {
    const sorted = [...seats].sort((a, b) =>
      a.seat_code.localeCompare(b.seat_code, undefined, { numeric: true })
    );
    const chunks = [];
    for (let i = 0; i < sorted.length; i += SEATS_PER_ROW) {
      chunks.push(sorted.slice(i, i + SEATS_PER_ROW));
    }
    return chunks;
  }, [seats]);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">Denah Kursi</h3>
        {category && (
          <span className="text-xs text-zinc-500">{category.name}</span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 rounded-xl bg-[#0b0e14] border border-zinc-800 py-2.5 mb-5 text-xs tracking-widest text-zinc-500">
        <ChevronLeft className="w-4 h-4" />
        PANGGUNG
        <ChevronRight className="w-4 h-4" />
      </div>

      <div className="flex items-center gap-5 mb-5">
        {Object.entries(SEAT_STATUS_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className={`w-2.5 h-2.5 rounded-sm ${meta.dot}`} />
            {meta.label}
          </div>
        ))}
      </div>

      {!category && (
        <p className="text-sm text-zinc-500 py-8 text-center">
          Pilih kategori tiket untuk melihat denah kursinya.
        </p>
      )}

      {category && loading && (
        <p className="text-sm text-zinc-500 py-8 text-center">Memuat denah kursi...</p>
      )}

      {category && !loading && seats.length === 0 && (
        <p className="text-sm text-zinc-500 py-8 text-center">
          Kategori ini belum memiliki data kursi (kemungkinan tiket tanpa nomor kursi).
        </p>
      )}

      {category && !loading && seats.length > 0 && (
        <div className="flex flex-col items-center gap-1.5 overflow-x-auto">
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-1.5">
              {row.map((seat) => {
                const meta = SEAT_STATUS_META[seat.status] || SEAT_STATUS_META.available;
                return (
                  <div
                    key={seat.id}
                    title={`${seat.seat_code} — ${meta.label}`}
                    className={`w-6 h-6 rounded-sm cursor-default transition-colors ${meta.cell}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// HALAMAN UTAMA
// ============================================================

export default function TiketKursiPage() {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState(null);

  const selectedEvent = events.find((ev) => String(ev.id) === String(selectedEventId));
  const selectedCategory = categories.find(
    (c) => String(c.id) === String(selectedCategoryId)
  );

  // --------------------------------------------------------
  // LOAD EVENTS
  // --------------------------------------------------------
  useEffect(() => {
    (async () => {
      setEventsLoading(true);
      try {
        const res = await apiFetch("/events/", { method: "GET" });
        const data = Array.isArray(res?.data) ? res.data : [];
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0].id);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setEventsLoading(false);
      }
    })();
  }, []);

  // --------------------------------------------------------
  // LOAD TICKET CATEGORIES PER EVENT
  // --------------------------------------------------------
  const fetchCategories = useCallback(async (eventId) => {
    if (!eventId) return;
    setCategoriesLoading(true);
    setErrorMsg("");
    try {
      const res = await apiFetch(`/ticket-categories/event/${eventId}`, {
        method: "GET",
      });
      const data = Array.isArray(res?.data) ? res.data : [];
      setCategories(data);
      setSelectedCategoryId(data.length > 0 ? data[0].id : null);
    } catch (err) {
      setErrorMsg(err.message);
      setCategories([]);
      setSelectedCategoryId(null);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchCategories(selectedEventId);
    } else if (!eventsLoading) {
      // Tidak ada event terpilih (mis. daftar event kosong) —
      // hentikan skeleton alih-alih loading selamanya.
      setCategoriesLoading(false);
      setCategories([]);
      setSelectedCategoryId(null);
    }
  }, [selectedEventId, eventsLoading, fetchCategories]);

  // --------------------------------------------------------
  // LOAD SEATS PER CATEGORY
  // --------------------------------------------------------
  useEffect(() => {
    if (!selectedCategoryId) {
      setSeats([]);
      return;
    }
    (async () => {
      setSeatsLoading(true);
      try {
        const res = await apiFetch(
          `/seats/?ticket_category_id=${selectedCategoryId}`,
          { method: "GET" }
        );
        setSeats(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        setSeats([]);
      } finally {
        setSeatsLoading(false);
      }
    })();
  }, [selectedCategoryId]);

  // --------------------------------------------------------
  // ADD / EDIT
  // --------------------------------------------------------
  const openAddModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmitCategory = async (payload) => {
    setSaving(true);
    try {
      if (editingCategory) {
        const res = await apiFetch(`/ticket-categories/${editingCategory.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? res.data : c))
        );
      } else {
        const res = await apiFetch("/ticket-categories/", {
          method: "POST",
          body: JSON.stringify({ ...payload, event_id: selectedEventId }),
        });
        setCategories((prev) => [res.data, ...prev]);
      }
      setModalOpen(false);
      setEditingCategory(null);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------
  // TOGGLE ACTIVE
  // --------------------------------------------------------
  const handleToggleActive = async (category, nextValue) => {
    setTogglingId(category.id);
    const prev = categories;
    setCategories((cur) =>
      cur.map((c) => (c.id === category.id ? { ...c, active: nextValue } : c))
    );
    try {
      await apiFetch(`/ticket-categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: nextValue }),
      });
    } catch (err) {
      setCategories(prev);
      setErrorMsg(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // --------------------------------------------------------
  // DELETE
  // --------------------------------------------------------
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/ticket-categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (selectedCategoryId === deleteTarget.id) setSelectedCategoryId(null);
      setDeleteTarget(null);
    } catch (err) {
      setErrorMsg(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[#0b0e14] text-white">
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <div className="flex justify-end border-b border-zinc-800/80 px-4 py-4 sm:px-8 sm:py-5">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Cari event, order, atau user..."
              className="w-full rounded-lg bg-[#12151c] border border-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* CONTENT */}
        <main className="flex-1 px-8 py-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Tiket & Kursi</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Pengaturan kategori tiket dan denah kursi per event
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 mb-6">
            <EventDropdown
              events={events}
              value={selectedEventId}
              onChange={setSelectedEventId}
              loading={eventsLoading}
            />

            <button
              type="button"
              onClick={openAddModal}
              disabled={!selectedEventId}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Tambah Kategori Tiket
            </button>
          </div>

          {/* TABLE KATEGORI TIKET */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="border-b border-zinc-800/80">
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      KATEGORI
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      HARGA
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      STOK
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      TERJUAL
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      JADWAL JUAL
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      BATAS BELI
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      AKTIF
                    </th>
                    <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoriesLoading && (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  )}

                  {!categoriesLoading && categories.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-sm text-zinc-500">
                        Belum ada kategori tiket untuk event ini.
                      </td>
                    </tr>
                  )}

                  {!categoriesLoading &&
                    categories.map((category) => (
                      <tr
                        key={category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`border-b border-zinc-800/60 last:border-b-0 cursor-pointer transition-colors ${
                          String(category.id) === String(selectedCategoryId)
                            ? "bg-amber-500/[0.06]"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className="py-4 px-6 text-sm font-medium text-white">
                          {category.name}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-300">
                          {formatRupiah(category.price)}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-300">
                          {formatNumber(category.stock)}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-300">
                          {formatNumber(category.sold)}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-400">
                          {formatSalePeriod(category.sale_start_at, category.sale_end_at)}
                        </td>
                        <td className="py-4 px-6 text-sm text-zinc-400">
                          {formatMaxQty(category.max_qty_per_user)}
                        </td>
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          <ToggleSwitch
                            checked={category.active}
                            disabled={togglingId === category.id}
                            onChange={(next) => handleToggleActive(category, next)}
                          />
                        </td>
                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(category)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                              title="Edit kategori"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(category)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                              title="Hapus kategori"
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

          {/* DENAH KURSI */}
          <SeatMap category={selectedCategory} seats={seats} loading={seatsLoading} />
        </main>
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitCategory}
        initialData={editingCategory}
        saving={saving}
        eventLabel={selectedEvent?.title || selectedEvent?.name}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        category={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}