"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";

import {
  fetchCheckinDashboard,
  fetchOngoingEvents,
} from "../../../lib/checkin-api";
import { saveSelectedCheckinEvent } from "../../../lib/checkin-session";

function formatEventDate(value) {
  if (!value) return "Tanggal belum tersedia";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatEventTime(value) {
  return value ? value.slice(0, 5) : "--:--";
}

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

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex items-center justify-between text-zinc-500">
        <span className="font-mono text-[10px] uppercase tracking-widest">
          {label}
        </span>
        <Icon size={17} />
      </div>
      <div className="mt-3 font-display text-3xl font-bold text-zinc-50">
        {value}
      </div>
    </div>
  );
}

export default function CheckinDashboardPage() {
  const [events, setEvents] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [dashboardError, setDashboardError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    fetchOngoingEvents()
      .then((result) => {
        if (active) setEvents(result);
      })
      .catch((error) => {
        if (active) setEventsError(error.message);
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });

    fetchCheckinDashboard()
      .then((result) => {
        if (active) setDashboard(result);
      })
      .catch((error) => {
        if (active) setDashboardError(error.message);
      })
      .finally(() => {
        if (active) setDashboardLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  function chooseEvent(event) {
    saveSelectedCheckinEvent(event);
  }

  function refreshDashboard() {
    setEventsLoading(true);
    setDashboardLoading(true);
    setEventsError("");
    setDashboardError("");
    setRefreshKey((key) => key + 1);
  }

  const stats = dashboardLoading
    ? "..."
    : dashboardError
      ? "—"
      : null;

  return (
    <main className="px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-300">
            Operasional acara
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-[28px]">
            Dashboard Check-in
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Pilih event yang sedang berlangsung untuk mulai memeriksa tiket.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshDashboard}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900"
        >
          <RefreshCw size={15} />
          Muat ulang
        </button>
      </div>

      {dashboardError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300"
        >
          Gagal memuat statistik check-in: {dashboardError}
        </div>
      )}

      <section
        aria-label="Statistik check-in"
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <StatCard
          label="Check-in hari ini"
          value={
            stats ??
            (dashboard?.checkins_today ?? 0).toLocaleString("id-ID")
          }
          icon={TicketCheck}
        />
        <StatCard
          label="Check-in event berlangsung"
          value={
            stats ??
            (dashboard?.checkins_ongoing_events ?? 0).toLocaleString("id-ID")
          }
          icon={ShieldCheck}
        />
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Event sedang berlangsung
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Daftar ini dimuat langsung dari server.
            </p>
          </div>
          {!eventsLoading && !eventsError && (
            <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 font-mono text-xs text-zinc-400">
              {events.length} event
            </span>
          )}
        </div>

        {eventsError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300"
          >
            Gagal memuat event: {eventsError}
          </div>
        )}

        {eventsLoading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-400">
            Memuat daftar event...
          </div>
        )}

        {!eventsLoading && !eventsError && events.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-6 py-10 text-center">
            <CalendarDays className="mx-auto text-zinc-600" size={28} />
            <p className="mt-3 font-medium text-zinc-200">
              Tidak ada event yang sedang berlangsung
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Event akan muncul di sini saat waktu mulai tercapai dan belum
              melewati waktu selesai.
            </p>
          </div>
        )}

        {!eventsLoading && !eventsError && events.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/70 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Sedang berlangsung
                    </span>
                    <h4 className="mt-3 font-display text-lg font-semibold text-white">
                      {event.title}
                    </h4>
                  </div>
                  <span className="font-mono text-xs text-zinc-500">
                    #{event.id}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <CalendarDays size={15} className="text-violet-300" />
                    {formatEventDate(event.event_date)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 size={15} className="text-violet-300" />
                    {formatEventTime(event.start_time)}–{formatEventTime(event.end_time)}
                  </p>
                  {event.venue_id != null && (
                    <p className="flex items-center gap-2 sm:col-span-2">
                      <MapPin size={15} className="text-violet-300" />
                      Venue #{event.venue_id}
                    </p>
                  )}
                </div>

                <Link
                  href="/checkin-staff/scanner"
                  onClick={() => chooseEvent(event)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-violet-300"
                >
                  Pilih event
                  <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Aktivitas check-in terbaru
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Aktivitas yang dilakukan oleh akun Anda.
            </p>
          </div>
          <Link
            href="/checkin-staff/history"
            className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
          >
            Lihat riwayat
          </Link>
        </div>

        {dashboardLoading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm text-zinc-400">
            Memuat aktivitas...
          </div>
        )}

        {!dashboardLoading && !dashboardError && (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
            {dashboard?.recent_checkins?.length ? (
              <ul className="divide-y divide-zinc-800">
                {dashboard.recent_checkins.map((activity) => (
                  <li
                    key={activity.checkin_id}
                    className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        Tiket {activity.ticket_number || "-"}
                        {activity.owner_name
                          ? ` · ${activity.owner_name}`
                          : ""}
                      </p>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {activity.event_name || "Event"}
                        {activity.gate ? ` · ${activity.gate}` : ""}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-zinc-500">
                      {formatCheckinTime(activity.checked_in_at)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">
                Belum ada aktivitas check-in.
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
