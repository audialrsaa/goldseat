
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Receipt,
  Wallet,
} from "lucide-react";


const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Berhasil" },
  { value: "failed", label: "Gagal" },
  { value: "expired", label: "Kedaluwarsa" },
];

function formatRupiah(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function normalizeStatus(status) {
  const value = String(status ?? "")
    .trim()
    .toLowerCase();

  if (
    [
      "paid",
      "settlement",
      "capture",
      "success",
      "successful",
      "completed",
    ].includes(value)
  ) {
    return "success";
  }

  if (
    [
      "cancel",
      "cancelled",
      "canceled",
      "deny",
      "failure",
      "failed",
      "rejected",
    ].includes(value)
  ) {
    return "failed";
  }

  if (["expire", "expired"].includes(value)) {
    return "expired";
  }

  if (
    [
      "pending",
      "waiting",
      "unpaid",
      "awaiting_payment",
    ].includes(value)
  ) {
    return "pending";
  }

  return value || "pending";
}

function getStatusInfo(status) {
  const normalized = normalizeStatus(status);

  const statuses = {
    success: {
      label: "Berhasil",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      icon: CheckCircle2,
    },
    pending: {
      label: "Pending",
      className:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",
      icon: Clock3,
    },
    failed: {
      label: "Gagal",
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
      icon: XCircle,
    },
    expired: {
      label: "Kedaluwarsa",
      className:
        "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
      icon: AlertCircle,
    },
  };

  return (
    statuses[normalized] || {
      label: normalized,
      className: "border-zinc-700 bg-zinc-800 text-zinc-300",
      icon: AlertCircle,
    }
  );
}

function getPaymentId(payment) {
  return payment?.id ?? payment?.payment_id ?? "-";
}

function getOrderNumber(payment) {
  return (
    payment?.order_number ??
    payment?.order?.order_number ??
    payment?.order_id ??
    "-"
  );
}

function getAmount(payment) {
  return (
    payment?.amount ??
    payment?.order?.total ??
    payment?.total ??
    0
  );
}

function getPaymentMethod(payment) {
  return (
    payment?.payment_method ??
    payment?.method ??
    payment?.provider ??
    "-"
  );
}

function getPaymentDate(payment) {
  return (
    payment?.paid_at ??
    payment?.created_at ??
    payment?.createdAt ??
    payment?.updated_at ??
    null
  );
}

function getCustomerName(payment) {
  return (
    payment?.user?.name ??
    payment?.user?.full_name ??
    payment?.user?.nama ??
    payment?.customer_name ??
    payment?.customer?.name ??
    payment?.order?.user?.name ??
    payment?.order?.user?.full_name ??
    "-"
  );
}

function getPaymentStatus(payment) {
  return normalizeStatus(
    payment?.status ??
      payment?.transaction_status ??
      payment?.payment_status
  );
}

function extractPayments(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload?.data?.payments,
    payload?.data?.items,
    payload?.data?.results,
    payload?.payments,
    payload?.items,
    payload?.results,
    payload?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111217] p-5 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-400">
            {title}
          </p>

          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const info = getStatusInfo(status);
  const Icon = info.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${info.className}`}
    >
      <Icon size={13} />
      {info.label}
    </span>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("smencore_token")
          : null;

      const headers = {
        Accept: "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/payments`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      let payload = null;

      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            text ||
              `Gagal mengambil pembayaran (${response.status}).`
          );
        }

        throw new Error(
          "Respons API bukan JSON. Periksa endpoint Flask."
        );
      }

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            `Gagal mengambil pembayaran (${response.status}).`
        );
      }

      if (
        payload?.status === "error" ||
        payload?.success === false
      ) {
        throw new Error(
          payload?.message ||
            payload?.error ||
            "Gagal mengambil data pembayaran."
        );
      }

      const result = extractPayments(payload);

      setPayments(result);
      setPage(1);
    } catch (err) {
      setError(
        err?.message ||
          "Tidak dapat terhubung ke server Flask."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const status = getPaymentStatus(payment);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      const searchableText = [
        getPaymentId(payment),
        getOrderNumber(payment),
        getCustomerName(payment),
        getPaymentMethod(payment),
        status,
        payment?.transaction_id ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !keyword || searchableText.includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [payments, search, statusFilter]);

  const stats = useMemo(() => {
    const successful = payments.filter(
      (payment) =>
        getPaymentStatus(payment) === "success"
    );

    const pending = payments.filter(
      (payment) =>
        getPaymentStatus(payment) === "pending"
    );

    const failed = payments.filter((payment) =>
      ["failed", "expired"].includes(
        getPaymentStatus(payment)
      )
    );

    const revenue = successful.reduce(
      (sum, payment) =>
        sum + (Number(getAmount(payment)) || 0),
      0
    );

    return {
      total: payments.length,
      successful: successful.length,
      pending: pending.length,
      failed: failed.length,
      revenue,
    };
  }, [payments]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / ITEMS_PER_PAGE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-w-0 bg-[#090a0e] text-white">
      {/* Sidebar */}
      {/* Konten utama */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex flex-col justify-end gap-4 border-b border-zinc-800/80 px-5 py-4 sm:flex-row sm:items-center sm:px-7 lg:px-9">
          <p className="mr-auto text-sm text-zinc-400">
            Pantau transaksi pembayaran dan status pembayaran tiket.
          </p>

          <button
            type="button"
            onClick={() => fetchPayments(true)}
            disabled={refreshing || loading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-[#15161c] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-blue-500/50 hover:bg-[#1b1d25] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Memuat..." : "Refresh Data"}
          </button>
        </div>

        <main className="space-y-6 px-5 py-6 sm:px-7 lg:px-9">
          {/* Error */}
          {error && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>
                  <p className="text-sm font-semibold text-red-300">
                    Gagal memuat pembayaran
                  </p>

                  <p className="mt-1 break-words text-sm text-red-300/80">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchPayments(true)}
                disabled={refreshing}
                className="w-fit rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                Coba lagi
              </button>
            </div>
          )}

          {/* Statistik */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">
                Ringkasan Pembayaran
              </h2>

              <span className="text-xs text-zinc-500">
                {loading
                  ? "Memuat data..."
                  : `${stats.total} transaksi`}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                title="Total Transaksi"
                value={stats.total.toLocaleString("id-ID")}
                description="Seluruh transaksi pembayaran"
                icon={Receipt}
                accent="bg-blue-500/10 text-blue-400"
              />

              <StatCard
                title="Pembayaran Berhasil"
                value={stats.successful.toLocaleString("id-ID")}
                description="Transaksi dengan status berhasil"
                icon={CheckCircle2}
                accent="bg-emerald-500/10 text-emerald-400"
              />

              <StatCard
                title="Menunggu Pembayaran"
                value={stats.pending.toLocaleString("id-ID")}
                description="Transaksi yang masih pending"
                icon={Clock3}
                accent="bg-amber-500/10 text-amber-400"
              />

              <StatCard
                title="Gagal / Kedaluwarsa"
                value={stats.failed.toLocaleString("id-ID")}
                description="Transaksi gagal atau kedaluwarsa"
                icon={XCircle}
                accent="bg-red-500/10 text-red-400"
              />

              <StatCard
                title="Total Pembayaran Berhasil"
                value={formatRupiah(stats.revenue)}
                description="Akumulasi nominal transaksi berhasil"
                icon={Wallet}
                accent="bg-violet-500/10 text-violet-400"
              />
            </div>
          </section>

          {/* Tabel pembayaran */}
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111217]">
            <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Data Pembayaran
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Daftar transaksi yang tercatat di sistem.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="relative min-w-0 flex-1 sm:min-w-[230px] lg:w-[260px]">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Cari ID, order, pelanggan..."
                    className="w-full rounded-xl border border-zinc-700 bg-[#090a0e] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-xl border border-zinc-700 bg-[#090a0e] px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-zinc-800 bg-[#15161c] text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">
                      ID Pembayaran
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Order
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Pelanggan
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Metode
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Tanggal
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Nominal
                    </th>
                    <th className="px-5 py-4 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800/80">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-16 text-center"
                      >
                        <RefreshCw
                          size={22}
                          className="mx-auto animate-spin text-blue-400"
                        />

                        <p className="mt-3 text-sm text-zinc-400">
                          Memuat data pembayaran...
                        </p>
                      </td>
                    </tr>
                  ) : paginatedPayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/70 text-zinc-500">
                          <CreditCard size={23} />
                        </div>

                        <p className="mt-4 font-medium text-zinc-300">
                          Tidak ada data pembayaran
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {error
                            ? "Periksa koneksi API, lalu coba muat ulang."
                            : payments.length === 0
                              ? "Belum ada transaksi yang dikembalikan oleh API."
                              : "Coba ubah kata kunci pencarian atau filter status."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((payment, index) => {
                      const paymentId = getPaymentId(payment);
                      const status = getPaymentStatus(payment);

                      return (
                        <tr
                          key={
                            payment?.id ??
                            payment?.payment_id ??
                            payment?.transaction_id ??
                            `${getOrderNumber(payment)}-${index}`
                          }
                          className="transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-medium text-zinc-200">
                              #{paymentId}
                            </div>

                            {payment?.transaction_id && (
                              <div className="mt-1 max-w-[170px] truncate text-xs text-zinc-500">
                                {payment.transaction_id}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-medium text-blue-400">
                              {getOrderNumber(payment)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-zinc-300">
                              {getCustomerName(payment)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-2 text-zinc-300">
                              <CreditCard
                                size={15}
                                className="shrink-0 text-zinc-500"
                              />

                              <span className="capitalize">
                                {String(
                                  getPaymentMethod(payment)
                                ).replaceAll("_", " ")}
                              </span>
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-2 whitespace-nowrap text-zinc-400">
                              <CalendarDays
                                size={14}
                                className="shrink-0 text-zinc-500"
                              />

                              {formatDate(
                                getPaymentDate(payment)
                              )}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-white">
                            {formatRupiah(getAmount(payment))}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={status} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-500">
                Menampilkan{" "}
                <span className="font-medium text-zinc-300">
                  {filteredPayments.length === 0
                    ? 0
                    : (currentPage - 1) *
                        ITEMS_PER_PAGE +
                      1}
                  {"–"}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredPayments.length
                  )}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-zinc-300">
                  {filteredPayments.length}
                </span>{" "}
                transaksi
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) =>
                      Math.max(1, previous - 1)
                    )
                  }
                  disabled={currentPage <= 1 || loading}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Sebelumnya
                </button>

                <span className="min-w-[76px] text-center text-sm text-zinc-400">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) =>
                      Math.min(totalPages, previous + 1)
                    )
                  }
                  disabled={
                    currentPage >= totalPages || loading
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          <p className="pb-2 text-center text-xs text-zinc-600">
            SMEncore Admin Dashboard
          </p>
        </main>
      </div>
    </div>
  );
}
