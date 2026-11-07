"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2, User } from "lucide-react";

import EventManagerSidebar from "../../components/event-manager/EventManagerSidebar";
import { getToken } from "@/lib/api";

// ============================================================
// KONFIGURASI API
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
const ARTISTS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/artists`;

// ============================================================
// API REQUEST (JSON)
// ============================================================

async function apiRequest(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || `Terjadi kesalahan server (${res.status})`);
  }

  return data;
}

// ============================================================
// API REQUEST (MULTIPART) — untuk foto artist
// ============================================================

async function apiFormRequest(url, method, formData) {
  const token = getToken();

  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data?.message || `Terjadi kesalahan server (${res.status})`);
  }

  return data;
}

// ============================================================
// MODAL TAMBAH / EDIT ARTIST
// ============================================================

function ArtistModal({ open, onClose, onSubmit, initialData, saving }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [error, setError] = useState("");

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setDescription(initialData?.description || "");
      setPhotoFile(null);
      setPhotoPreview(initialData?.photo || "");
      setError("");
    }
  }, [open, initialData]);

  if (!open) return null;

  const handlePhotoChange = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Nama artis wajib diisi");
      return;
    }

    setError("");

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", description || "");
    if (photoFile) fd.append("photo", photoFile);

    try {
      await onSubmit(fd);
    } catch (err) {
      setError(err?.message || "Gagal menyimpan artis");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? "Edit Artis" : "Tambah Artis"}
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
          {/* Foto */}
          <div className="flex justify-center">
            <label className="relative w-24 h-24 rounded-full overflow-hidden bg-[#0b0e14] border border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-zinc-600" />
              )}
              <input
                type="file"
                accept="image/*"
                disabled={saving}
                onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Nama Artis
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: RIIZE"
              disabled={saving}
              className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Deskripsi{" "}
              <span className="text-zinc-600">(opsional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ceritakan tentang artis ini"
              disabled={saving}
              className="w-full rounded-lg bg-[#0b0e14] border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none resize-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500/60 disabled:opacity-50"
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
              {isEdit ? "Simpan Perubahan" : "Tambah Artis"}
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

function DeleteConfirmModal({ open, artist, onCancel, onConfirm, deleting }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-2">Hapus Artis?</h2>
        <p className="text-sm text-zinc-400 mb-5">
          Artis <span className="text-white font-medium">{artist?.name}</span>{" "}
          akan dihapus. Seluruh event milik artis ini juga akan ikut terhapus.
          Tindakan ini tidak dapat dibatalkan.
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
      <td className="py-4 px-6">
        <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
      </td>
      <td className="py-4 px-6">
        <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
      </td>
      <td className="py-4 px-6">
        <div className="h-4 w-64 rounded bg-zinc-800 animate-pulse" />
      </td>
      <td className="py-4 px-6">
        <div className="h-8 w-16 rounded bg-zinc-800 animate-pulse" />
      </td>
    </tr>
  );
}

// ============================================================
// HALAMAN UTAMA
// ============================================================

export default function ArtisManagementPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------------
  // LOAD ARTISTS
  // --------------------------------------------------------
  const fetchArtists = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiRequest(`${ARTISTS_ENDPOINT}/`, { method: "GET" });
      setArtists(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  const filteredArtists = artists.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase())
  );

  // --------------------------------------------------------
  // ADD / EDIT
  // --------------------------------------------------------
  const openAddModal = () => {
    setEditingArtist(null);
    setModalOpen(true);
  };

  const openEditModal = (artist) => {
    setEditingArtist(artist);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingArtist(null);
  };

  const handleSubmitArtist = async (formData) => {
    setSaving(true);
    try {
      if (editingArtist) {
        const res = await apiFormRequest(
          `${ARTISTS_ENDPOINT}/${editingArtist.id}`,
          "PUT",
          formData
        );
        setArtists((prev) =>
          prev.map((a) => (a.id === editingArtist.id ? res.data : a))
        );
      } else {
        const res = await apiFormRequest(`${ARTISTS_ENDPOINT}/`, "POST", formData);
        setArtists((prev) => [res.data, ...prev]);
      }
      setModalOpen(false);
      setEditingArtist(null);
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
      await apiRequest(`${ARTISTS_ENDPOINT}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setArtists((prev) => prev.filter((a) => a.id !== deleteTarget.id));
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
            <h1 className="text-lg font-semibold text-white">Manajemen Artis</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Super Admin / Manajemen Artis
            </p>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari artis..."
              className="w-full rounded-lg bg-[#12151c] border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 px-8 py-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Manajemen Artis</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Kelola data artis / performer untuk seluruh event
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Artis
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="rounded-2xl border border-zinc-800/80 bg-[#12151c] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800/80">
                  <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500 w-16">
                    FOTO
                  </th>
                  <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                    NAMA
                  </th>
                  <th className="py-3.5 px-6 text-xs font-semibold tracking-wider text-zinc-500">
                    DESKRIPSI
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

                {!loading && filteredArtists.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-zinc-500">
                      {search ? "Artis tidak ditemukan." : "Belum ada data artis."}
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredArtists.map((artist) => (
                    <tr
                      key={artist.id}
                      className="border-b border-zinc-800/60 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-6">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                          {artist.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={artist.photo}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-zinc-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-sm font-medium text-white">
                        {artist.name}
                      </td>
                      <td className="py-3 px-6 text-sm text-zinc-400 max-w-md truncate">
                        {artist.description || "-"}
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(artist)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                            title="Edit artis"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(artist)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            title="Hapus artis"
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
        </main>
      </div>

      <ArtistModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitArtist}
        initialData={editingArtist}
        saving={saving}
      />

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        artist={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}