"use client";

import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu } from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../lib/auth-context";

const PAGE_TITLES = {
  "/superadmin/dashboard": "Dashboard",
  "/superadmin/users": "Staff & Users",
  "/superadmin/orders": "Orders",
  "/superadmin/payments": "Payments",
  "/superadmin/refunds": "Refunds",
  "/superadmin/banners": "Banners",
  "/superadmin/vouchers": "Vouchers",
  "/superadmin/ticket-categories": "Ticket Categories",
  "/superadmin/ticket-transfers": "Ticket Transfers",
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  const lastSegment = pathname.split("/").filter(Boolean).pop();
  return lastSegment
    ? lastSegment.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Superadmin";
}

export default function SuperadminHeader({ onMenuClick }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const displayName = user?.full_name || user?.email || "Super Admin";
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
            {getPageTitle(pathname)}
          </h1>
          <p className="hidden text-xs text-zinc-500 sm:block">
            Super Admin
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Bell size={18} aria-label="Notifikasi" className="text-zinc-400" />
        <div className="hidden max-w-48 truncate text-sm text-zinc-300 sm:block">
          {displayName}
        </div>
        <div
          aria-label={`Profil ${displayName}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 text-xs font-bold text-white"
        >
          {initials || "SA"}
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
