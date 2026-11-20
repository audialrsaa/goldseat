"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

import {
  fetchAllEvents,
  fetchCheckinHistory,
} from "../../../lib/checkin-api";

function formatCheckinTime(value) {
  if (!value) return "-";

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function CheckinHistoryPage() {
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    fetchAllEvents()
      .then((result) => {
        if (active) setEvents(result);
      })
      .catch((fetchError) => {
        if (active) setEventsError(fetchError.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchCheckinHistory({
      eventId: eventFilter || undefined,
      page,
    })
      .then((result) => {
        if (!active) return;
        setHistory(result.data);
        setPagination(result.pagination);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [eventFilter, page, refreshKey]);

  function handleEventFilterChange(event) {
    setLoading(true);
    setError("");
    setEventFilter(event.target.value);
    setPage(1);
  }

  function refreshHistory() {
    setLoading(true);
    setError("");
    setRefreshKey((key) => key + 1);
  }

  function goToPage(nextPage) {
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  return (
    <main className="px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">
            Aktivitas akun Anda
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-[28px]">
            Riwayat Check-in
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Riwayat tiket yang telah Anda proses.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshHistory}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900"
        >
          <RefreshCw size={15} />
          Muat ulang
        </button>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <div className="flex flex-col gap-3 border-b border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              Aktivitas tiket
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {pagination.total.toLocaleString("id-ID")} catatan
            </p>
          </div>
          <label className="flex flex-col gap-1.5 text-xs text-zinc-400 sm:min-w-64">
            Filter event
            <select
              value={eventFilter}
              onChange={handleEventFilterChange}
              disabled={Boolean(eventsError)}
              className="rounded-lg border border-zinc-700 bg-[#0a0a0e] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-violet-400 disabled:opacity-50"
            >
              <option value="">Semua event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            {eventsError && (
              <span role="status" className="text-[11px] text-amber-300">
                Filter event tidak tersedia: {eventsError}
              </span>
            )}
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300"
          >
            Gagal memuat riwayat: {error}
          </div>
        )}

        {loading && (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">
            Memuat riwayat check-in...
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="px-5 py-12 text-center">
            <ClipboardList className="mx-auto text-zinc-600" size={28} />
            <p className="mt-3 font-medium text-zinc-200">
              Belum ada riwayat check-in
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Aktivitas yang Anda proses akan muncul di sini.
            </p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Nomor tiket</th>
                  <th className="px-5 py-3 font-medium">Pemilik</th>
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Gate</th>
                  <th className="px-5 py-3 font-medium">Waktu check-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {history.map((item) => (
                  <tr key={item.checkin_id} className="text-zinc-300">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-white">
                      {item.ticket_number || "-"}
                    </td>
                    <td className="px-5 py-4">
                      {item.owner_name || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="block font-medium text-zinc-200">
                        {item.event_name || "-"}
                      </span>
                      <span className="mt-1 block font-mono text-[10px] text-zinc-500">
                        Event #{item.event_id}
                      </span>
                    </td>
                    <td className="px-5 py-4">{item.gate || "-"}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-400">
                      {formatCheckinTime(item.checked_in_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && pagination.pages > 0 && (
          <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-zinc-500">
              Halaman {page} dari {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() =>
                  goToPage(Math.min(pagination.pages, page + 1))
                }
                disabled={page >= pagination.pages}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
