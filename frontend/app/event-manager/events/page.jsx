"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EventManagerSidebar from "../../components/event-manager/EventManagerSidebar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

const API_URL = API_BASE_URL.replace(/\/$/, "");

const EVENTS_ENDPOINT = `${API_URL}/events`;
const ARTISTS_ENDPOINT = `${API_URL}/artists`;
const VENUES_ENDPOINT = `${API_URL}/venues`;
const CATEGORIES_ENDPOINT = `${API_URL}/admin/event-categories`;

// ============================================================
// STATUS
// ============================================================

const STATUS_META = {
  draft: {
    label: "Draft",
    dot: "bg-gray-400",
    pill: "bg-gray-500/15 text-gray-400",
  },
  published: {
    label: "Published",
    dot: "bg-emerald-400",
    pill: "bg-emerald-500/15 text-emerald-400",
  },
  unpublished: {
    label: "Unpublished",
    dot: "bg-amber-400",
    pill: "bg-amber-500/15 text-amber-400",
  },
};

const STATUS_OPTIONS = ["draft", "published", "unpublished"];

const EMPTY_FORM = {
  id: null,
  artist_id: "",
  venue_id: "",
  category_id: "",
  title: "",
  description: "",
  rules: "",
  faq: "",
  event_date: "",
  start_time: "",
  end_time: "",
  min_age: "",
  terms_url: "",
  publish_status: "draft",
};

// ============================================================
// TOKEN
// ============================================================

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smencore_token");
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function nameFromList(list, id) {
  const match = list.find((item) => String(item.id) === String(id));
  return match ? match.name : "-";
}

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.draft;
}

// ============================================================
// NORMALIZE API RESPONSE
// ============================================================

function extractArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;

  return [];
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function EventManagementPage() {
  const router = useRouter();

  // ============================================================
  // STATE — EVENT
  // ============================================================

  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingReferences, setLoadingReferences] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [page, setPage] = useState(1);
  const [perPage] = useState(6);

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);

  const [statusMenuId, setStatusMenuId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [posterFile, setPosterFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [posterPreview, setPosterPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  // ============================================================
  // API REQUEST JSON
  // ============================================================

  async function apiRequest(url, options = {}) {
    const token = getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      localStorage.removeItem("smencore_token");
      localStorage.removeItem("smencore_user");
      document.cookie = "smencore_token=; path=/; max-age=0";

      router.push("/login");

      throw new Error("Sesi login sudah berakhir");
    }

    if (response.status === 403) {
      throw new Error(
        data.message || "Anda tidak memiliki akses ke halaman ini"
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message || `Terjadi kesalahan server (${response.status})`
      );
    }

    return data;
  }

  // ============================================================
  // API REQUEST MULTIPART
  // ============================================================

  async function apiFormRequest(url, method, formData) {
    const token = getToken();

    const response = await fetch(url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      localStorage.removeItem("smencore_token");
      localStorage.removeItem("smencore_user");
      document.cookie = "smencore_token=; path=/; max-age=0";

      router.push("/login");

      throw new Error("Sesi login sudah berakhir");
    }

    if (response.status === 403) {
      throw new Error(
        data.message || "Anda tidak memiliki akses ke halaman ini"
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message || `Terjadi kesalahan server (${response.status})`
      );
    }

    return data;
  }

  // ============================================================
  // LOAD EVENTS
  // ============================================================

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest(`${EVENTS_ENDPOINT}/`);
      const data = extractArray(result);

      setEvents(data);
    } catch (err) {
      console.error("LOAD EVENTS ERROR:", err);
      setError(err?.message || "Gagal mengambil data event");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD REFERENCES
  // ARTIST + VENUE + CATEGORY
  // ============================================================

  async function loadReferences() {
    try {
      setLoadingReferences(true);

      const [artistResult, venueResult, categoryResult] =
        await Promise.all([
          apiRequest(`${ARTISTS_ENDPOINT}/`),
          apiRequest(`${VENUES_ENDPOINT}/`),
          apiRequest(`${CATEGORIES_ENDPOINT}/`),
        ]);

      const artistData = extractArray(artistResult);
      const venueData = extractArray(venueResult);
      const categoryData = extractArray(categoryResult);

      setArtists(artistData);
      setVenues(venueData);
      setCategories(categoryData);

      return {
        artists: artistData,
        venues: venueData,
        categories: categoryData,
      };
    } catch (err) {
      console.error("LOAD REFERENCES ERROR:", err);

      setError(
        err?.message ||
          "Gagal mengambil data artist, venue, atau kategori"
      );

      return null;
    } finally {
      setLoadingReferences(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadEvents();
    loadReferences();
  }, []);

  // ============================================================
  // SEARCH DEBOUNCE
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ============================================================
  // FILTER + PAGINATION
  // ============================================================

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (statusFilter && ev.publish_status !== statusFilter) {
        return false;
      }

      if (
        categoryFilter &&
        String(ev.category_id) !== String(categoryFilter)
      ) {
        return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();

        const title = String(ev.title || "").toLowerCase();

        const venueName = nameFromList(
          venues,
          ev.venue_id
        ).toLowerCase();

        if (!title.includes(q) && !venueName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    events,
    statusFilter,
    categoryFilter,
    search,
    venues,
  ]);

  const total = filteredEvents.length;

  const totalPages = Math.max(
    1,
    Math.ceil(total / perPage)
  );

  const pageItems = filteredEvents.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const firstItem =
    total === 0 ? 0 : (page - 1) * perPage + 1;

  const lastItem =
    total === 0
      ? 0
      : Math.min(page * perPage, total);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, search]);

  // ============================================================
  // RESET FORM EVENT
  // ============================================================

  function resetForm() {
    setForm({ ...EMPTY_FORM });

    setPosterFile(null);
    setBannerFile(null);

    setPosterPreview("");
    setBannerPreview("");
  }

  // ============================================================
  // OPEN ADD EVENT
  // ============================================================

  async function openAddModal() {
    setEditingEvent(null);

    resetForm();

    setError("");
    setSuccess("");

    await loadReferences();

    setShowModal(true);
  }

  // ============================================================
  // OPEN EDIT EVENT
  // ============================================================

  async function openEditModal(ev) {
    setEditingEvent(ev);

    setForm({
      id: ev.id,
      artist_id: ev.artist_id ?? "",
      venue_id: ev.venue_id ?? "",
      category_id: ev.category_id ?? "",
      title: ev.title ?? "",
      description: ev.description ?? "",
      rules: ev.rules ?? "",
      faq: ev.faq ?? "",
      event_date: ev.event_date ?? "",
      start_time: ev.start_time ?? "",
      end_time: ev.end_time ?? "",
      min_age: ev.min_age ?? "",
      terms_url: ev.terms_url ?? "",
      publish_status: ev.publish_status ?? "draft",
    });

    setPosterFile(null);
    setBannerFile(null);

    setPosterPreview(ev.poster || "");
    setBannerPreview(ev.banner || "");

    setError("");
    setSuccess("");

    await loadReferences();

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingEvent(null);

    resetForm();
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFile(key, file) {
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (key === "poster") {
      setPosterFile(file);
      setPosterPreview(url);
    } else {
      setBannerFile(file);
      setBannerPreview(url);
    }
  }

  // ============================================================
  // CREATE / UPDATE EVENT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.artist_id) {
        throw new Error("Artist wajib dipilih");
      }

      if (!form.venue_id) {
        throw new Error("Venue wajib dipilih");
      }

      if (!form.category_id) {
        throw new Error("Kategori event wajib dipilih");
      }

      if (!form.title.trim()) {
        throw new Error("Judul event wajib diisi");
      }

      if (!form.event_date) {
        throw new Error("Tanggal event wajib diisi");
      }

      if (!form.start_time) {
        throw new Error("Jam mulai event wajib diisi");
      }

      const fd = new FormData();

      fd.append("artist_id", form.artist_id);
      fd.append("venue_id", form.venue_id);
      fd.append("category_id", form.category_id);

      fd.append("title", form.title.trim());
      fd.append("description", form.description || "");
      fd.append("rules", form.rules || "");
      fd.append("faq", form.faq || "");

      fd.append("event_date", form.event_date);
      fd.append("start_time", form.start_time);

      if (form.end_time) {
        fd.append("end_time", form.end_time);
      }

      if (form.min_age) {
        fd.append("min_age", form.min_age);
      }

      fd.append("terms_url", form.terms_url || "");
      fd.append("publish_status", form.publish_status);

      if (posterFile) {
        fd.append("poster", posterFile);
      }

      if (bannerFile) {
        fd.append("banner", bannerFile);
      }

      let result;

      if (editingEvent) {
        result = await apiFormRequest(
          `${EVENTS_ENDPOINT}/${editingEvent.id}`,
          "PUT",
          fd
        );
      } else {
        result = await apiFormRequest(
          `${EVENTS_ENDPOINT}/`,
          "POST",
          fd
        );
      }

      setSuccess(
        result?.message ||
          (editingEvent
            ? "Event berhasil diperbarui"
            : "Event berhasil dibuat")
      );

      setShowModal(false);
      setEditingEvent(null);

      resetForm();

      await loadEvents();
      await loadReferences();
    } catch (err) {
      console.error(
        "CREATE / UPDATE EVENT ERROR:",
        err
      );

      setError(
        err?.message || "Gagal menyimpan event"
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // CHANGE PUBLISH STATUS
  // ============================================================

  async function handleStatusChange(ev, newStatus) {
    setStatusMenuId(null);

    if (newStatus === ev.publish_status) {
      return;
    }

    setStatusUpdatingId(ev.id);

    const previousEvents = events;

    setEvents((current) =>
      current.map((e) =>
        e.id === ev.id
          ? {
              ...e,
              publish_status: newStatus,
            }
          : e
      )
    );

    try {
      const result = await apiRequest(
        `${EVENTS_ENDPOINT}/${ev.id}/publish`,
        {
          method: "PATCH",
          body: JSON.stringify({
            publish_status: newStatus,
          }),
        }
      );

      setSuccess(
        result?.message ||
          "Status publikasi berhasil diubah"
      );
    } catch (err) {
      console.error(
        "CHANGE STATUS ERROR:",
        err
      );

      setEvents(previousEvents);

      setError(
        err?.message ||
          "Gagal mengubah status publikasi"
      );
    } finally {
      setStatusUpdatingId(null);
    }
  }

  // ============================================================
  // DELETE EVENT
  // ============================================================

  function openDeleteModal(ev) {
    setDeletingEvent(ev);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (saving) return;

    setShowDeleteModal(false);
    setDeletingEvent(null);
  }

  async function handleDelete() {
    if (!deletingEvent) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await apiRequest(
        `${EVENTS_ENDPOINT}/${deletingEvent.id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        result?.message ||
          "Event berhasil dihapus"
      );

      setShowDeleteModal(false);
      setDeletingEvent(null);

      await loadEvents();
    } catch (err) {
      console.error(
        "DELETE EVENT ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal menghapus event"
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  function previousPage() {
    if (page <= 1) return;

    setPage((prev) => prev - 1);
  }

  function nextPage() {
    if (page >= totalPages) return;

    setPage((prev) => prev + 1);
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <div className="flex min-h-screen">
        <EventManagerSidebar />

        <main className="flex-1 min-w-0">
          {/* TOP BAR */}

          <header className="h-[72px] border-b border-white/[0.08] flex items-center justify-between px-7">
            <div>
              <div className="text-[16px] font-semibold">
                Manajemen Event
              </div>

              <div className="text-[12px] text-gray-500 mt-1">
                Super Admin / Manajemen Event
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center w-[330px] h-[40px] rounded-xl bg-[#14141d] border border-white/[0.08] px-4">
                <span className="text-gray-500 mr-2">
                  ⌕
                </span>

                <input
                  placeholder="Cari event, order, atau user..."
                  className="bg-transparent outline-none text-[13px] text-white placeholder:text-gray-600 w-full"
                  readOnly
                />
              </div>

              <div className="h-[40px] px-4 rounded-xl bg-[#14141d] border border-white/[0.08] flex items-center text-[13px] font-medium">
                Super Admin
              </div>

              <div className="w-[40px] h-[40px] rounded-xl bg-[#6546e8] flex items-center justify-center font-semibold">
                A
              </div>
            </div>
          </header>

          {/* CONTENT */}

          <section className="p-7">
            <div className="mb-1 text-[12px] text-gray-500">
              Super Admin / Manajemen Event
            </div>

            <div className="flex items-start justify-between gap-4 mb-7">
              <div>
                <h1 className="text-[24px] font-semibold">
                  Manajemen Event
                </h1>

                <p className="text-[13px] text-gray-500 mt-1">
                  Seluruh event dari semua Event Manager
                </p>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="h-[40px] px-4 rounded-xl bg-[#ffc857] text-black text-[13px] font-semibold hover:bg-[#ffd36f] transition"
              >
                + Tambah Event
              </button>
            </div>

            {/* ALERT */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">
                {success}
              </div>
            )}

            {/* FILTERS */}

            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  className="h-[38px] min-w-[145px] rounded-xl border border-white/[0.09] bg-[#15151f] px-3 text-[13px] text-gray-200 outline-none"
                >
                  <option value="">
                    Semua Status
                  </option>

                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value)
                  }
                  className="h-[38px] min-w-[150px] rounded-xl border border-white/[0.09] bg-[#15151f] px-3 text-[13px] text-gray-200 outline-none"
                >
                  <option value="">
                    Semua Kategori
                  </option>

                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center w-[220px] h-[38px] rounded-xl bg-[#15151f] border border-white/[0.09] px-3">
                <span className="text-gray-600 mr-2">
                  ⌕
                </span>

                <input
                  value={searchInput}
                  onChange={(e) =>
                    setSearchInput(e.target.value)
                  }
                  placeholder="Cari event atau venue..."
                  className="bg-transparent outline-none text-[12px] text-white placeholder:text-gray-600 w-full"
                />
              </div>
            </div>

            {/* TABLE */}

            <div className="rounded-2xl border border-white/[0.08] bg-[#13131c] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-[#161620]">
                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        EVENT
                      </th>

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        VENUE
                      </th>

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        TANGGAL
                      </th>

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        KATEGORI
                      </th>

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        STATUS
                      </th>

                      <th className="text-center px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        AKSI
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-16 text-center text-[13px] text-gray-500"
                        >
                          Memuat data event...
                        </td>
                      </tr>
                    ) : pageItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-16 text-center text-[13px] text-gray-500"
                        >
                          Tidak ada event ditemukan.
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((ev) => {
                        const meta = statusMeta(
                          ev.publish_status
                        );

                        return (
                          <tr
                            key={ev.id}
                            className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.015] transition"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-[38px] h-[38px] rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/30 to-amber-400/30 shrink-0">
                                  {ev.poster && (
                                    <img
                                      src={ev.poster}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="text-[13px] font-semibold text-gray-100 truncate">
                                    {ev.title}
                                  </div>

                                  <div className="text-[11px] text-gray-600 mt-0.5 truncate">
                                    {nameFromList(
                                      artists,
                                      ev.artist_id
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-[12px] text-gray-200">
                                {nameFromList(
                                  venues,
                                  ev.venue_id
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-[12px] text-gray-300">
                                {formatDate(
                                  ev.event_date
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-[#20202c] px-3 py-1 text-[11px] text-gray-400">
                                {nameFromList(
                                  categories,
                                  ev.category_id
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStatusMenuId(
                                      statusMenuId === ev.id
                                        ? null
                                        : ev.id
                                    )
                                  }
                                  disabled={
                                    statusUpdatingId === ev.id
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition hover:brightness-110 ${meta.pill}`}
                                >
                                  <span
                                    className={`w-[5px] h-[5px] rounded-full ${meta.dot}`}
                                  />

                                  {statusUpdatingId ===
                                  ev.id
                                    ? "Menyimpan..."
                                    : meta.label}

                                  <span className="text-gray-500">
                                    ▾
                                  </span>
                                </button>

                                {statusMenuId === ev.id && (
                                  <div className="absolute left-0 top-full z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-white/[0.09] bg-[#1a1a25] py-1 shadow-2xl">
                                    {STATUS_OPTIONS.map(
                                      (s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() =>
                                            handleStatusChange(
                                              ev,
                                              s
                                            )
                                          }
                                          className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] text-gray-300 hover:bg-white/[0.06]"
                                        >
                                          <span className="flex items-center gap-2">
                                            <span
                                              className={`w-[5px] h-[5px] rounded-full ${STATUS_META[s].dot}`}
                                            />

                                            {
                                              STATUS_META[
                                                s
                                              ].label
                                            }
                                          </span>

                                          {s ===
                                            ev.publish_status && (
                                            <span>
                                              ✓
                                            </span>
                                          )}
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(ev)
                                  }
                                  title="Edit"
                                  className="w-[32px] h-[32px] rounded-lg border border-white/[0.09] bg-[#15151f] text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
                                >
                                  ✎
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openDeleteModal(ev)
                                  }
                                  title="Hapus"
                                  className="w-[32px] h-[32px] rounded-lg border border-red-500/10 bg-[#15151f] text-red-400 hover:bg-red-500/10 transition"
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* FOOTER */}

              <div className="h-[58px] px-4 flex items-center justify-between border-t border-white/[0.07]">
                <div className="text-[11px] text-gray-500">
                  Menampilkan {firstItem}–{lastItem} dari{" "}
                  {total} event
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      page <= 1 || loading
                    }
                    onClick={previousPage}
                    className="w-[32px] h-[32px] rounded-lg border border-white/[0.09] bg-[#15151f] text-gray-400 disabled:opacity-30 hover:text-white transition"
                  >
                    ‹
                  </button>

                  <span className="text-[12px] text-gray-500 px-2">
                    {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >= totalPages || loading
                    }
                    onClick={nextPage}
                    className="w-[32px] h-[32px] rounded-lg border border-white/[0.09] bg-[#15151f] text-gray-400 disabled:opacity-30 hover:text-white transition"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ========================================================
          ADD / EDIT EVENT MODAL
      ======================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative w-full max-w-[640px] max-h-[88vh] overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#1a1a25] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#1a1a25]">
              <div>
                <h2 className="text-[16px] font-semibold">
                  {editingEvent
                    ? "Edit Event"
                    : "Tambah Event"}
                </h2>

                {loadingReferences && (
                  <div className="text-[10px] text-gray-600 mt-1">
                    Memuat data terbaru...
                  </div>
                )}

                {!loadingReferences &&
                  categories.length === 0 && (
                    <div className="text-[10px] text-red-400 mt-1">
                      Tidak ada kategori dari server
                    </div>
                  )}
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-[32px] h-[32px] rounded-lg border border-white/[0.08] text-gray-500 hover:text-white transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* ARTIST */}

                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Artist
                    </label>

                    <select
                      name="artist_id"
                      value={form.artist_id}
                      onChange={handleFormChange}
                      disabled={loadingReferences}
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50 disabled:opacity-50"
                    >
                      <option value="">
                        Pilih artist
                      </option>

                      {artists.map((a) => (
                        <option
                          key={a.id}
                          value={a.id}
                        >
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* VENUE */}

                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Venue
                    </label>

                    <select
                      name="venue_id"
                      value={form.venue_id}
                      onChange={handleFormChange}
                      disabled={loadingReferences}
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50 disabled:opacity-50"
                    >
                      <option value="">
                        Pilih venue
                      </option>

                      {venues.map((v) => (
                        <option
                          key={v.id}
                          value={v.id}
                        >
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CATEGORY */}

                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Kategori
                    </label>

                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleFormChange}
                      disabled={loadingReferences}
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50 disabled:opacity-50"
                    >
                      <option value="">
                        {loadingReferences
                          ? "Memuat kategori..."
                          : categories.length === 0
                          ? "Tidak ada kategori"
                          : "Pilih kategori"}
                      </option>

                      {categories.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                        >
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TITLE */}

                <div>
                  <label className="block text-[12px] text-gray-400 mb-2">
                    Judul Event
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="Contoh: RIIZE World Tour — Jakarta"
                    className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                  />

                  {form.title && (
                    <div className="mt-1.5 text-[11px] text-gray-600">
                      Slug: {slugify(form.title)}
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="block text-[12px] text-gray-400 mb-2">
                    Deskripsi
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Ceritakan tentang event ini"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#14141e] px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 outline-none resize-none focus:border-purple-500/50"
                  />
                </div>

                {/* RULES + FAQ */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Rules
                    </label>

                    <textarea
                      name="rules"
                      value={form.rules}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="Aturan selama event"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#14141e] px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 outline-none resize-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      FAQ
                    </label>

                    <textarea
                      name="faq"
                      value={form.faq}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="Pertanyaan yang sering diajukan"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#14141e] px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 outline-none resize-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* POSTER + BANNER */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Poster
                    </label>

                    <label className="flex h-[120px] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-white/[0.15] bg-[#14141e] text-[11px] text-gray-500 hover:border-purple-500/40 hover:text-gray-300 transition">
                      {posterPreview ? (
                        <img
                          src={posterPreview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <span className="text-[18px]">
                            🖼
                          </span>
                          <span>
                            Unggah poster
                          </span>
                        </>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFile(
                            "poster",
                            e.target.files?.[0]
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Banner
                    </label>

                    <label className="flex h-[120px] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-white/[0.15] bg-[#14141e] text-[11px] text-gray-500 hover:border-purple-500/40 hover:text-gray-300 transition">
                      {bannerPreview ? (
                        <img
                          src={bannerPreview}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <span className="text-[18px]">
                            🖼
                          </span>
                          <span>
                            Unggah banner
                          </span>
                        </>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFile(
                            "banner",
                            e.target.files?.[0]
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* DATE */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Tanggal Event
                    </label>

                    <input
                      type="date"
                      name="event_date"
                      value={form.event_date}
                      onChange={handleFormChange}
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Jam Mulai
                    </label>

                    <input
                      type="time"
                      step="1"
                      name="start_time"
                      value={form.start_time}
                      onChange={handleFormChange}
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Jam Selesai
                    </label>

                    <input
                      type="time"
                      step="1"
                      name="end_time"
                      value={form.end_time}
                      onChange={handleFormChange}
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* AGE + TERMS */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Batas Usia Minimum
                    </label>

                    <input
                      type="number"
                      min="0"
                      name="min_age"
                      value={form.min_age}
                      onChange={handleFormChange}
                      placeholder="Contoh: 17"
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] text-gray-400 mb-2">
                      Tautan Syarat & Ketentuan
                    </label>

                    <input
                      type="url"
                      name="terms_url"
                      value={form.terms_url}
                      onChange={handleFormChange}
                      placeholder="https://..."
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* STATUS */}

                <div>
                  <label className="block text-[12px] text-gray-400 mb-2">
                    Status Publikasi
                  </label>

                  <select
                    name="publish_status"
                    value={form.publish_status}
                    onChange={handleFormChange}
                    className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-300">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-[40px] px-5 rounded-xl border border-white/[0.08] text-[13px] text-gray-400 hover:text-white transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingReferences ||
                    categories.length === 0
                  }
                  className="h-[40px] px-5 rounded-xl bg-[#ffc857] text-black text-[13px] font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingEvent
                    ? "Simpan Perubahan"
                    : "Simpan Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE EVENT MODAL
      ======================================================== */}

      {showDeleteModal && deletingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          <div className="relative w-full max-w-[420px] rounded-2xl border border-white/[0.1] bg-[#1a1a25] shadow-2xl p-5">
            <h2 className="text-[16px] font-semibold mb-2">
              Hapus Event?
            </h2>

            <p className="text-[13px] text-gray-500 leading-6">
              Apakah kamu yakin ingin menghapus event{" "}
              <span className="text-white font-medium">
                {deletingEvent.title}
              </span>
              ? Tindakan ini tidak bisa dibatalkan.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={saving}
                className="h-[40px] px-5 rounded-xl border border-white/[0.08] text-[13px] text-gray-400"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="h-[40px] px-5 rounded-xl bg-red-500 text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {saving
                  ? "Menghapus..."
                  : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}