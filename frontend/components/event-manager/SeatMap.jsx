"use client";

import { useMemo } from "react";
import { Armchair } from "lucide-react";

const SEATS_PER_VISUAL_ROW = 10;

const SEAT_STATUS_META = {
  available: {
    label: "Tersedia",
    light: "border-emerald-300 bg-emerald-50 text-emerald-800",
    dark: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-500",
  },
  locked: {
    label: "Terkunci",
    light: "border-amber-300 bg-amber-50 text-amber-800",
    dark: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-500",
  },
  booked: {
    label: "Terjual",
    light: "border-rose-300 bg-rose-50 text-rose-800",
    dark: "border-rose-500/50 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-500",
  },
};

const UNKNOWN_STATUS_META = {
  label: "Status tidak dikenal",
  light: "border-slate-300 bg-slate-100 text-slate-600",
  dark: "border-zinc-700 bg-zinc-800 text-zinc-300",
  dot: "bg-slate-400",
};

export default function SeatMap({
  areaName,
  seats = [],
  loading = false,
  theme = "light",
  subtitle,
  headerAction,
  emptyMessage,
  emptyHint,
  footer,
}) {
  const isDark = theme === "dark";
  const rows = useMemo(() => {
    const sorted = [...seats].sort((a, b) =>
      String(a.seat_code || "").localeCompare(
        String(b.seat_code || ""),
        undefined,
        { numeric: true }
      )
    );

    const grouped = [];
    for (let index = 0; index < sorted.length; index += SEATS_PER_VISUAL_ROW) {
      grouped.push(sorted.slice(index, index + SEATS_PER_VISUAL_ROW));
    }

    return grouped;
  }, [seats]);

  const hasUnknownStatus = seats.some(
    (seat) => !SEAT_STATUS_META[seat.status]
  );
  const mutedText = isDark ? "text-zinc-400" : "text-slate-500";
  const borderColor = isDark ? "border-zinc-800" : "border-slate-200";
  const panelColor = isDark ? "bg-[#12151c]" : "bg-white";
  const titleColor = isDark ? "text-white" : "text-slate-900";

  return (
    <section
      className={`rounded-2xl border ${borderColor} ${panelColor} p-4 shadow-sm sm:p-6`}
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
              isDark ? "text-amber-400" : "text-indigo-600"
            }`}
          >
            Area Kursi
          </p>
          <h2 className={`mt-1 text-lg font-bold ${titleColor}`}>
            {areaName || "Pilih kategori tiket"}
          </h2>
          {subtitle && <p className={`mt-1 text-sm ${mutedText}`}>{subtitle}</p>}
        </div>
        {headerAction}
      </header>

      <p className={`mt-4 text-xs leading-relaxed ${mutedText}`}>
        Baris di bawah hanya pengelompokan visual berdasarkan kode kursi. Data
        posisi baris, blok, dan koordinat venue belum tersedia.
      </p>

      <div
        className={`mx-auto mt-6 max-w-3xl rounded-t-[50%] border-t-4 px-4 py-4 text-center sm:mt-8 ${
          isDark
            ? "border-amber-400 bg-gradient-to-b from-amber-400/10 to-transparent"
            : "border-indigo-400 bg-gradient-to-b from-indigo-50 to-transparent"
        }`}
      >
        <p
          className={`text-xs font-bold tracking-[0.25em] ${
            isDark ? "text-amber-300" : "text-indigo-700"
          }`}
        >
          PANGGUNG
        </p>
        <p className={`mt-1 text-[10px] ${mutedText}`}>Orientasi visual saja</p>
      </div>

      <div
        aria-label="Legenda status kursi"
        className={`mt-5 flex flex-wrap gap-x-5 gap-y-3 border-b pb-5 ${
          isDark ? "border-zinc-800" : "border-slate-100"
        }`}
      >
        {Object.entries(SEAT_STATUS_META).map(([status, meta]) => (
          <div
            key={status}
            className={`flex items-center gap-2 text-xs ${mutedText}`}
          >
            <span className={`h-3 w-3 rounded-sm ${meta.dot}`} />
            {meta.label}
            {status === "locked" && (
              <span className={isDark ? "text-zinc-500" : "text-slate-400"}>
                (sementara tidak tersedia)
              </span>
            )}
          </div>
        ))}
        {hasUnknownStatus && (
          <div className={`flex items-center gap-2 text-xs ${mutedText}`}>
            <span className={`h-3 w-3 rounded-sm ${UNKNOWN_STATUS_META.dot}`} />
            {UNKNOWN_STATUS_META.label}
          </div>
        )}
      </div>

      {loading ? (
        <div className={`py-12 text-center text-sm ${mutedText}`}>
          Memuat denah kursi...
        </div>
      ) : !areaName ? (
        <div className={`py-12 text-center text-sm ${mutedText}`}>
          Pilih kategori tiket untuk melihat denah.
        </div>
      ) : seats.length === 0 ? (
        <div className={`py-12 text-center ${mutedText}`}>
          <Armchair
            size={32}
            aria-hidden="true"
            className={`mx-auto ${isDark ? "text-zinc-600" : "text-slate-300"}`}
          />
          <p className={`mt-3 text-sm font-semibold ${titleColor}`}>
            {emptyMessage || "Kategori ini belum memiliki data kursi."}
          </p>
          {emptyHint && <p className="mt-1 text-xs">{emptyHint}</p>}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {rows.map((row, rowIndex) => (
            <section
              key={row[0]?.id || rowIndex}
              aria-label={`Baris tampilan ${rowIndex + 1}`}
              className={`rounded-xl border p-3 sm:p-4 ${
                isDark
                  ? "border-zinc-800 bg-[#0b0e14]/70"
                  : "border-slate-100 bg-slate-50/80"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3
                  className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${mutedText}`}
                >
                  Baris tampilan {String(rowIndex + 1).padStart(2, "0")}
                </h3>
                <span className={`text-[10px] ${mutedText}`}>
                  {row.length} kursi
                </span>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex w-max gap-2">
                  {row.map((seat) => {
                    const meta =
                      SEAT_STATUS_META[seat.status] || UNKNOWN_STATUS_META;
                    const statusClass = isDark ? meta.dark : meta.light;

                    return (
                      <div
                        key={seat.id}
                        title={`${seat.seat_code} - ${meta.label}`}
                        aria-label={`${seat.seat_code}, ${meta.label}`}
                        className={`flex min-h-[62px] w-[64px] shrink-0 flex-col items-center justify-center rounded-lg border px-1 py-2 sm:w-[72px] ${statusClass}`}
                      >
                        <Armchair size={17} aria-hidden="true" />
                        <span className="mt-1 break-all text-center text-[9px] font-bold leading-3">
                          {seat.seat_code || "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {footer && (
        <div
          className={`mt-5 flex flex-wrap justify-between gap-2 border-t pt-4 text-xs ${mutedText} ${
            isDark ? "border-zinc-800" : "border-slate-100"
          }`}
        >
          {footer}
        </div>
      )}
    </section>
  );
}
