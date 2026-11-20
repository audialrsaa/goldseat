"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  ScanLine,
  X,
} from "lucide-react";

import { useAuth } from "../../lib/auth-context";

const MENU_ITEMS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/checkin-staff/dashboard",
  },
  {
    label: "Ticket Scanner",
    icon: ScanLine,
    href: "/checkin-staff/scanner",
  },
  {
    label: "Check-in History",
    icon: ClipboardList,
    href: "/checkin-staff/history",
  },
];

export default function CheckinStaffSidebar({
  isOpen = false,
  onClose,
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const displayName =
    user?.full_name || user?.email || "Check-in Staff";

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        aria-label="Navigasi Check-in Staff"
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#0c0c11] p-4 transition-transform md:sticky md:top-0 md:z-10 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2.5 px-2 pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-400 to-amber-400 font-display text-[13px] font-bold text-zinc-950">
              SM
            </div>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-semibold text-white">
                SMEncore
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Check-in
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-3">
          <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-500">
            Masuk sebagai
            <span className="h-[7px] w-[7px] rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-white">
            {displayName}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[13.5px] transition-colors ${
                  active
                    ? "border-violet-400/35 bg-gradient-to-r from-violet-400/15 to-transparent text-white"
                    : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}