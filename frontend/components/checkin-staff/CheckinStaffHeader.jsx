"use client";

import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../lib/auth-context";

const PAGE_TITLES = {
  "/checkin-staff/dashboard": "Dashboard",
  "/checkin-staff/scanner": "Ticket Scanner",
  "/checkin-staff/history": "Check-in History",
};

export default function CheckinStaffHeader({ onMenuClick }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const displayName =
    user?.full_name || user?.email || "Check-in Staff";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Yakin ingin logout?",
      text: "Kamu harus login kembali untuk mengakses dashboard.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      reverseButtons: true,
      background: "#18181b",
      color: "#f4f4f5",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#3f3f46",
      focusCancel: true,
    });

    if (result.isConfirmed) {
      await logout();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-4 border-b border-zinc-800 bg-[#0a0a0e]/95 px-4 py-3 text-zinc-100 backdrop-blur sm:px-6 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Buka menu navigasi"
          onClick={onMenuClick}
          className="rounded-lg border border-zinc-800 p-2 text-zinc-300 transition hover:bg-zinc-900 md:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold sm:text-lg">
            {PAGE_TITLES[pathname] || "Check-in Staff"}
          </h1>
          <p className="hidden text-xs text-zinc-500 sm:block">
            Check-in Staff
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden max-w-48 truncate text-sm text-zinc-300 sm:block">
          {displayName}
        </div>
        <div
          aria-label={`Profil ${displayName}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-amber-400 text-xs font-bold text-zinc-950"
        >
          {initials || "CS"}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 px-2.5 py-2 text-sm text-zinc-300 transition hover:border-rose-800 hover:text-rose-400 sm:px-3"
          title="Logout"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}