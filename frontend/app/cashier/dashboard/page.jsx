"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Transactions", icon: CreditCard },
  { label: "Receipts", icon: Receipt },
  { label: "Settings", icon: Settings },
];

export default function CashierDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "cashier")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0e]">
        <div className="text-sm text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0e] text-zinc-100 font-sans">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#0c0c11] p-4">
        <div className="flex items-center gap-2.5 px-2 pb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-emerald-400 to-teal-500 font-display text-[13px] font-bold text-zinc-950">
            CS
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold">SMEncore</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Cashier
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-3">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            Masuk sebagai
            <span className="h-[7px] w-[7px] rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
          </div>
          <div className="mt-1 text-sm font-semibold">{user.full_name || user.email}</div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors ${
                  item.active
                    ? "border border-emerald-400/35 bg-gradient-to-r from-emerald-400/15 to-transparent text-white"
                    : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13.5px] text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-rose-400 mt-auto"
        >
          <LogOut size={16} strokeWidth={2} />
          Logout
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 md:px-8">
          <div>
            <div className="font-display text-[17px] font-semibold">Dashboard</div>
            <div className="font-mono text-[11px] tracking-wide text-zinc-500">
              Cashier / Dashboard
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 pb-10 pt-7 md:px-8">
          <h1 className="font-display text-[26px] font-bold">Cashier Dashboard</h1>
          <p className="mt-1.5 text-[13.5px] text-zinc-500">
            Kelola penjualan tiket dan transaksi offline.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Today's Sales", value: "—" },
              { label: "Total Transactions", value: "—" },
              { label: "Pending Payments", value: "—" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                <div className="font-mono text-[10.5px] uppercase tracking-widest text-zinc-500">
                  {stat.label}
                </div>
                <div className="font-display mt-2.5 text-[27px] font-bold text-zinc-50">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
