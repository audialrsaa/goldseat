"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Search,
  Bell,
  LogOut,
} from "lucide-react";

import {
  fetchDashboardStats,
  formatNumber,
  formatRupiahShort,
  formatTimeAgo,
} from "@/lib/dashboard-api";

import { useAuth } from "@/lib/auth-context";

import SuperAdminSidebar from "../components/SuperAdminSidebar";


const activityDotColor = {
  order: "bg-emerald-400",
  event: "bg-amber-400",
  refund: "bg-rose-400",
  voucher: "bg-violet-400",
  staff: "bg-sky-400",
};

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="h-2.5 w-20 rounded bg-zinc-800 animate-pulse" />
      <div className="mt-3 h-7 w-24 rounded bg-zinc-800 animate-pulse" />
      <div className="mt-2 h-3 w-16 rounded bg-zinc-800 animate-pulse" />
    </div>
  );
}

function StatCard({
  label,
  value,
  deltaValue,
  deltaLabel,
  deltaSuffix,
  invertColor,
  forceUp,
}) {
  const isUp = forceUp || deltaValue >= 0;
  const positiveIsGood = !invertColor;
  const isGood = isUp ? positiveIsGood : !positiveIsGood;

  const arrow = isUp ? "▲" : "▼";

  const text = deltaLabel
    ? `▲ ${deltaLabel}`
    : `${arrow} ${Math.abs(deltaValue)}${deltaSuffix ?? ""}`;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="font-mono text-[10.5px] uppercase tracking-widest text-zinc-500">
        {label}
      </div>

      <div className="font-display mt-2.5 text-[27px] font-bold text-zinc-50">
        {value}
      </div>

      <div
        className={`flex items-center gap-1 text-[12.5px] ${
          isGood ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "super_admin")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("smencore_token") ?? ""
        : "";

    fetchDashboardStats(token)
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const grafik = stats?.grafik_penjualan ?? [];

  const maxTotal = Math.max(
    1,
    ...grafik.map((g) => g.total)
  );

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0e]">
        <div className="text-sm text-zinc-500">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0e] text-zinc-100 font-sans">

      {/* ============ SIDEBAR ============ */}
      <SuperAdminSidebar />

      {/* ============ MAIN ============ */}
      <div className="flex min-w-0 flex-1 flex-col">

        <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-6 py-4 md:px-8">

          <div>
            <div className="font-display text-[17px] font-semibold">
              Dashboard
            </div>

            <div className="font-mono text-[11px] tracking-wide text-zinc-500">
              Super Admin / Dashboard
            </div>
          </div>

          <div className="hidden lg:flex w-80 items-center gap-2 rounded-[10px] border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5 text-[13px] text-zinc-500">
            <Search size={15} />
            Cari event, order, atau user...
          </div>

          <div className="flex items-center gap-3.5">

            <select
              className="rounded-[9px] border border-zinc-800 bg-zinc-950/60 px-3 py-2 font-mono text-[13px] text-zinc-100"
              defaultValue="Super Admin"
            >
              <option>Super Admin</option>
            </select>

            <Bell
              size={18}
              className="text-zinc-400"
            />

            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-[9px] border border-zinc-800 bg-zinc-950/60 px-3 py-2 font-mono text-[13px] text-zinc-400 transition hover:border-rose-800 hover:text-rose-400"
              title="Logout"
            >
              <LogOut size={14} />
            </button>

            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-gradient-to-br from-violet-400 to-violet-600 text-[13px] font-bold">
              A
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 pb-10 pt-7 md:px-8">

          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">

            <div>
              <h1 className="font-display text-[26px] font-bold">
                Dashboard
              </h1>

              <p className="mt-1.5 text-[13.5px] text-zinc-500">
                Ringkasan performa seluruh event di SMEncore
              </p>
            </div>

            <div className="flex gap-2.5">

              <button className="rounded-[9px] border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-[13px] text-zinc-300">
                30 Hari Terakhir
              </button>

              <button className="rounded-[9px] bg-gradient-to-br from-amber-400 to-amber-600 px-4 py-2 text-[13px] font-semibold text-zinc-950">
                Export Ringkasan
              </button>

            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-[13px] text-rose-300">
              gagal memuat data dashboard: {error}. pastikan endpoint
              GET /api/admin/dashboard sudah aktif dan token super admin valid.
            </div>
          )}

          {/* STAT CARDS */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {loading || !stats ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  label="Total Revenue"
                  value={formatRupiahShort(
                    stats.total_revenue.value
                  )}
                  deltaValue={
                    stats.total_revenue.growth_percent
                  }
                  deltaSuffix="% dari bulan lalu"
                />

                <StatCard
                  label="Event Aktif"
                  value={formatNumber(
                    stats.event_aktif.value
                  )}
                  deltaLabel={`${stats.event_aktif.new_this_period} event baru`}
                  deltaValue={
                    stats.event_aktif.new_this_period
                  }
                  forceUp
                />

                <StatCard
                  label="Tiket Terjual"
                  value={formatNumber(
                    stats.tiket_terjual.value
                  )}
                  deltaValue={
                    stats.tiket_terjual.growth_percent
                  }
                  deltaSuffix="%"
                />

                <StatCard
                  label="Refund Diproses"
                  value={formatRupiahShort(
                    stats.refund_diproses.value
                  )}
                  deltaValue={
                    stats.refund_diproses.growth_percent
                  }
                  deltaSuffix="%"
                  invertColor
                />
              </>
            )}

          </div>

          {/* BOTTOM ROW */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">

            {/* GRAFIK */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">

              <div className="mb-5 flex items-center justify-between">

                <span className="font-display text-[15.5px] font-semibold">
                  Grafik Penjualan
                </span>

                <span className="font-mono text-[11px] text-zinc-500">
                  7 hari terakhir
                </span>

              </div>

              {grafik.length === 0 ? (

                <div className="py-8 text-center text-[13px] text-zinc-500">
                  {loading
                    ? "memuat grafik..."
                    : "belum ada data penjualan"}
                </div>

              ) : (

                <div className="flex h-48 items-end justify-between gap-3">

                  {grafik.map((point) => {

                    const isPeak =
                      point.total === maxTotal &&
                      maxTotal > 0;

                    const heightPct = Math.max(
                      6,
                      (point.total / maxTotal) * 100
                    );

                    return (
                      <div
                        key={point.date}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2.5"
                      >

                        <div
                          className={`w-full max-w-[42px] rounded-t-lg rounded-b-[3px] transition-all duration-500 ${
                            isPeak
                              ? "bg-gradient-to-b from-amber-400 to-amber-600"
                              : "bg-gradient-to-b from-violet-400 to-violet-700"
                          }`}
                          style={{
                            height: `${heightPct}%`,
                          }}
                          title={formatRupiahShort(
                            point.total
                          )}
                        />

                        <span className="font-mono text-[11px] text-zinc-500">
                          {point.label}
                        </span>

                      </div>
                    );
                  })}

                </div>
              )}

            </div>

            {/* AKTIVITAS */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">

              <div className="mb-5">

                <span className="font-display text-[15.5px] font-semibold">
                  Aktivitas Terbaru
                </span>

              </div>

              <div className="flex flex-col">

                {loading ? (

                  <div className="py-8 text-center text-[13px] text-zinc-500">
                    memuat aktivitas...
                  </div>

                ) : stats &&
                  stats.aktivitas_terbaru.length > 0 ? (

                  stats.aktivitas_terbaru.map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 border-b border-zinc-900 py-2.5 text-[13px] last:border-none"
                      >

                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            activityDotColor[item.type] ??
                            "bg-emerald-400"
                          }`}
                        />

                        <span className="flex-1 text-zinc-300">
                          {item.message}
                        </span>

                        <span className="shrink-0 font-mono text-[11px] text-zinc-500">
                          {formatTimeAgo(
                            item.timestamp
                          )}
                        </span>

                      </div>
                    )
                  )

                ) : (

                  <div className="py-8 text-center text-[13px] text-zinc-500">
                    belum ada aktivitas
                  </div>

                )}

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}