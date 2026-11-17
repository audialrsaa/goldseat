"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Image as ImageIcon,
  LayoutDashboard,
  Radio,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  CreditCard,
  X,
} from "lucide-react";

const MENU_GROUPS = [
  {
    title: "Dashboard",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/superadmin/dashboard",
      },
    ],
  },
  {
    title: "User Management",
    items: [
      {
        label: "Staff & Users",
        icon: Users,
        badge: 48,
        href: "/superadmin/users",
      },
    ],
  },
  // {
  //   title: "Event Management",
  //   items: [
  //     {
  //       label: "Events",
  //       icon: CalendarDays,
  //       badge: 26,
  //       href: "/superadmin/events",
  //     },
  //     {
  //       label: "Event Categories",
  //       icon: Tag,
  //       badge: 6,
  //       href: "/superadmin/kategori-event",
  //     },
  //     {
  //       label: "Artists",
  //       icon: User,
  //       href: "/superadmin/artist",
  //     },
  //     {
  //       label: "Venues",
  //       icon: Theater,
  //       href: "/superadmin/venues",
  //     },
  //   ],
  // },
  {
    title: "Transactions",
    items: [
      {
        label: "Orders",
        icon: ShoppingCart,
        href: "/superadmin/orders",
      },
      {
        label: "Payments",
        icon: CreditCard,
        href: "/superadmin/payments",
      },
      {
        label: "Refunds",
        icon: RotateCcw,
        badge: 7,
        href: "/superadmin/refunds",
      },
    ],
  },
  // {
  //   title: "Ticketing",
  //   items: [
  //     {
  //       label: "Ticket Categories",
  //       icon: Ticket,
  //       href: "/superadmin/ticket-categories",
  //     },
  //     {
  //       label: "Tickets",
  //       icon: Ticket,
  //       href: "/superadmin/tickets",
  //     },
  //     {
  //       label: "Seats",
  //       icon: Armchair,
  //       href: "/superadmin/seats",
  //     },
  //     {
  //       label: "Vouchers",
  //       icon: Percent,
  //       badge: 14,
  //       href: "/superadmin/vouchers",
  //     },
  //     {
  //       label: "Ticket Transfers",
  //       icon: RefreshCw,
  //       href: "/superadmin/ticket-transfers",
  //     },
  //   ],
  // },
  {
    title: "Content",
    items: [
      {
        label: "Banners",
        icon: ImageIcon,
        badge: 5,
        href: "/superadmin/banners",
      },
    ],
  },
  {
    title: "Sistem & Lainnya",
    items: [
      {
        label: "Pengaturan Sistem",
        icon: Settings,
        href: "/superadmin/settings",
      },
      {
        label: "Audit Log",
        icon: ShieldCheck,
        href: "/superadmin/audit-log",
      },
      {
        label: "Laporan",
        icon: BarChart3,
        href: "/superadmin/reports",
      },
      {
        label: "Broadcast",
        icon: Radio,
        href: "/superadmin/broadcast",
      },
    ],
  },
];

function isActivePath(pathname, href) {
  if (href === "/superadmin/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SuperadminSidebar({ isOpen = false, onClose }) {
  const pathname = usePathname();

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
        aria-label="Navigasi Superadmin"
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
          <div className="mt-1 text-sm font-semibold text-white">
            Super Admin
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
                      {item.badge != null && (
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                          {item.badge}
                        </span>
                      )}
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
