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
  X,
  Percent,
} from "lucide-react";

import { useAuth } from "../../lib/auth-context";

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
  {
    title: "Voucher",
    items: [
      {
        label: "Vouchers",
        icon: Percent,
        badge: 14,
        href: "/event-manager/vouchers",
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

export default function EventManagerSidebar({ isOpen = false, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();

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
        aria-label="Navigasi Event Manager"
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-zinc-800 bg-[#0c0c11] p-4 transition-transform md:sticky md:top-0 md:z-10 md:translate-x-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-800 ${
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
                Console
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
            {user?.full_name || user?.email || "Event Manager"}
          </div>
        </div>

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
                      onClick={onClose}
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
      </aside>
    </>
  );
}
