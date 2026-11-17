"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2, ImageIcon } from "lucide-react";

import { getToken } from "@/lib/api";

// ============================================================
// KONFIGURASI API
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
const BANNERS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/admin/banners`;

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

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

function formatShort(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate().toString().padStart(2, "0")} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function formatPeriod(startAt, endAt) {
  if (!startAt && !endAt) return "Tayang terus";

  if (startAt && endAt) {
    const start = new Date(startAt);
    const end = new Date(endAt);
    const sameMonth =
      start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      return `${start.getDate().toString().padStart(2, "0")}–${end
        .getDate()
        .toString()
        .padStart(2, "0")} ${MONTHS_SHORT[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${formatShort(startAt)} – ${formatShort(endAt)}`;
  }

  if (startAt) return `Mulai ${formatShort(startAt)}`;
  return `Hingga ${formatShort(endAt)}`;
}

function toDateInputValue(isoValue) {
  if (!isoValue) return "";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
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
// MODAL TAMBAH / EDIT BANNER
// ============================================================

const EMPTY_FORM = {
  image: "",
  title: "",
  link_url: "",
  sort_order: "1",
  is_active: true,
  start_at: "",
  end_at: "",
};

function BannerModal({ open, onClose, onSubmit, initialData, saving }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (open) {
      setForm({
        image: initialData?.image || "",
        title: initialData?.title || "",
        link_url: initialData?.link_url || "",
        sort_order: initialData?.sort_order ?? "1",
        is_active: initialData?.is_active ?? true,
        start_at: toDateInputValue(initialData?.start_at),
        end_at: toDateInputValue(initialData?.end_at),
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

    if (!form.image.trim()) {
      setError("URL gambar banner wajib diisi");
      return;
    }
    if (form.start_at && form.end_at && form.end_at <= form.start_at) {
      setError("Jadwal selesai harus lebih besar dari jadwal mulai");
      return;
    }

    setError("");

    const payload = {
      image: form.image.trim(),
      title: form.title.trim() || null,
      link_url: form.link_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: Boolean(form.is_active),
      start_at: form.start_at || null,
      end_at: form.end_at || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.message || "Gagal menyimpan banner");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Banner" : "Tambah Banner"}
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
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Gambar Banner
            </label>

            {form.image ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-700 aspect-video bg-[#0b0e14]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 aspect-video bg-[#0b0e14] text-zinc-600">
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs">Preview 16:9</span>
              </div>
            )}

            <input
              type="url"
              value={form.image}
              onChange={handleChange("image")}
              placeholder="https://.../banner.jpg"
              disabled={saving}
              className="mt-2 w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
            />
            <p className="mt-1 text-[11px] text-zinc-600">
              Tempel URL gambar (rasio 16:9) — endpoint banner belum mendukung upload file
              langsung, jadi gambar perlu di-hosting dulu (mis. lewat layanan penyimpanan yang
              sudah dipakai di modul lain) lalu tempel URL-nya di sini.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Judul <span className="text-zinc-600">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={handleChange("title")}
              placeholder="Presale Kartu Kredit BCA"
              disabled={saving}
              className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Tautan Tujuan <span className="text-zinc-600">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.link_url}
              onChange={handleChange("link_url")}
              placeholder="/events/riize-world-tour-jakarta"
              disabled={saving}
              className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Urutan Tampil
              </label>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={handleChange("sort_order")}
                disabled={saving}
                className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center justify-between w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2.5">
                <span className="text-sm text-zinc-300">Status Aktif</span>
                <ToggleSwitch
                  checked={form.is_active}
                  onChange={(v) => setForm((prev) => ({ ...prev, is_active: v }))}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Jadwal Tayang{" "}
              <span className="text-zinc-600">(kosongkan agar tayang terus)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] text-zinc-500 mb-1">Mulai</span>
                <input
                  type="date"
                  value={form.start_at}
                  onChange={handleChange("start_at")}
                  disabled={saving}
                  className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50 [color-scheme:dark]"
                />
              </div>
              <div>
                <span className="block text-[11px] text-zinc-500 mb-1">Selesai</span>
                <input
                  type="date"
                  value={form.end_at}
                  onChange={handleChange("end_at")}
                  disabled={saving}
                  className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50 [color-scheme:dark]"
                />
              </div>
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
              {isEdit ? "Simpan Perubahan" : "Simpan Banner"}
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

function DeleteConfirmModal({ open, banner, onCancel, onConfirm, deleting }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-2">Hapus Banner?</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Banner{" "}
          <span className="text-white font-medium">{banner?.title || `#${banner?.id}`}</span>{" "}
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
// SKELETON CARD
// ============================================================

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] overflow-hidden">
      <div className="aspect-video bg-zinc-800 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 rounded bg-zinc-800 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}

// ============================================================
// HALAMAN UTAMA
// ============================================================

export default function BannerManagementPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState(null);

  // --------------------------------------------------------
  // LOAD BANNERS
  // --------------------------------------------------------
  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiFetch(`${BANNERS_ENDPOINT}/`, { method: "GET" });
      setBanners(extractArray(res));
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const filteredBanners = banners.filter((b) =>
    (b.title || "").toLowerCase().includes(search.toLowerCase())
  );

  // --------------------------------------------------------
  // ADD / EDIT
  // --------------------------------------------------------
  const openAddModal = () => {
    setEditingBanner(null);
    setModalOpen(true);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingBanner(null);
  };

  const handleSubmitBanner = async (payload) => {
    setSaving(true);
    try {
      if (editingBanner) {
        const res = await apiFetch(`${BANNERS_ENDPOINT}/${editingBanner.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setBanners((prev) =>
          prev.map((b) => (b.id === editingBanner.id ? res.data : b))
        );
      } else {
        const res = await apiFetch(`${BANNERS_ENDPOINT}/`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setBanners((prev) => [res.data, ...prev]);
      }
      setModalOpen(false);
      setEditingBanner(null);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------------
  // TOGGLE ACTIVE
  // --------------------------------------------------------
  const handleToggleActive = async (banner, nextValue) => {
    setTogglingId(banner.id);
    const prev = banners;
    setBanners((cur) =>
      cur.map((b) => (b.id === banner.id ? { ...b, is_active: nextValue } : b))
    );
    try {
      await apiFetch(`${BANNERS_ENDPOINT}/${banner.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: nextValue }),
      });
    } catch (err) {
      setBanners(prev);
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
      await apiFetch(`${BANNERS_ENDPOINT}/${deleteTarget.id}`, { method: "DELETE" });
      setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari event, order, atau user..."
              className="w-full rounded-lg bg-[#12151c] border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>

        {/* CONTENT */}
        <main className="flex-1 px-8 py-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Manajemen Banner</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Banner promosi di beranda aplikasi mobile
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Banner
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {!loading && filteredBanners.length === 0 && (
              <div className="col-span-full py-16 text-center text-sm text-zinc-500 rounded-2xl border border-zinc-800/80 bg-[#12151c]">
                {search ? "Banner tidak ditemukan." : "Belum ada banner."}
              </div>
            )}

            {!loading &&
              filteredBanners.map((banner) => (
                <div
                  key={banner.id}
                  className="group relative rounded-2xl border border-zinc-800/80 bg-[#12151c] overflow-hidden"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-violet-500/20 to-amber-400/20">
                    {banner.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.image}
                        alt={banner.title || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEditModal(banner)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/60 backdrop-blur text-white hover:bg-black/80 transition-colors"
                        title="Edit banner"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(banner)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/60 backdrop-blur text-red-400 hover:bg-black/80 transition-colors"
                        title="Hapus banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {banner.title || `Banner #${banner.id}`}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Urutan #{banner.sort_order} · {formatPeriod(banner.start_at, banner.end_at)}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          banner.is_active
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-zinc-700/40 text-zinc-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            banner.is_active ? "bg-emerald-400" : "bg-zinc-500"
                          }`}
                        />
                        {banner.is_active ? "Aktif" : "Nonaktif"}
                      </span>

                      <ToggleSwitch
                        checked={banner.is_active}
                        disabled={togglingId === banner.id}
                        onChange={(next) => handleToggleActive(banner, next)}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </main>
      </div>

      <BannerModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitBanner}
        initialData={editingBanner}
        saving={saving}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        banner={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}