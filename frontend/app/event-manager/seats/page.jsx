
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Armchair,
  CalendarDays,
  ChevronDown,
  LoaderCircle,
  RefreshCw,
  Ticket,
  WandSparkles,
  Search,
  LayoutGrid,
  ListChecks,
} from "lucide-react";

import EventManagerSidebar from "../../components/event-manager/EventManagerSidebar";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const CATEGORY_PREFIXES = {
  VIP: "VIP",
  Platinum: "PLAT",
  "CAT 1": "CAT1",
  "CAT 2": "CAT2",
  "CAT 3": "CAT3",
};

const STATUS_CONFIG = {
  available: {
    label: "Tersedia",
    color: "bg-emerald-100 border-emerald-300 text-emerald-700",
    icon: "bg-emerald-500",
  },
  locked: {
    label: "Terkunci",
    color: "bg-amber-100 border-amber-300 text-amber-700",
    icon: "bg-amber-500",
  },
  booked: {
    label: "Booked",
    color: "bg-red-100 border-red-300 text-red-700",
    icon: "bg-red-500",
  },
};

async function handleResponse(res) {
  let data = {};

  try {
    data = await res.json();
  } catch {
    // Response kosong atau bukan JSON.
  }

  if (!res.ok) {
    throw new Error(data.message || "Terjadi kesalahan pada server.");
  }

  return data;
}

function extractArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.events)) return response.events;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getCategoryPrefix(name) {
  const normalized = String(name || "").trim();

  return (
    CATEGORY_PREFIXES[normalized] ||
    normalized.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8) ||
    "SEAT"
  );
}

function generateSeatCodes(categoryName, stock, existingSeats = []) {
  const prefix = getCategoryPrefix(categoryName);

  const existingCodes = new Set(
    existingSeats.map((seat) => seat.seat_code)
  );

  const codes = [];

  for (let number = 1; number <= Number(stock); number++) {
    const code = `${prefix}-A${String(number).padStart(3, "0")}`;

    if (!existingCodes.has(code)) {
      codes.push(code);
    }
  }

  return codes;
}

function SeatStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    color: "bg-slate-100 border-slate-300 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export default function SeatManagementPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [categories, setCategories] = useState([]);
  const [seatCounts, setSeatCounts] = useState({});

  const [activeTab, setActiveTab] = useState("generate");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [searchSeat, setSearchSeat] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getAuthHeaders = useCallback(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("smencore_token")
        : null;

    if (!token) {
      throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/events/`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const response = await handleResponse(res);
    return extractArray(response);
  }, [getAuthHeaders]);

  const fetchCategories = useCallback(
    async (eventId) => {
      const res = await fetch(
        `${API_BASE_URL}/ticket-categories/?event_id=${eventId}`,
        {
          headers: getAuthHeaders(),
          cache: "no-store",
        }
      );

      const response = await handleResponse(res);
      return extractArray(response);
    },
    [getAuthHeaders]
  );

  const fetchSeats = useCallback(
    async (categoryId) => {
      const res = await fetch(
        `${API_BASE_URL}/seats/?ticket_category_id=${categoryId}`,
        {
          headers: getAuthHeaders(),
          cache: "no-store",
        }
      );

      const response = await handleResponse(res);
      return extractArray(response);
    },
    [getAuthHeaders]
  );

  const loadSeatCounts = useCallback(
    async (categoryList) => {
      const results = await Promise.all(
        categoryList.map(async (category) => {
          const seats = await fetchSeats(category.id);

          return {
            id: category.id,
            count: seats.length,
            seats,
          };
        })
      );

      const counts = {};

      results.forEach((item) => {
        counts[item.id] = {
          count: item.count,
          seats: item.seats,
        };
      });

      setSeatCounts(counts);
    },
    [fetchSeats]
  );

  const loadPage = useCallback(
    async (showRefresh = false) => {
      try {
        setError("");
        setSuccess("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const eventList = await fetchEvents();
        setEvents(eventList);

        const currentEventId = selectedEventId || eventList[0]?.id;

        if (!currentEventId) {
          setSelectedEventId("");
          setCategories([]);
          setSeatCounts({});
          setSelectedCategoryId("");
          return;
        }

        setSelectedEventId(String(currentEventId));

        const categoryList = await fetchCategories(currentEventId);
        setCategories(categoryList);

        setSelectedCategoryId((previous) => {
          const stillExists = categoryList.some(
            (category) => String(category.id) === String(previous)
          );

          return stillExists
            ? previous
            : String(categoryList[0]?.id || "");
        });

        await loadSeatCounts(categoryList);
      } catch (err) {
        setError(err.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchEvents, fetchCategories, loadSeatCounts, selectedEventId]
  );

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const selectedEvent = useMemo(
    () => events.find((event) => String(event.id) === String(selectedEventId)),
    [events, selectedEventId]
  );

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => String(category.id) === String(selectedCategoryId)
      ),
    [categories, selectedCategoryId]
  );

  const selectedSeats = useMemo(
    () => seatCounts[selectedCategoryId]?.seats || [],
    [seatCounts, selectedCategoryId]
  );

  const filteredSeats = useMemo(() => {
    const keyword = searchSeat.trim().toLowerCase();

    const sorted = [...selectedSeats].sort((a, b) =>
      String(a.seat_code).localeCompare(String(b.seat_code), undefined, {
        numeric: true,
      })
    );

    if (!keyword) return sorted;

    return sorted.filter((seat) =>
      String(seat.seat_code || "").toLowerCase().includes(keyword)
    );
  }, [selectedSeats, searchSeat]);

  const statusSummary = useMemo(() => {
    return selectedSeats.reduce(
      (summary, seat) => {
        if (seat.status === "available") summary.available++;
        else if (seat.status === "locked") summary.locked++;
        else if (seat.status === "booked") summary.booked++;
        else summary.other++;

        return summary;
      },
      { available: 0, locked: 0, booked: 0, other: 0 }
    );
  }, [selectedSeats]);

  const totalStock = categories.reduce(
    (total, category) => total + Number(category.stock || 0),
    0
  );

  const totalCreated = categories.reduce(
    (total, category) =>
      total + Number(seatCounts[category.id]?.count || 0),
    0
  );

  const remainingSeats = Math.max(totalStock - totalCreated, 0);

  async function handleEventChange(eventId) {
    setSelectedEventId(eventId);
    setCategories([]);
    setSeatCounts({});
    setSelectedCategoryId("");
    setSearchSeat("");
    setError("");
    setSuccess("");

    if (!eventId) return;

    try {
      setLoading(true);

      const categoryList = await fetchCategories(eventId);
      setCategories(categoryList);
      setSelectedCategoryId(String(categoryList[0]?.id || ""));

      await loadSeatCounts(categoryList);
    } catch (err) {
      setError(err.message || "Gagal memuat kategori tiket.");
    } finally {
      setLoading(false);
    }
  }

  async function generateCategorySeats(category) {
    const currentSeats = seatCounts[category.id]?.seats || [];

    const seatCodes = generateSeatCodes(
      category.name,
      category.stock,
      currentSeats
    );

    if (seatCodes.length === 0) {
      return {
        created: 0,
        message: `${category.name}: seluruh kursi sudah dibuat.`,
      };
    }

    const res = await fetch(`${API_BASE_URL}/seats/bulk`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ticket_category_id: category.id,
        seat_codes: seatCodes,
      }),
    });

    const response = await handleResponse(res);

    return {
      created: seatCodes.length,
      message:
        response.message ||
        `${seatCodes.length} kursi ${category.name} berhasil dibuat.`,
    };
  }

  async function handleGenerateOne(category) {
    try {
      setError("");
      setSuccess("");
      setGeneratingId(category.id);

      const result = await generateCategorySeats(category);

      await loadSeatCounts(categories);
      setSuccess(result.message);
    } catch (err) {
      setError(err.message || "Gagal membuat kursi.");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleGenerateAll() {
    if (!categories.length) return;

    const confirmed = window.confirm(
      "Generate semua kursi untuk seluruh kategori pada event ini?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setGeneratingAll(true);

      const messages = [];

      for (const category of categories) {
        const result = await generateCategorySeats(category);
        messages.push(result.message);
      }

      await loadSeatCounts(categories);

      setSuccess(
        messages.length ? messages.join(" ") : "Proses generate selesai."
      );
    } catch (err) {
      setError(err.message || "Gagal melakukan generate kursi.");
      await loadSeatCounts(categories);
    } finally {
      setGeneratingAll(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <EventManagerSidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* HEADER */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                EVENT MANAGER
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Seat Management
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Kelola kursi dan pantau ketersediaannya untuk setiap event.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadPage(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* NOTIFICATION */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {success}
            </div>
          )}

          {/* EVENT SELECTOR */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={19} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-900">Pilih Event</h2>
            </div>

            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => handleEventChange(e.target.value)}
                disabled={loading || events.length === 0}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              >
                <option value="">Pilih event</option>

                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title || `Event #${event.id}`}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {selectedEvent && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>Event ID: {selectedEvent.id}</span>

                {selectedEvent.event_date && (
                  <span>
                    Tanggal:{" "}
                    {new Date(
                      `${selectedEvent.event_date}T00:00:00`
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}

                {selectedEvent.publish_status && (
                  <span>Status: {selectedEvent.publish_status}</span>
                )}
              </div>
            )}
          </section>

          {/* MAIN TABS */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("generate")}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === "generate"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <WandSparkles size={17} />
              Generate Seat
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("layout")}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === "layout"
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid size={17} />
              Seat Layout
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
              <LoaderCircle size={20} className="mr-2 animate-spin" />
              Memuat data...
            </div>
          ) : !selectedEventId ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
              <Ticket size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                Belum ada event
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Tambahkan event terlebih dahulu untuk mengelola kursi.
              </p>
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
              <Ticket size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">
                Kategori tiket belum tersedia
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Buat kategori tiket terlebih dahulu untuk event ini.
              </p>
            </div>
          ) : activeTab === "generate" ? (
            <>
              {/* GENERATE SUMMARY */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Total kategori</p>
                    <Ticket size={20} className="text-indigo-600" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {categories.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Total stok kursi</p>
                    <Armchair size={20} className="text-indigo-600" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {totalStock.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Kursi sudah dibuat</p>
                    <WandSparkles size={20} className="text-emerald-600" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {totalCreated.toLocaleString("id-ID")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {remainingSeats.toLocaleString("id-ID")} kursi belum dibuat
                  </p>
                </div>
              </section>

              {/* GENERATE CATEGORY */}
              <section className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Kategori Tiket
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Generate kursi sesuai jumlah stok setiap kategori.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAll}
                    disabled={
                      generatingAll ||
                      generatingId !== null ||
                      !categories.length ||
                      remainingSeats === 0
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generatingAll ? (
                      <LoaderCircle size={17} className="animate-spin" />
                    ) : (
                      <WandSparkles size={17} />
                    )}
                    {generatingAll ? "Sedang Generate..." : "Generate Semua Kursi"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {categories.map((category) => {
                    const created = seatCounts[category.id]?.count || 0;
                    const stock = Number(category.stock || 0);
                    const remaining = Math.max(stock - created, 0);

                    const progress =
                      stock > 0
                        ? Math.min((created / stock) * 100, 100)
                        : 0;

                    const isGenerating =
                      generatingId === category.id || generatingAll;

                    return (
                      <article
                        key={category.id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {category.name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {formatRupiah(category.price)}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              remaining === 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {remaining === 0 ? "Lengkap" : "Belum lengkap"}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Total stok</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                              {stock.toLocaleString("id-ID")}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Kursi dibuat</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                              {created.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 flex justify-between text-xs">
                            <span className="text-slate-500">
                              Progres pembuatan kursi
                            </span>
                            <span className="font-semibold text-slate-700">
                              {Math.round(progress)}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-indigo-600 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <p className="mt-2 text-xs text-slate-500">
                            {remaining.toLocaleString("id-ID")} kursi tersisa
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleGenerateOne(category)}
                          disabled={isGenerating || remaining === 0}
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <LoaderCircle size={17} className="animate-spin" />
                          ) : (
                            <WandSparkles size={17} />
                          )}

                          {remaining === 0
                            ? "Semua Kursi Sudah Dibuat"
                            : `Generate ${remaining} Kursi`}
                        </button>

                        <p className="mt-3 text-center text-xs text-slate-400">
                          Category ID: {category.id}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          ) : (
            <>
              {/* SEAT LAYOUT FILTER */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <LayoutGrid size={19} className="text-indigo-600" />
                  <h2 className="font-semibold text-slate-900">
                    Pengaturan Denah Kursi
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Kategori Tiket
                    </label>

                    <select
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value);
                        setSearchSeat("");
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Cari kode kursi
                    </label>

                    <div className="relative">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={searchSeat}
                        onChange={(e) => setSearchSeat(e.target.value)}
                        placeholder="Contoh: VIP-A001"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* SEAT STATUS SUMMARY */}
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium text-slate-500">
                    Total kursi
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {selectedSeats.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700">
                    Tersedia
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-800">
                    {statusSummary.available}
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-700">
                    Terkunci
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-800">
                    {statusSummary.locked}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-medium text-red-700">
                    Booked
                  </p>
                  <p className="mt-2 text-2xl font-bold text-red-800">
                    {statusSummary.booked}
                  </p>
                </div>
              </section>

              {/* SEAT MAP */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Denah Kursi
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedCategory?.name || "Kategori"} ·{" "}
                      {selectedCategory
                        ? formatRupiah(selectedCategory.price)
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadPage(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={15}
                      className={refreshing ? "animate-spin" : ""}
                    />
                    Refresh Denah
                  </button>
                </div>

                {/* LEGEND */}
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 border-b border-slate-100 pb-5">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <div key={status} className="flex items-center gap-2">
                      <span
                        className={`h-3.5 w-3.5 rounded ${config.icon}`}
                      />
                      <span className="text-xs font-medium text-slate-600">
                        {config.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* STAGE */}
                <div className="mx-auto mb-8 mt-8 max-w-2xl">
                  <div className="rounded-t-[50%] border-t-4 border-indigo-400 bg-indigo-50 px-5 py-4 text-center">
                    <p className="text-sm font-bold tracking-[0.25em] text-indigo-700">
                      STAGE
                    </p>
                  </div>
                </div>

                {/* SEAT GRID */}
                {filteredSeats.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                    <Armchair
                      size={34}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 font-semibold text-slate-700">
                      {selectedSeats.length === 0
                        ? "Belum ada kursi pada kategori ini"
                        : "Kursi tidak ditemukan"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedSeats.length === 0
                        ? "Generate kursi terlebih dahulu melalui tab Generate Seat."
                        : "Coba gunakan kata kunci pencarian lain."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-3">
                    <div className="mx-auto grid w-max grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
                      {filteredSeats.map((seat) => {
                        const config = STATUS_CONFIG[seat.status] || {
                          label: "Unknown",
                          color:
                            "bg-slate-100 border-slate-300 text-slate-600",
                        };

                        return (
                          <div
                            key={seat.id}
                            title={`${seat.seat_code} - ${config.label}`}
                            className={`flex h-[62px] w-[62px] flex-col items-center justify-center rounded-xl border transition ${config.color}`}
                          >
                            <Armchair size={20} />
                            <span className="mt-1 text-[9px] font-bold">
                              {seat.seat_code}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span>
                    Menampilkan {filteredSeats.length} dari{" "}
                    {selectedSeats.length} kursi
                  </span>
                  <span>
                    Category ID: {selectedCategoryId || "-"}
                  </span>
                </div>
              </section>

              {/* SEAT TABLE */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 p-5">
                  <ListChecks size={19} className="text-indigo-600" />
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Detail Data Kursi
                    </h2>
                    <p className="text-xs text-slate-500">
                      Data yang diambil langsung dari database.
                    </p>
                  </div>
                </div>

                {filteredSeats.length === 0 ? (
                  <p className="p-6 text-center text-sm text-slate-500">
                    Tidak ada data kursi.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-5 py-3">ID</th>
                          <th className="px-5 py-3">Kode Kursi</th>
                          <th className="px-5 py-3">Kategori ID</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Locked By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSeats.map((seat) => (
                          <tr
                            key={seat.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-3 text-slate-500">
                              {seat.id}
                            </td>
                            <td className="px-5 py-3 font-semibold text-slate-800">
                              {seat.seat_code}
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {seat.ticket_category_id}
                            </td>
                            <td className="px-5 py-3">
                              <SeatStatusBadge status={seat.status} />
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {seat.locked_by ?? "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
