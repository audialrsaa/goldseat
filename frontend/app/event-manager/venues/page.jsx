"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EventManagerSidebar from "../../components/event-manager/EventManagerSidebar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const API_URL = API_BASE_URL.replace(/\/$/, "");

const VENUES_ENDPOINT = `${API_URL}/venues`;

const EMPTY_VENUE_FORM = {
  name: "",
  address: "",
  city: "",
  maps_url: "",
  latitude: "",
  longitude: "",
  capacity: "",
};

// ============================================================
// TOKEN
// ============================================================

function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("smencore_token");
}

// ============================================================
// NORMALIZE API RESPONSE
// ============================================================

function extractArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }
  if (Array.isArray(response?.items)) {
    return response.items;
  }
  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function VenueManagementPage() {
  const router = useRouter();

  // ============================================================
  // STATE — VENUE
  // ============================================================

  const [venues, setVenues] = useState([]);

  const [loading, setLoading] = useState(true);

  const [savingVenue, setSavingVenue] = useState(false);

  const [deletingVenue, setDeletingVenue] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ============================================================
  // VIEW
  // ============================================================

  const [view, setView] = useState("list");

  // list | form

  // ============================================================
  // EDIT
  // ============================================================

  const [editingVenue, setEditingVenue] = useState(null);

  // ============================================================
  // FORM
  // ============================================================

  const [venueForm, setVenueForm] = useState(
    EMPTY_VENUE_FORM
  );

  const [venuePhotoFile, setVenuePhotoFile] =
    useState(null);

  const [venuePhotoPreview, setVenuePhotoPreview] =
    useState("");

  const [venueFormError, setVenueFormError] =
    useState("");

  // ============================================================
  // DELETE
  // ============================================================

  const [deleteVenueTarget, setDeleteVenueTarget] =
    useState(null);

  // ============================================================
  // SEARCH
  // ============================================================

  const [searchInput, setSearchInput] = useState("");

  // ============================================================
  // API REQUEST JSON
  // ============================================================

  async function apiRequest(url, options = {}) {
    const token = getToken();

    const response = await fetch(url, {
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

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (response.status === 401) {
      localStorage.removeItem("smencore_token");
      localStorage.removeItem("smencore_user");

      document.cookie =
        "smencore_token=; path=/; max-age=0";

      router.push("/login");

      throw new Error(
        "Sesi login sudah berakhir"
      );
    }

    if (response.status === 403) {
      throw new Error(
        data.message ||
          "Anda tidak memiliki akses ke halaman ini"
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Terjadi kesalahan server (${response.status})`
      );
    }

    return data;
  }

  // ============================================================
  // API REQUEST MULTIPART
  // ============================================================

  async function apiFormRequest(
    url,
    method,
    formData
  ) {
    const token = getToken();

    const response = await fetch(url, {
      method,

      headers: {
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
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

      document.cookie =
        "smencore_token=; path=/; max-age=0";

      router.push("/login");

      throw new Error(
        "Sesi login sudah berakhir"
      );
    }

    if (response.status === 403) {
      throw new Error(
        data.message ||
          "Anda tidak memiliki akses ke halaman ini"
      );
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Terjadi kesalahan server (${response.status})`
      );
    }

    return data;
  }

  // ============================================================
  // LOAD VENUES
  // ============================================================

  async function loadVenues() {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest(
        `${VENUES_ENDPOINT}/`
      );

      const data = extractArray(result);

      setVenues(data);
    } catch (err) {
      console.error(
        "LOAD VENUES ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal mengambil data venue"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadVenues();
  }, []);

  // ============================================================
  // RESET FORM
  // ============================================================

  function resetVenueForm() {
    setVenueForm({
      ...EMPTY_VENUE_FORM,
    });

    setVenuePhotoFile(null);

    setVenuePhotoPreview("");

    setVenueFormError("");
  }

  // ============================================================
  // OPEN ADD FORM
  // ============================================================

  function openAddVenueForm() {
    setEditingVenue(null);

    resetVenueForm();

    setError("");
    setSuccess("");

    setView("form");
  }

  // ============================================================
  // OPEN EDIT FORM
  // ============================================================

  function openEditVenueForm(venue) {
    setEditingVenue(venue);

    setVenueForm({
      name: venue.name ?? "",
      address: venue.address ?? "",
      city: venue.city ?? "",
      maps_url: venue.maps_url ?? "",
      latitude: venue.latitude ?? "",
      longitude: venue.longitude ?? "",
      capacity: venue.capacity ?? "",
    });

    setVenuePhotoFile(null);

    setVenuePhotoPreview(
      venue.photo || ""
    );

    setVenueFormError("");

    setError("");
    setSuccess("");

    setView("form");
  }

  // ============================================================
  // BACK TO LIST
  // ============================================================

  function backToVenueList() {
    if (savingVenue) return;

    setView("list");

    setEditingVenue(null);

    resetVenueForm();
  }

  // ============================================================
  // FORM CHANGE
  // ============================================================

  function handleVenueFormChange(event) {
    const {
      name,
      value,
    } = event.target;

    setVenueForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ============================================================
  // PHOTO
  // ============================================================

  function handleVenuePhoto(file) {
    if (!file) return;

    setVenuePhotoFile(file);

    setVenuePhotoPreview(
      URL.createObjectURL(file)
    );
  }

  // ============================================================
  // CREATE / UPDATE VENUE
  // ============================================================

  async function handleSubmitVenue(event) {
    event.preventDefault();

    if (!venueForm.name.trim()) {
      setVenueFormError(
        "Nama venue wajib diisi"
      );

      return;
    }

    setSavingVenue(true);

    setVenueFormError("");

    setError("");
    setSuccess("");

    try {
      const fd = new FormData();

      fd.append(
        "name",
        venueForm.name.trim()
      );

      fd.append(
        "address",
        venueForm.address || ""
      );

      fd.append(
        "city",
        venueForm.city || ""
      );

      fd.append(
        "maps_url",
        venueForm.maps_url || ""
      );

      fd.append(
        "latitude",
        venueForm.latitude || ""
      );

      fd.append(
        "longitude",
        venueForm.longitude || ""
      );

      fd.append(
        "capacity",
        venueForm.capacity || ""
      );

      if (venuePhotoFile) {
        fd.append(
          "photo",
          venuePhotoFile
        );
      }

      let result;

      if (editingVenue) {
        result = await apiFormRequest(
          `${VENUES_ENDPOINT}/${editingVenue.id}`,
          "PUT",
          fd
        );

        setVenues((prev) =>
          prev.map((v) =>
            v.id === editingVenue.id
              ? result.data
              : v
          )
        );

        setSuccess(
          result?.message ||
            "Venue berhasil diperbarui"
        );
      } else {
        result = await apiFormRequest(
          `${VENUES_ENDPOINT}/`,
          "POST",
          fd
        );

        setVenues((prev) => [
          result.data,
          ...prev,
        ]);

        setSuccess(
          result?.message ||
            "Venue berhasil dibuat"
        );
      }

      setView("list");

      setEditingVenue(null);

      resetVenueForm();
    } catch (err) {
      console.error(
        "CREATE / UPDATE VENUE ERROR:",
        err
      );

      setVenueFormError(
        err?.message ||
          "Gagal menyimpan venue"
      );
    } finally {
      setSavingVenue(false);
    }
  }

  // ============================================================
  // DELETE VENUE
  // ============================================================

  function openDeleteVenueModal(venue) {
    setDeleteVenueTarget(venue);
  }

  function closeDeleteVenueModal() {
    if (deletingVenue) return;

    setDeleteVenueTarget(null);
  }

  async function handleDeleteVenue() {
    if (!deleteVenueTarget) return;

    setDeletingVenue(true);

    setError("");

    setSuccess("");

    try {
      const result = await apiRequest(
        `${VENUES_ENDPOINT}/${deleteVenueTarget.id}`,
        {
          method: "DELETE",
        }
      );

      setVenues((prev) =>
        prev.filter(
          (v) =>
            v.id !== deleteVenueTarget.id
        )
      );

      setSuccess(
        result?.message ||
          "Venue berhasil dihapus"
      );

      setDeleteVenueTarget(null);
    } catch (err) {
      console.error(
        "DELETE VENUE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal menghapus venue"
      );

      setDeleteVenueTarget(null);
    } finally {
      setDeletingVenue(false);
    }
  }

  // ============================================================
  // FILTER SEARCH
  // ============================================================

  const filteredVenues = venues.filter(
    (venue) => {
      const q =
        searchInput
          .trim()
          .toLowerCase();

      if (!q) return true;

      const name = String(
        venue.name || ""
      ).toLowerCase();

      const address = String(
        venue.address || ""
      ).toLowerCase();

      const city = String(
        venue.city || ""
      ).toLowerCase();

      return (
        name.includes(q) ||
        address.includes(q) ||
        city.includes(q)
      );
    }
  );

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
                Manajemen Venue
              </div>

              <div className="text-[12px] text-gray-500 mt-1">
                Super Admin / Manajemen Venue
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
              Super Admin / Manajemen Venue
            </div>

            {view === "list" ? (
              <>
                {/* PAGE HEADER */}

                <div className="flex items-start justify-between gap-4 mb-7">
                  <div>
                    <h1 className="text-[24px] font-semibold">
                      Manajemen Venue
                    </h1>

                    <p className="text-[13px] text-gray-500 mt-1">
                      Kelola seluruh venue yang
                      digunakan untuk event
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      openAddVenueForm
                    }
                    className="h-[40px] px-4 rounded-xl bg-[#ffc857] text-black text-[13px] font-semibold hover:bg-[#ffd36f] transition"
                  >
                    + Tambah Venue
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

                {/* SEARCH */}

                <div className="flex justify-end mb-4">
                  <div className="flex items-center w-[280px] h-[38px] rounded-xl bg-[#15151f] border border-white/[0.09] px-3">
                    <span className="text-gray-600 mr-2">
                      ⌕
                    </span>

                    <input
                      value={searchInput}
                      onChange={(e) =>
                        setSearchInput(
                          e.target.value
                        )
                      }
                      placeholder="Cari venue..."
                      className="bg-transparent outline-none text-[12px] text-white placeholder:text-gray-600 w-full"
                    />
                  </div>
                </div>

                {/* VENUE LIST */}

                <div className="rounded-2xl border border-white/[0.08] bg-[#13131c] overflow-hidden">
                  {loading ? (
                    <div className="px-4 py-16 text-center text-[13px] text-gray-500">
                      Memuat data venue...
                    </div>
                  ) : filteredVenues.length ===
                    0 ? (
                    <div className="px-4 py-16 text-center text-[13px] text-gray-500">
                      {searchInput
                        ? "Venue tidak ditemukan."
                        : "Belum ada data venue."}
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.06]">
                      {filteredVenues.map(
                        (venue) => (
                          <div
                            key={venue.id}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.015] transition"
                          >
                            {/* PHOTO */}

                            <div className="w-[58px] h-[58px] rounded-xl overflow-hidden bg-gradient-to-br from-violet-500/30 to-amber-400/30 shrink-0">
                              {venue.photo ? (
                                <img
                                  src={
                                    venue.photo
                                  }
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-[18px]">
                                  🏟
                                </div>
                              )}
                            </div>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">
                              <div className="text-[14px] font-semibold text-gray-100 truncate">
                                {venue.name}
                              </div>

                              <div className="text-[12px] text-gray-500 mt-1 truncate">
                                {[
                                  venue.address,
                                  venue.city,
                                ]
                                  .filter(Boolean)
                                  .join(
                                    ", "
                                  ) || "-"}
                              </div>

                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-[11px] text-gray-600">
                                  Kapasitas:{" "}
                                  {venue.capacity ??
                                    "-"}
                                </span>

                                {venue.maps_url && (
                                  <a
                                    href={
                                      venue.maps_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-purple-400 hover:text-purple-300"
                                  >
                                    Lihat Maps
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* ACTION */}

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditVenueForm(
                                    venue
                                  )
                                }
                                title="Edit"
                                className="w-[34px] h-[34px] rounded-lg border border-white/[0.09] bg-[#15151f] text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
                              >
                                ✎
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteVenueModal(
                                    venue
                                  )
                                }
                                title="Hapus"
                                className="w-[34px] h-[34px] rounded-lg border border-red-500/10 bg-[#15151f] text-red-400 hover:bg-red-500/10 transition"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* FORM HEADER */}

                <div className="flex items-start gap-3 mb-7">
                  <button
                    type="button"
                    onClick={
                      backToVenueList
                    }
                    disabled={savingVenue}
                    className="w-[38px] h-[38px] rounded-xl border border-white/[0.09] bg-[#15151f] text-gray-400 hover:text-white transition"
                  >
                    ‹
                  </button>

                  <div>
                    <h1 className="text-[24px] font-semibold">
                      {editingVenue
                        ? "Edit Venue"
                        : "Tambah Venue"}
                    </h1>

                    <p className="text-[13px] text-gray-500 mt-1">
                      {editingVenue
                        ? "Perbarui informasi venue"
                        : "Tambahkan venue baru ke sistem"}
                    </p>
                  </div>
                </div>

                {/* FORM */}

                <div className="max-w-[760px]">
                  <form
                    onSubmit={
                      handleSubmitVenue
                    }
                    className="rounded-2xl border border-white/[0.08] bg-[#13131c] overflow-hidden"
                  >
                    <div className="p-6 space-y-5">
                      {/* PHOTO */}

                      <div>
                        <label className="block text-[12px] text-gray-400 mb-2">
                          Foto Venue
                        </label>

                        <label className="flex h-[180px] cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-white/[0.15] bg-[#14141e] text-[11px] text-gray-500 hover:border-purple-500/40 hover:text-gray-300 transition">
                          {venuePhotoPreview ? (
                            <img
                              src={
                                venuePhotoPreview
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <span className="text-[24px]">
                                🖼
                              </span>

                              <span>
                                Unggah foto venue
                              </span>

                              <span className="text-[10px] text-gray-600">
                                JPG, PNG, atau WEBP
                              </span>
                            </>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            disabled={
                              savingVenue
                            }
                            onChange={(e) =>
                              handleVenuePhoto(
                                e.target
                                  .files?.[0]
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* NAME */}

                      <div>
                        <label className="block text-[12px] text-gray-400 mb-2">
                          Nama Venue
                        </label>

                        <input
                          name="name"
                          value={
                            venueForm.name
                          }
                          onChange={
                            handleVenueFormChange
                          }
                          disabled={
                            savingVenue
                          }
                          placeholder="Contoh: Jakarta International Stadium"
                          className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 disabled:opacity-50"
                        />
                      </div>

                      {/* ADDRESS */}

                      <div>
                        <label className="block text-[12px] text-gray-400 mb-2">
                          Alamat
                        </label>

                        <textarea
                          name="address"
                          value={
                            venueForm.address
                          }
                          onChange={
                            handleVenueFormChange
                          }
                          disabled={
                            savingVenue
                          }
                          rows={3}
                          placeholder="Alamat lengkap venue"
                          className="w-full rounded-xl border border-white/[0.08] bg-[#14141e] px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 outline-none resize-none focus:border-purple-500/50 disabled:opacity-50"
                        />
                      </div>

                      {/* CITY + CAPACITY */}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] text-gray-400 mb-2">
                            Kota
                          </label>

                          <input
                            name="city"
                            value={
                              venueForm.city
                            }
                            onChange={
                              handleVenueFormChange
                            }
                            disabled={
                              savingVenue
                            }
                            placeholder="Contoh: Jakarta Utara"
                            className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] text-gray-400 mb-2">
                            Kapasitas
                          </label>

                          <input
                            type="number"
                            min="0"
                            name="capacity"
                            value={
                              venueForm.capacity
                            }
                            onChange={
                              handleVenueFormChange
                            }
                            disabled={
                              savingVenue
                            }
                            placeholder="Contoh: 80000"
                            className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* MAPS */}

                      <div>
                        <label className="block text-[12px] text-gray-400 mb-2">
                          Tautan Google Maps
                        </label>

                        <input
                          type="url"
                          name="maps_url"
                          value={
                            venueForm.maps_url
                          }
                          onChange={
                            handleVenueFormChange
                          }
                          disabled={
                            savingVenue
                          }
                          placeholder="https://maps.google.com/..."
                          className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 disabled:opacity-50"
                        />
                      </div>

                      {/* LATITUDE + LONGITUDE */}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] text-gray-400 mb-2">
                            Latitude
                          </label>

                          <input
                            name="latitude"
                            value={
                              venueForm.latitude
                            }
                            onChange={
                              handleVenueFormChange
                            }
                            disabled={
                              savingVenue
                            }
                            placeholder="Contoh: -6.1234"
                            className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-[12px] text-gray-400 mb-2">
                            Longitude
                          </label>

                          <input
                            name="longitude"
                            value={
                              venueForm.longitude
                            }
                            onChange={
                              handleVenueFormChange
                            }
                            disabled={
                              savingVenue
                            }
                            placeholder="Contoh: 106.8456"
                            className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* ERROR */}

                      {venueFormError && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-300">
                          {venueFormError}
                        </div>
                      )}
                    </div>

                    {/* FOOTER */}

                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={
                          backToVenueList
                        }
                        disabled={
                          savingVenue
                        }
                        className="h-[40px] px-5 rounded-xl border border-white/[0.08] text-[13px] text-gray-400 hover:text-white transition"
                      >
                        Batal
                      </button>

                      <button
                        type="submit"
                        disabled={
                          savingVenue
                        }
                        className="h-[40px] px-5 rounded-xl bg-[#ffc857] text-black text-[13px] font-semibold disabled:opacity-50"
                      >
                        {savingVenue
                          ? "Menyimpan..."
                          : editingVenue
                          ? "Simpan Perubahan"
                          : "Simpan Venue"}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      {/* ========================================================
          DELETE VENUE CONFIRM MODAL
      ======================================================== */}

      {deleteVenueTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={
              closeDeleteVenueModal
            }
          />

          <div className="relative w-full max-w-[420px] rounded-2xl border border-white/[0.1] bg-[#1a1a25] shadow-2xl p-5">
            <h2 className="text-[16px] font-semibold mb-2">
              Hapus Venue?
            </h2>

            <p className="text-[13px] text-gray-500 leading-6">
              Apakah kamu yakin ingin menghapus
              venue{" "}
              <span className="text-white font-medium">
                {deleteVenueTarget.name}
              </span>
              ? Jika venue ini masih dipakai oleh
              event yang ada, penghapusan bisa gagal.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={
                  closeDeleteVenueModal
                }
                disabled={
                  deletingVenue
                }
                className="h-[40px] px-5 rounded-xl border border-white/[0.08] text-[13px] text-gray-400"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteVenue
                }
                disabled={
                  deletingVenue
                }
                className="h-[40px] px-5 rounded-xl bg-red-500 text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {deletingVenue
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