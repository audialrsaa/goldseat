
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  MapPin,
  Music2,
  Tag,
  Ticket,
  LogOut,
} from "lucide-react";
import Swal from "sweetalert2";

import { useAuth } from "../../../lib/auth-context";

const MENU_GROUPS = [
  {
    title: "Dashboard",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/event-manager/dashboard",
      },
    ],
  },
  {
    title: "Event Management",
    items: [
      {
        label: "Events",
        icon: CalendarDays,
        href: "/event-manager/events",
      },
      {
        label: "Event Categories",
        icon: Tag,
        href: "/event-manager/kategori-event",
      },
      {
        label: "Artists",
        icon: Music2,
        href: "/event-manager/artist",
      },
      {
        label: "Venues",
        icon: MapPin,
        href: "/event-manager/venues",
      },
    ],
  },
  {
    title: "Ticketing",
    items: [
      {
        label: "Tickets",
        icon: Ticket,
        href: "/event-manager/tickets",
      },
      {
        label: "Vouchers",
        icon: Tag,
        href: "/event-manager/vouchers",
      },
      {
        label: "Seat Management",
        icon: Ticket,
        href: "/event-manager/seats",
      },
    ],
  },
];

function isActivePath(pathname, href) {
  if (href === "/event-manager/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function EventManagerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-zinc-800 bg-[#0c0c11] p-4 md:flex [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-800">

      {/* BRAND */}
      <div className="flex items-center gap-2.5 px-2 pb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-400 to-amber-400 font-display text-[13px] font-bold text-zinc-950">
          SM
        </div>

        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold text-white">
            SMEncore
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Console
          </div>
        </div>
      </div>

      {/* USER INFO */}
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-3">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-500">
          Masuk sebagai
          <span className="h-[7px] w-[7px] rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
        </div>

        <div className="mt-1 truncate text-sm font-semibold text-white">
          {user?.full_name || user?.email || "Event Manager"}
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-1 flex-col gap-5">
        {MENU_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <div className="px-2.5 pb-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {group.title}
            </div>

            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[13.5px] transition-colors ${
                      active
                        ? "border-violet-400/35 bg-gradient-to-r from-violet-400/15 to-transparent text-white"
                        : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={16} strokeWidth={2} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* LOGOUT */}
      <div className="mt-5 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2.5 text-[13.5px] text-zinc-400 transition-colors hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut size={16} strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  );
}
