
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import { getToken } from "@/lib/api";
import {
  Search,
  ShoppingCart,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  UserRound,
  Ticket,
  CreditCard,
  Receipt,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  Filter,
  ArrowUpRight,
} from "lucide-react";

// ============================================================
// KONFIGURASI API
// ============================================================

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api"
).replace(/\/+$/, "");

const ORDERS_ENDPOINT = /\/api$/i.test(API_BASE)
  ? `${API_BASE}/orders`
  : `${API_BASE}/api/orders`;

const ORDER_STATUSES = [
  "pending",
  "paid",
  "expired",
  "cancelled",
  "refunded",
  "partially_refunded",
];

const PAGE_SIZE = 8;

// ============================================================
// API REQUEST
// ============================================================

async function apiRequest(url, options = {}) {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.msg ||
        result.message ||
        `Request gagal (${response.status}). Periksa autentikasi dan endpoint API.`
    );
  }

  return result;
}

// ============================================================
// HELPER
// ============================================================

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function humanize(value) {
  if (!value) return "-";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getOrderStatus(order) {
  return String(order?.status || "pending").toLowerCase();
}

function getPaymentStatus(order) {
  const status =
    order?.payment_status ||
    order?.payment?.status ||
    order?.payment?.payment_status;

  if (status) return String(status).toLowerCase();

  const orderStatus = getOrderStatus(order);

  if (
    [
      "paid",
      "expired",
      "cancelled",
      "refunded",
      "partially_refunded",
    ].includes(orderStatus)
  ) {
    return orderStatus;
  }

  return "pending";
}

function getCustomer(order) {
  return (
    order?.customer?.name ||
    order?.customer_name ||
    order?.user?.name ||
    order?.user?.full_name ||
    order?.user?.email ||
    (order?.user_id ? `User #${order.user_id}` : "-")
  );
}

function getEventName(order) {
  const items = Array.isArray(order?.items) ? order.items : [];

  const names = [
    order?.event?.name,
    order?.event?.title,
    order?.event_name,
    order?.event_title,
    ...items.map(
      (item) =>
        item?.event_name ||
        item?.event?.name ||
        item?.ticket_category?.event?.name ||
        item?.ticket_category?.event?.title
    ),
  ].filter(Boolean);

  return [...new Set(names)].join(", ") || "-";
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.order_items)) return order.order_items;
  return [];
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  const styles = {
    pending: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    paid: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    expired: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
    cancelled: "border-rose-500/20 bg-rose-500/10 text-rose-400",
    refunded: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    partially_refunded:
      "border-violet-500/20 bg-violet-500/10 text-violet-400",
    failed: "border-rose-500/20 bg-rose-500/10 text-rose-400",
    unpaid: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  };

  const icons = {
    pending: Clock3,
    paid: CheckCircle2,
    expired: AlertCircle,
    cancelled: XCircle,
    refunded: RefreshCw,
    partially_refunded: RefreshCw,
    failed: XCircle,
    unpaid: Clock3,
    success: CheckCircle2,
  };

  const Icon = icons[normalized] || AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        styles[normalized] ||
        "border-zinc-700 bg-zinc-800 text-zinc-300"
      }`}
    >
      <Icon size={12} />
      {humanize(normalized)}
    </span>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#111218] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
        >
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 py-3 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="max-w-[65%] break-words text-right text-sm font-medium text-zinc-200">
        {value ?? "-"}
      </span>
    </div>
  );
}

// ============================================================
// ORDER DETAIL MODAL
// ============================================================

function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  const items = getOrderItems(order);
  const payment = order.payment || {};

  const subtotal =
    Number(order.subtotal) ||
    items.reduce(
      (sum, item) =>
        sum +
        (Number(item.price ?? item.unit_price) || 0) *
          (Number(item.qty ?? item.quantity) || 0),
      0
    );

  const discount = Number(order.discount_amount) || 0;
  const total = Number(order.total ?? order.total_amount) || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#101116] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs text-zinc-500">Order detail</p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              #{order.order_number || order.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-500">Order status</p>
              <div className="mt-2">
                <StatusBadge status={getOrderStatus(order)} />
              </div>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Payment status</p>
              <div className="mt-2">
                <StatusBadge status={getPaymentStatus(order)} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-zinc-800 bg-[#15161d] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <UserRound size={16} className="text-amber-400" />
                Customer & Event
              </div>

              <DetailRow label="Customer" value={getCustomer(order)} />
              <DetailRow label="Customer ID" value={order.user_id ?? "-"} />
              <DetailRow label="Event" value={getEventName(order)} />
              <DetailRow
                label="Channel"
                value={humanize(order.channel || "-")}
              />
            </section>

            <section className="rounded-xl border border-zinc-800 bg-[#15161d] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <CreditCard size={16} className="text-amber-400" />
                Payment
              </div>

              <DetailRow
                label="Payment method"
                value={
                  payment.payment_method ||
                  payment.method ||
                  order.payment_method ||
                  "-"
                }
              />
              <DetailRow
                label="Payment status"
                value={humanize(getPaymentStatus(order))}
              />
              <DetailRow
                label="Payment reference"
                value={
                  payment.reference ||
                  payment.transaction_id ||
                  payment.order_id ||
                  "-"
                }
              />
              <DetailRow
                label="Paid at"
                value={formatDate(payment.paid_at || order.paid_at)}
              />
            </section>
          </div>

          <section className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
              <Ticket size={16} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Ticket details
              </h3>
            </div>

            {items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-sm">
                  <thead className="bg-[#15161d] text-xs text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ticket</th>
                      <th className="px-4 py-3 text-center font-medium">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => {
                      const price =
                        Number(item.price ?? item.unit_price) || 0;
                      const qty =
                        Number(item.qty ?? item.quantity) || 0;

                      return (
                        <tr
                          key={item.id ?? index}
                          className="border-t border-zinc-800"
                        >
                          <td className="px-4 py-3 text-zinc-200">
                            {item.ticket_category?.name ||
                              item.ticket_name ||
                              item.category_name ||
                              item.name ||
                              `Ticket Category #${item.ticket_category_id ?? "-"}`}
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-300">
                            {qty}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-300">
                            {formatCurrency(price)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-white">
                            {formatCurrency(price * qty)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                Belum ada item tiket pada order ini.
              </div>
            )}

            <div className="border-t border-zinc-800 bg-[#15161d] px-4 py-3 sm:px-5">
              <DetailRow
                label="Subtotal"
                value={formatCurrency(subtotal)}
              />
              <DetailRow
                label="Discount"
                value={`-${formatCurrency(discount)}`}
              />

              <div className="flex items-center justify-between gap-4 pt-4">
                <span className="text-sm font-semibold text-zinc-300">
                  Total
                </span>
                <span className="text-xl font-bold text-amber-400">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-zinc-800 bg-[#15161d] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <CalendarDays size={16} className="text-amber-400" />
              Timeline
            </div>

            <DetailRow
              label="Created at"
              value={formatDate(order.created_at)}
            />
            <DetailRow
              label="Expired at"
              value={formatDate(order.expired_at)}
            />
            <DetailRow
              label="Paid at"
              value={formatDate(payment.paid_at || order.paid_at)}
            />

            {order.notes && (
              <DetailRow label="Notes" value={order.notes} />
            )}
          </section>
        </div>

        <div className="flex justify-end border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HALAMAN ORDERS
// ============================================================

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Ambil data order
  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const result = await apiRequest(ORDERS_ENDPOINT);

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.orders)
            ? result.orders
            : [];

      setOrders(data);
    } catch (err) {
      setError(err.message || "Gagal mengambil data order.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Statistik order
  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(
        (order) => getOrderStatus(order) === "pending"
      ).length,
      paid: orders.filter(
        (order) => getOrderStatus(order) === "paid"
      ).length,
      cancelled: orders.filter((order) =>
        [
          "cancelled",
          "expired",
          "refunded",
          "partially_refunded",
        ].includes(getOrderStatus(order))
      ).length,
    };
  }, [orders]);

  // Pencarian dan filter
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();

    return orders.filter((order) => {
      const status = getOrderStatus(order);

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (dateFilter !== "all") {
        const created = order.created_at
          ? new Date(order.created_at)
          : null;

        if (!created || Number.isNaN(created.getTime())) {
          return false;
        }

        if (dateFilter === "today") {
          if (created.toDateString() !== now.toDateString()) {
            return false;
          }
        } else if (dateFilter === "7days") {
          const start = new Date(now);
          start.setDate(now.getDate() - 7);

          if (created < start || created > now) return false;
        } else if (dateFilter === "30days") {
          const start = new Date(now);
          start.setDate(now.getDate() - 30);

          if (created < start || created > now) return false;
        }
      }

      const searchable = [
        order.id,
        order.order_number,
        getCustomer(order),
        getEventName(order),
        order.user_id,
        order.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !query || searchable.includes(query);
    });
  }, [orders, search, statusFilter, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFilter]);

  // Ambil detail order
  async function openOrder(order) {
    setSelectedOrder(order);

    if (!order.id) return;

    try {
      const result = await apiRequest(
        `${ORDERS_ENDPOINT}/${order.id}`
      );

      const detail = result.data || result.order || result;

      if (detail && typeof detail === "object") {
        setSelectedOrder((current) =>
          current?.id === order.id
            ? { ...current, ...detail }
            : current
        );
      }
    } catch {
      // Modal tetap menampilkan data yang sudah ada.
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0b0c10] text-zinc-100">
      <SuperAdminSidebar />

      <main className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-zinc-800 bg-[#0b0c10]/95 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h1 className="text-lg font-semibold text-white">
              Orders Monitoring
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Super Admin / Transactions / Orders
            </p>
          </div>

          <div className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-[#121319] px-3 py-2.5 md:max-w-sm">
            <Search
              size={17}
              className="shrink-0 text-zinc-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari order, customer, event..."
              className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Hapus pencarian"
              >
                <X
                  size={15}
                  className="text-zinc-500 hover:text-white"
                />
              </button>
            )}
          </div>
        </header>

        <div className="space-y-6 p-5 md:p-8">
          {/* Heading */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                <ShoppingCart
                  size={20}
                  className="text-amber-400"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Monitoring Orders
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Pantau seluruh transaksi dan status pesanan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchOrders(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Memuat..." : "Refresh Data"}
            </button>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Receipt}
              label="Total Orders"
              value={stats.total}
              color="bg-amber-500/10 text-amber-400"
            />
            <StatCard
              icon={Clock3}
              label="Pending"
              value={stats.pending}
              color="bg-orange-500/10 text-orange-400"
            />
            <StatCard
              icon={CheckCircle2}
              label="Paid"
              value={stats.paid}
              color="bg-emerald-500/10 text-emerald-400"
            />
            <StatCard
              icon={XCircle}
              label="Cancelled / Expired / Refunded"
              value={stats.cancelled}
              color="bg-rose-500/10 text-rose-400"
            />
          </div>

          {/* Filter */}
          <section className="rounded-xl border border-zinc-800 bg-[#111218] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Filter size={15} className="text-amber-400" />
              Filter Orders
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-1 flex-wrap gap-2">
                {[
                  { label: "Semua", value: "all" },
                  { label: "Pending", value: "pending" },
                  { label: "Paid", value: "paid" },
                  { label: "Expired", value: "expired" },
                  { label: "Cancelled", value: "cancelled" },
                  { label: "Refunded", value: "refunded" },
                  {
                    label: "Partially Refunded",
                    value: "partially_refunded",
                  },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setStatusFilter(item.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      statusFilter === item.value
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                        : "border-zinc-800 bg-[#15161d] text-zinc-400 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <select
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
                className="rounded-lg border border-zinc-800 bg-[#15161d] px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-amber-500/50"
              >
                <option value="all">Semua tanggal</option>
                <option value="today">Hari ini</option>
                <option value="7days">7 hari terakhir</option>
                <option value="30days">30 hari terakhir</option>
              </select>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 text-rose-400"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-rose-300">
                    Gagal memuat data order
                  </p>
                  <p className="mt-1 break-words text-sm text-zinc-400">
                    {error}
                  </p>
                  <p className="mt-2 break-all text-xs text-zinc-600">
                    Endpoint: {ORDERS_ENDPOINT}
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchOrders()}
                    className="mt-3 rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/10"
                  >
                    Coba lagi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabel orders */}
          <section className="overflow-hidden rounded-xl border border-zinc-800 bg-[#111218]">
            <div className="flex flex-col gap-2 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-white">
                  Daftar Order
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Informasi transaksi dari backend.
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {filteredOrders.length} order ditemukan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-zinc-800 bg-[#15161d]">
                  <tr className="text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-5 py-4 font-semibold">
                      Order ID
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Customer
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Event
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Total
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Payment Status
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Order Status
                    </th>
                    <th className="px-5 py-4 font-semibold">
                      Created At
                    </th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800/80">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        {Array.from({ length: 8 }).map(
                          (__, cell) => (
                            <td
                              key={cell}
                              className="px-5 py-5"
                            >
                              <div className="h-4 animate-pulse rounded bg-zinc-800/80" />
                            </td>
                          )
                        )}
                      </tr>
                    ))
                  ) : visibleOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/70">
                          <Package
                            size={22}
                            className="text-zinc-500"
                          />
                        </div>
                        <p className="mt-3 text-sm font-medium text-zinc-300">
                          Tidak ada order ditemukan
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Coba ubah kata pencarian atau filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    visibleOrders.map((order) => {
                      const customer = getCustomer(order);
                      const items = getOrderItems(order);

                      return (
                        <tr
                          key={order.id}
                          className="transition hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-mono text-xs font-semibold text-amber-400">
                              #{order.order_number || order.id}
                            </div>
                            <div className="mt-1 text-[10px] text-zinc-600">
                              ID: {order.id}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300">
                                {String(customer).charAt(0).toUpperCase()}
                              </div>
                              <div className="max-w-[160px]">
                                <p className="truncate text-sm font-medium text-zinc-200">
                                  {customer}
                                </p>
                                {order.customer?.email && (
                                  <p className="mt-1 truncate text-[11px] text-zinc-500">
                                    {order.customer.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="max-w-[180px] truncate text-sm text-zinc-300">
                              {getEventName(order)}
                            </div>
                            {items.length > 0 && (
                              <p className="mt-1 text-[11px] text-zinc-500">
                                {items.length} jenis tiket
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="whitespace-nowrap text-sm font-semibold text-white">
                              {formatCurrency(
                                order.total ?? order.total_amount
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={getPaymentStatus(order)}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={getOrderStatus(order)}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="whitespace-nowrap text-xs text-zinc-300">
                              {formatDate(order.created_at)}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => openOrder(order)}
                              title="Lihat detail order"
                              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400"
                            >
                              <Eye size={14} />
                              Detail
                              <ArrowUpRight size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filteredOrders.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">
                  Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(
                    currentPage * PAGE_SIZE,
                    filteredOrders.length
                  )}{" "}
                  dari {filteredOrders.length} order
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={15} />
                    Sebelumnya
                  </button>

                  <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-400">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages, current + 1)
                      )
                    }
                    className="flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Berikutnya
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </section>

          <p className="text-center text-[11px] text-zinc-600">
            SMEncore Admin Console · Order monitoring
          </p>
        </div>
      </main>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
