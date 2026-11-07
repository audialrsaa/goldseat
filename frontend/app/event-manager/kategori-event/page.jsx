"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  CalendarDays,
  Users,
  Ticket,
  Megaphone,
  Tag,
} from "lucide-react";

import EventManagerSidebar from "../../components/event-manager/EventManagerSidebar";
import { getToken } from "@/lib/api";

// ============================================================
// KONFIGURASI API
// ============================================================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5000/api";

// ============================================================
// API FETCH HELPER
// ============================================================

async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

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
    const message =
      payload?.message || "Terjadi kesalahan pada server";

    throw new Error(message);
  }

  return payload;
}

// ============================================================
// MAP ICON SLUG -> LUCIDE ICON
// ============================================================

const ICON_MAP = {
  calendar: CalendarDays,
  users: Users,
  ticket: Ticket,
  megaphone: Megaphone,
};

function CategoryIcon({
  icon,
  className = "w-4 h-4",
}) {
  const Icon = ICON_MAP[icon] || Tag;

  return <Icon className={className} />;
}

// ============================================================
// TOGGLE SWITCH
// ============================================================

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0e14] focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
          checked
            ? "translate-x-6"
            : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ============================================================
// MODAL TAMBAH / EDIT KATEGORI
// ============================================================

function CategoryModal({
  open,
  onClose,
  onSubmit,
  initialData,
  saving,
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setIcon(initialData?.icon || "");
      setIsActive(
        initialData?.is_active ?? true
      );
      setError("");
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Nama kategori wajib diisi");
      return;
    }

    setError("");

    try {
      await onSubmit({
        name: name.trim(),
        icon: icon.trim() || null,
        is_active: isActive,
      });
    } catch (err) {
      setError(
        err?.message ||
          "Gagal menyimpan kategori"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">

        {/* HEADER */}

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {isEdit
              ? "Edit Kategori"
              : "Tambah Kategori"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* NAMA */}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Nama Kategori
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Contoh: Konser"
              disabled={saving}
              className="w-full rounded-lg border border-zinc-700 bg-[#0b0e14] px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/60 disabled:opacity-50"
            />
          </div>

          {/* ICON */}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Icon{" "}
              <span className="text-zinc-600">
                (opsional — calendar, users,
                ticket, megaphone)
              </span>
            </label>

            <input
              type="text"
              value={icon}
              onChange={(e) =>
                setIcon(e.target.value)
              }
              placeholder="calendar"
              disabled={saving}
              className="w-full rounded-lg border border-zinc-700 bg-[#0b0e14] px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/60 disabled:opacity-50"
            />
          </div>

          {/* STATUS */}

          <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-[#0b0e14] px-3 py-2.5">
            <span className="text-sm text-zinc-300">
              Status Aktif
            </span>

            <ToggleSwitch
              checked={isActive}
              onChange={setIsActive}
              disabled={saving}
            />
          </div>

          {/* ERROR */}

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* BUTTON */}

          <div className="flex items-center justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:opacity-60"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {isEdit
                ? "Simpan Perubahan"
                : "Tambah Kategori"}
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

function DeleteConfirmModal({
  open,
  category,
  onCancel,
  onConfirm,
  deleting,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#12151c] p-6 shadow-2xl">

        <h2 className="mb-2 text-lg font-semibold text-white">
          Hapus Kategori?
        </h2>

        <p className="mb-5 text-sm text-zinc-400">
          Kategori{" "}
          <span className="font-medium text-white">
            {category?.name}
          </span>{" "}
          akan dihapus secara permanen.
          Tindakan ini tidak dapat dibatalkan.
        </p>

        <div className="flex items-center justify-end gap-3">

          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-60"
          >
            {deleting && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

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

      <td className="px-6 py-4">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-800" />
      </td>

      <td className="px-6 py-4">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
      </td>

      <td className="px-6 py-4">
        <div className="h-5 w-24 animate-pulse rounded-full bg-zinc-800" />
      </td>

      <td className="px-6 py-4">
        <div className="h-6 w-11 animate-pulse rounded-full bg-zinc-800" />
      </td>

      <td className="px-6 py-4">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-800" />
      </td>

    </tr>
  );
}

// ============================================================
// HALAMAN UTAMA
// ============================================================

export default function KategoriEventPage() {
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  const [togglingId, setTogglingId] =
    useState(null);

  // ==========================================================
  // FETCH CATEGORIES
  // ==========================================================

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await apiFetch(
        "/admin/event-categories/",
        {
          method: "GET",
        }
      );

      setCategories(res?.data || []);
    } catch (err) {
      console.error(
        "Fetch categories error:",
        err
      );

      setErrorMsg(
        err?.message ||
          "Gagal mengambil data kategori event"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredCategories =
    categories.filter((cat) =>
      cat.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  // ==========================================================
  // ADD
  // ==========================================================

  const openAddModal = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  // ==========================================================
  // EDIT
  // ==========================================================

  const openEditModal = (category) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingCategory(null);
  };

  // ==========================================================
  // CREATE / UPDATE CATEGORY
  // ==========================================================

  const handleSubmitCategory = async (
    payload
  ) => {
    setSaving(true);

    try {
      if (editingCategory) {

        // UPDATE

        const res = await apiFetch(
          `/admin/event-categories/${editingCategory.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id
              ? res.data
              : cat
          )
        );

      } else {

        // CREATE

        const res = await apiFetch(
          "/admin/event-categories/",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        setCategories((prev) => [
          res.data,
          ...prev,
        ]);
      }

      setModalOpen(false);
      setEditingCategory(null);

    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // TOGGLE STATUS
  // ==========================================================

  const handleToggleStatus = async (
    category,
    nextValue
  ) => {
    setTogglingId(category.id);

    const prevCategories = categories;

    // Optimistic update

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === category.id
          ? {
              ...cat,
              is_active: nextValue,
            }
          : cat
      )
    );

    try {
      await apiFetch(
        `/admin/event-categories/${category.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            is_active: nextValue,
          }),
        }
      );
    } catch (err) {

      // Rollback

      setCategories(prevCategories);

      setErrorMsg(
        err?.message ||
          "Gagal mengubah status kategori"
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await apiFetch(
        `/admin/event-categories/${deleteTarget.id}`,
        {
          method: "DELETE",
        }
      );

      setCategories((prev) =>
        prev.filter(
          (cat) =>
            cat.id !== deleteTarget.id
        )
      );

      setDeleteTarget(null);

    } catch (err) {
      setErrorMsg(
        err?.message ||
          "Gagal menghapus kategori"
      );

      setDeleteTarget(null);

    } finally {
      setDeleting(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="flex min-h-screen bg-[#0b0e14] text-white">

      <EventManagerSidebar />

      <div className="flex flex-1 flex-col">

        {/* HEADER */}

        <header className="flex items-center justify-between gap-6 border-b border-zinc-800/80 px-8 py-5">

          <div>
            <h1 className="text-lg font-semibold text-white">
              Kategori Event
            </h1>

            <p className="mt-0.5 text-xs text-zinc-500">
              Super Admin / Kategori Event
            </p>
          </div>

          <div className="relative max-w-md flex-1">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari kategori..."
              className="w-full rounded-lg border border-zinc-800 bg-[#12151c] py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />

          </div>

        </header>

        {/* CONTENT */}

        <main className="flex-1 px-8 py-7">

          {/* TITLE */}

          <div className="mb-6 flex items-start justify-between">

            <div>
              <h2 className="text-2xl font-bold text-white">
                Kategori Event
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Klasifikasi jenis event yang tersedia
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />

              Tambah Kategori
            </button>

          </div>

          {/* ERROR */}

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* TABLE */}

          <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#12151c]">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px] text-left">

                <thead>
                  <tr className="border-b border-zinc-800/80">

                    <th className="px-6 py-3.5 text-xs font-semibold tracking-wider text-zinc-500">
                      IKON
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold tracking-wider text-zinc-500">
                      NAMA
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold tracking-wider text-zinc-500">
                      SLUG
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold tracking-wider text-zinc-500">
                      AKTIF
                    </th>

                    <th className="px-6 py-3.5 text-xs font-semibold tracking-wider text-zinc-500">
                      AKSI
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {/* LOADING */}

                  {loading && (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  )}

                  {/* EMPTY */}

                  {!loading &&
                    filteredCategories.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-sm text-zinc-500"
                        >
                          {search
                            ? "Kategori tidak ditemukan."
                            : "Belum ada kategori event."}
                        </td>
                      </tr>
                    )}

                  {/* DATA */}

                  {!loading &&
                    filteredCategories.map(
                      (category) => (
                        <tr
                          key={category.id}
                          className="border-b border-zinc-800/60 transition-colors last:border-b-0 hover:bg-white/[0.02]"
                        >

                          {/* ICON */}

                          <td className="px-6 py-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/80 text-amber-400">
                              <CategoryIcon
                                icon={
                                  category.icon
                                }
                              />
                            </div>
                          </td>

                          {/* NAME */}

                          <td className="px-6 py-4 text-sm font-medium text-white">
                            {category.name}
                          </td>

                          {/* SLUG */}

                          <td className="px-6 py-4">
                            <span className="inline-block rounded-md bg-zinc-800/80 px-2.5 py-1 font-mono text-xs text-zinc-400">
                              {category.slug}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-4">

                            <ToggleSwitch
                              checked={
                                Boolean(
                                  category.is_active
                                )
                              }
                              disabled={
                                togglingId ===
                                category.id
                              }
                              onChange={(next) =>
                                handleToggleStatus(
                                  category,
                                  next
                                )
                              }
                            />

                          </td>

                          {/* ACTION */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    category
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                                title="Edit kategori"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget(
                                    category
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300 transition-colors hover:bg-red-500/20 hover:text-red-400"
                                title="Hapus kategori"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                </tbody>

              </table>

            </div>

          </div>

        </main>
      </div>

      {/* CATEGORY MODAL */}

      <CategoryModal
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitCategory}
        initialData={editingCategory}
        saving={saving}
      />

      {/* DELETE MODAL */}

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        category={deleteTarget}
        onCancel={() =>
          setDeleteTarget(null)
        }
        onConfirm={handleDelete}
        deleting={deleting}
      />

    </div>
  );
}