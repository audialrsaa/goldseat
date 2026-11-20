"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  TicketCheck,
} from "lucide-react";
import Swal from "sweetalert2";

import {
  fetchOngoingEvents,
  fetchCheckinDashboard,
  fetchCheckinHistory,
  submitTicketCheckin,
} from "../../../lib/checkin-api";
import {
  clearSelectedCheckinEvent,
  getSelectedCheckinEvent,
} from "../../../lib/checkin-session";

function formatEventDate(value) {
  if (!value) return "-";

  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
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

export default function CheckinScannerPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectionLoaded, setSelectionLoaded] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [refreshError, setRefreshError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.resolve()
      .then(() => {
        const storedEvent = getSelectedCheckinEvent();

        if (!storedEvent) return null;

        return fetchOngoingEvents().then((events) => ({
          storedEvent,
          events,
        }));
      })
      .then((selection) => {
        if (!active || !selection) return;

        const currentEvent = selection.events.find(
          (event) => String(event.id) === String(selection.storedEvent.id)
        );

        if (currentEvent) {
          setSelectedEvent(currentEvent);
        } else {
          clearSelectedCheckinEvent();
          setSelectionError(
            "Event yang dipilih sudah tidak berlangsung. Silakan pilih event lain."
          );
        }
      })
      .catch((error) => {
        if (!active) return;
        setSelectionError(
          `Event tidak dapat diverifikasi: ${error.message}`
        );
      })
      .finally(() => {
        if (active) setSelectionLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedEvent) return undefined;

    let active = true;

    Promise.allSettled([
      fetchCheckinDashboard(),
      fetchCheckinHistory({
        eventId: selectedEvent.id,
        page: 1,
        perPage: 5,
      }),
    ]).then(([dashboardResult, historyResult]) => {
      if (!active) return;

      const errors = [];

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value);
      } else {
        errors.push(dashboardResult.reason.message);
      }

      if (historyResult.status === "fulfilled") {
        setRecentHistory(historyResult.value.data);
      } else {
        errors.push(historyResult.reason.message);
      }

      setRefreshError(errors.join(" "));
    });

    return () => {
      active = false;
    };
  }, [refreshKey, selectedEvent]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || !selectedEvent || !qrCode.trim()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const checkin = await submitTicketCheckin({
        qr_code: qrCode.trim(),
        event_id: selectedEvent.id,
      });

      setQrCode("");
      setResult({
        success: true,
        ticket: checkin.ticket,
      });

      await Swal.fire({
        title: "Check-in berhasil",
        text: `Tiket ${checkin.ticket.ticket_number || ""} berhasil diproses.`,
        icon: "success",
        background: "#18181b",
        color: "#f4f4f5",
        confirmButtonColor: "#a78bfa",
      });

      setRefreshKey((key) => key + 1);
    } catch (error) {
      setResult({
        success: false,
        message: error.message,
      });

      await Swal.fire({
        title: "Check-in gagal",
        text: error.message,
        icon: "error",
        background: "#18181b",
        color: "#f4f4f5",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!selectionLoaded) {
    return (
      <main className="px-4 py-8 text-sm text-zinc-400 sm:px-6 md:px-8">
        Memuat event terpilih...
      </main>
    );
  }

  if (!selectedEvent) {
    return (
      <main className="px-4 pb-10 pt-6 sm:px-6 md:px-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-center sm:p-10">
          <TicketCheck className="mx-auto text-violet-300" size={34} />
          <h2 className="mt-4 font-display text-xl font-semibold text-white">
            Pilih event terlebih dahulu
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {selectionError ||
              "Halaman check-in hanya dapat digunakan setelah memilih event yang sedang berlangsung dari dashboard."}
          </p>
          <Link
            href="/checkin-staff/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-400 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-violet-300"
          >
            <ArrowLeft size={16} />
            Pilih event
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pb-10 pt-6 sm:px-6 md:px-8 md:pt-7">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/checkin-staff/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={15} />
          Ganti event
        </Link>

        <section className="mt-4 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-400/10 to-zinc-950/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/70 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Event dipilih
              </span>
              <h2 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
                {selectedEvent.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {formatEventDate(selectedEvent.event_date)}
                {selectedEvent.start_time && selectedEvent.end_time
                  ? ` · ${selectedEvent.start_time.slice(0, 5)}–${selectedEvent.end_time.slice(0, 5)}`
                  : ""}
              </p>
            </div>
            <span className="rounded-full border border-zinc-700 px-3 py-1 font-mono text-xs text-zinc-400">
              Event #{selectedEvent.id}
            </span>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                <Camera size={19} />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-white">
                  Periksa tiket
                </h3>
                <p className="text-xs text-zinc-500">
                  Pemindaian kamera belum tersedia di project ini.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <label
                htmlFor="qr-code"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Masukkan kode QR tiket
              </label>
              <input
                id="qr-code"
                name="qr_code"
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
                value={qrCode}
                onChange={(event) => setQrCode(event.target.value)}
                disabled={submitting}
                placeholder="Pindai atau ketik kode QR"
                className="w-full rounded-xl border border-zinc-700 bg-[#0a0a0e] px-4 py-3.5 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-400/10 disabled:opacity-60"
              />
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                QR akan diverifikasi terhadap event terpilih oleh backend.
              </p>
              <button
                type="submit"
                disabled={submitting || !qrCode.trim()}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-400 px-4 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TicketCheck size={17} />
                {submitting ? "Memproses..." : "Validasi & check-in"}
              </button>
            </form>

            {result && (
              <div
                role={result.success ? "status" : "alert"}
                className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                  result.success
                    ? "border-emerald-900/70 bg-emerald-950/30 text-emerald-200"
                    : "border-rose-900/70 bg-rose-950/30 text-rose-200"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                )}
                <div className="text-sm">
                  <p className="font-semibold">
                    {result.success ? "Tiket berhasil digunakan" : "Tiket tidak dapat diproses"}
                  </p>
                  <p className="mt-1 text-current/80">
                    {result.success
                      ? `${result.ticket.ticket_number || "Tiket"}${result.ticket.owner_name ? ` · ${result.ticket.owner_name}` : ""}`
                      : result.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Check-in hari ini
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-white">
                  {dashboard?.checkins_today ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Event berjalan
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-white">
                  {dashboard?.checkins_ongoing_events ?? "—"}
                </p>
              </div>
            </div>

            {refreshError && (
              <p role="status" className="text-xs text-amber-300">
                Statistik/riwayat belum dapat diperbarui: {refreshError}
              </p>
            )}

            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3.5">
                <Clock3 size={15} className="text-violet-300" />
                <h3 className="text-sm font-semibold text-white">
                  Check-in terbaru
                </h3>
              </div>
              {recentHistory.length > 0 ? (
                <ul className="divide-y divide-zinc-800">
                  {recentHistory.map((item) => (
                    <li key={item.checkin_id} className="px-4 py-3">
                      <p className="text-sm font-medium text-zinc-200">
                        {item.ticket_number || "-"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.owner_name || "Pemilik tidak tersedia"}
                        {" · "}
                        {formatCheckinTime(item.checked_in_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-6 text-center text-xs text-zinc-500">
                  Belum ada check-in untuk event ini.
                </p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
