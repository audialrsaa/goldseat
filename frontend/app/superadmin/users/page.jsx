"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SuperAdminSidebar from "../components/SuperAdminSidebar";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const USERS_ENDPOINT = `${API_BASE_URL.replace(/\/$/, "")}/admin/users`;

// ============================================================
// ROLE SESUAI DENGAN DATABASE
// ============================================================

const ROLE_LABELS = {
  super_admin: "Super Admin",
  event_manager: "Event Manager",
  cashier: "Cashier",
  checkin_staff: "Check-in Staff",
  user: "User",
};

const STATUS_LABELS = {
  active: "Aktif",
  suspended: "Suspended",
  inactive: "Inactive",
};

// ============================================================
// TOKEN
// ============================================================

function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("smencore_token");
}

// ============================================================
// DATE
// ============================================================

function formatDate(dateValue) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// INITIALS
// ============================================================

function getInitials(name) {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

// ============================================================
// ROLE LABEL
// ============================================================

function roleLabel(role) {
  if (!role) return "-";

  // Kalau backend mengembalikan:
  // role: "cashier"
  if (typeof role === "string") {
    return ROLE_LABELS[role] || role;
  }

  // Kalau backend mengembalikan:
  // role: { name: "cashier" }
  if (typeof role === "object") {
    const name = role.name || role.role;

    return ROLE_LABELS[name] || name || "-";
  }

  return "-";
}

// ============================================================
// ROLE VALUE
// ============================================================

function getRoleValue(role) {
  if (!role) return "";

  if (typeof role === "string") {
    return role;
  }

  if (typeof role === "object") {
    return role.name || role.role || "";
  }

  return "";
}

// ============================================================
// STATUS LABEL
// ============================================================

function statusLabel(status) {
  return STATUS_LABELS[status] || status || "-";
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function StaffUserPage() {
  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [perPage] = useState(5);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  // ============================================================
  // FORM
  // ============================================================

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",

    // PENTING:
    // Harus sama dengan database
    role: "cashier",

    status: "active",
  });

  // ============================================================
  // API REQUEST
  // ============================================================

  async function apiRequest(url, options = {}) {
    const token = getToken();

    console.log("======================================");
    console.log("API REQUEST");
    console.log("URL:", url);
    console.log("METHOD:", options.method || "GET");
    console.log("TOKEN EXISTS:", Boolean(token));
    console.log("======================================");

    const response = await fetch(url, {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    });

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    console.log("======================================");
    console.log("API RESPONSE");
    console.log("STATUS:", response.status);
    console.log("DATA:", data);
    console.log("======================================");

    // ==========================================================
    // 401
    // ==========================================================

    if (response.status === 401) {
      localStorage.removeItem("smencore_token");
      localStorage.removeItem("smencore_user");

      document.cookie =
        "smencore_token=; path=/; max-age=0";

      router.push("/login");

      throw new Error("Sesi login sudah berakhir");
    }

    // ==========================================================
    // 403
    // ==========================================================

    if (response.status === 403) {
      throw new Error(
        data.message ||
          "Anda tidak memiliki akses ke halaman ini"
      );
    }

    // ==========================================================
    // ERROR
    // ==========================================================

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Terjadi kesalahan server (${response.status})`
      );
    }

    return data;
  }

  // ============================================================
  // LOAD USERS
  // ============================================================

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("per_page", String(perPage));

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (roleFilter) {
        params.set("role", roleFilter);
      }

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const url =
        `${USERS_ENDPOINT}/?${params.toString()}`;

      const result = await apiRequest(url);

      const data = result?.data || {};

      setUsers(
        Array.isArray(data.users)
          ? data.users
          : []
      );

      setTotal(Number(data.total || 0));

      setTotalPages(
        Number(data.total_pages || 1)
      );
    } catch (err) {
      console.error(
        "LOAD USERS ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal mengambil data user"
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // LOAD ROLES
  // ============================================================

  async function loadRoles() {
    try {
      const result = await apiRequest(
        `${USERS_ENDPOINT}/roles`
      );

      const data = result?.data || [];

      if (!Array.isArray(data)) {
        throw new Error(
          "Format roles tidak valid"
        );
      }

      console.log("ROLES DARI DATABASE:", data);

      setRoles(data);
    } catch (err) {
      console.error(
        "LOAD ROLES ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal mengambil data role"
      );

      setRoles([]);
    }
  }

  // ============================================================
  // EFFECT LOAD ROLES
  // ============================================================

  useEffect(() => {
    loadRoles();
  }, []);

  // ============================================================
  // EFFECT LOAD USERS
  // ============================================================

  useEffect(() => {
    loadUsers();
  }, [
    page,
    perPage,
    search,
    roleFilter,
    statusFilter,
  ]);

  // ============================================================
  // SEARCH DEBOUNCE
  // ============================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ============================================================
  // RESET FORM
  // ============================================================

  function resetForm() {
    setForm({
      full_name: "",
      email: "",
      phone: "",
      password: "",

      // Sesuai database
      role: "cashier",

      status: "active",
    });
  }

  // ============================================================
  // OPEN ADD MODAL
  // ============================================================

  function openAddModal() {
    setEditingUser(null);

    resetForm();

    setError("");
    setSuccess("");

    setShowModal(true);
  }

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  function openEditModal(user) {
    setEditingUser(user);

    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",

      // Ambil role dari backend
      role:
        getRoleValue(user.role) ||
        "cashier",

      status:
        user.status || "active",
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  }

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);

    resetForm();
  }

  // ============================================================
  // FORM CHANGE
  // ============================================================

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // ========================================================
      // VALIDATION
      // ========================================================

      if (!form.full_name.trim()) {
        throw new Error(
          "Nama lengkap wajib diisi"
        );
      }

      if (!form.email.trim()) {
        throw new Error(
          "Email wajib diisi"
        );
      }

      if (!form.role) {
        throw new Error(
          "Role wajib dipilih"
        );
      }

      if (
        !editingUser &&
        !form.password.trim()
      ) {
        throw new Error(
          "Password wajib diisi"
        );
      }

      if (
        !editingUser &&
        form.password.trim().length < 8
      ) {
        throw new Error(
          "Password minimal 8 karakter"
        );
      }

      if (
        editingUser &&
        form.password.trim() &&
        form.password.trim().length < 8
      ) {
        throw new Error(
          "Password minimal 8 karakter"
        );
      }

      // ========================================================
      // PAYLOAD
      // ========================================================

      const payload = {
        full_name: form.full_name.trim(),

        email: form.email.trim(),

        phone:
          form.phone.trim() || null,

        // PENTING:
        // Ini sekarang akan mengirim:
        // cashier
        // event_manager
        // checkin_staff
        // super_admin
        // user
        role: form.role,

        status: form.status,
      };

      if (form.password.trim()) {
        payload.password =
          form.password.trim();
      }

      console.log(
        "======================================"
      );

      console.log(
        editingUser
          ? "UPDATE USER"
          : "CREATE USER"
      );

      console.log(
        "ROLE YANG DIKIRIM:",
        payload.role
      );

      console.log(
        "PAYLOAD:",
        payload
      );

      console.log(
        "======================================"
      );

      let result;

      // ========================================================
      // UPDATE
      // ========================================================

      if (editingUser) {
        result = await apiRequest(
          `${USERS_ENDPOINT}/${editingUser.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );
      }

      // ========================================================
      // CREATE
      // ========================================================

      else {
        result = await apiRequest(
          `${USERS_ENDPOINT}/`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      setSuccess(
        result?.message ||
          (editingUser
            ? "User berhasil diperbarui"
            : "User berhasil dibuat")
      );

      setShowModal(false);
      setEditingUser(null);

      resetForm();

      await loadUsers();
    } catch (err) {
      console.error(
        "CREATE / UPDATE USER ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal menyimpan user"
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // CHANGE STATUS
  // ============================================================

  async function toggleStatus(user) {
    const nextStatus =
      user.status === "active"
        ? "suspended"
        : "active";

    const confirmation =
      user.status === "active"
        ? `Suspend akun ${user.full_name}?`
        : `Aktifkan kembali akun ${user.full_name}?`;

    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const result = await apiRequest(
        `${USERS_ENDPOINT}/${user.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      setSuccess(
        result?.message ||
          (nextStatus === "active"
            ? "Akun berhasil diaktifkan"
            : "Akun berhasil disuspend")
      );

      await loadUsers();
    } catch (err) {
      console.error(
        "CHANGE STATUS ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal mengubah status user"
      );
    }
  }

  // ============================================================
  // DELETE MODAL
  // ============================================================

  function openDeleteModal(user) {
    setDeletingUser(user);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (saving) return;

    setShowDeleteModal(false);
    setDeletingUser(null);
  }

  // ============================================================
  // DELETE USER
  // ============================================================

  async function handleDelete() {
    if (!deletingUser) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await apiRequest(
        `${USERS_ENDPOINT}/${deletingUser.id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        result?.message ||
          "User berhasil dihapus"
      );

      setShowDeleteModal(false);
      setDeletingUser(null);

      if (
        users.length === 1 &&
        page > 1
      ) {
        setPage(
          (previous) => previous - 1
        );
      } else {
        await loadUsers();
      }
    } catch (err) {
      console.error(
        "DELETE USER ERROR:",
        err
      );

      setError(
        err?.message ||
          "Gagal menghapus user"
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  function previousPage() {
    if (page <= 1) return;

    setPage(
      (previous) => previous - 1
    );
  }

  function nextPage() {
    if (page >= totalPages) return;

    setPage(
      (previous) => previous + 1
    );
  }

  const firstItem =
    total === 0
      ? 0
      : (page - 1) * perPage + 1;

  const lastItem =
    total === 0
      ? 0
      : Math.min(
          page * perPage,
          total
        );

  // ============================================================
  // ROLE OPTIONS
  // ============================================================

  const roleOptions = useMemo(() => {
    return roles
      .map((role) => {
        if (typeof role === "string") {
          return role;
        }

        return (
          role?.name ||
          role?.role ||
          ""
        );
      })
      .filter(Boolean);
  }, [roles]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <div className="flex min-h-screen">

        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <SuperAdminSidebar />

        {/* ======================================================
            MAIN
        ====================================================== */}

        <main className="flex-1 min-w-0">

          {/* ====================================================
              TOP BAR
          ==================================================== */}

          <header className="h-[72px] border-b border-white/[0.08] flex items-center justify-between px-7">

            <div>
              <div className="text-[16px] font-semibold">
                Staff & User
              </div>

              <div className="text-[12px] text-gray-500 mt-1">
                Super Admin / Staff & User
              </div>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden md:flex items-center w-[330px] h-[40px] rounded-xl bg-[#14141d] border border-white/[0.08] px-4">

                <span className="text-gray-500 mr-2">
                  ⌕
                </span>

                <input
                  value={searchInput}
                  onChange={(e) =>
                    setSearchInput(
                      e.target.value
                    )
                  }
                  placeholder="Cari event, order, atau user..."
                  className="bg-transparent outline-none text-[13px] text-white placeholder:text-gray-600 w-full"
                />

              </div>

              <div className="h-[40px] px-4 rounded-xl bg-[#14141d] border border-white/[0.08] flex items-center text-[13px] font-medium">
                Super Admin
              </div>

              <button
                type="button"
                className="w-[40px] h-[40px] rounded-xl border border-white/[0.08] bg-[#14141d] text-gray-400"
              >
                ♧
              </button>

              <div className="w-[40px] h-[40px] rounded-xl bg-[#6546e8] flex items-center justify-center font-semibold">
                A
              </div>

            </div>
          </header>

          {/* ====================================================
              CONTENT
          ==================================================== */}

          <section className="p-7">

            <div className="mb-1 text-[12px] text-gray-500">
              Super Admin / Staff & User
            </div>

            <div className="flex items-start justify-between gap-4 mb-7">

              <div>
                <h1 className="text-[24px] font-semibold">
                  Manajemen Staff & User
                </h1>

                <p className="text-[13px] text-gray-500 mt-1">
                  Kelola akun internal dan pengguna aplikasi mobile
                </p>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="h-[40px] px-4 rounded-xl bg-[#ffc857] text-black text-[13px] font-semibold hover:bg-[#ffd36f] transition"
              >
                + Tambah Staff
              </button>

            </div>

            {/* ==================================================
                ALERT
            ================================================== */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">
                {success}
              </div>
            )}

            {/* ==================================================
                FILTERS
            ================================================== */}

            <div className="flex items-center justify-between gap-4 mb-4">

              <div className="flex items-center gap-3">

                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(
                      e.target.value
                    );

                    setPage(1);
                  }}
                  className="h-[38px] min-w-[145px] rounded-xl border border-white/[0.09] bg-[#15151f] px-3 text-[13px] text-gray-200 outline-none"
                >

                  <option value="">
                    Semua Role
                  </option>

                  {roleOptions.map(
                    (role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {roleLabel(role)}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                    );

                    setPage(1);
                  }}
                  className="h-[38px] min-w-[130px] rounded-xl border border-white/[0.09] bg-[#15151f] px-3 text-[13px] text-gray-200 outline-none"
                >

                  <option value="">
                    Semua Status
                  </option>

                  <option value="active">
                    Aktif
                  </option>

                  <option value="suspended">
                    Suspended
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>

              <div className="flex items-center w-[190px] h-[38px] rounded-xl bg-[#15151f] border border-white/[0.09] px-3">

                <span className="text-gray-600 mr-2">
                  ⌕
                </span>

                <input
                  value={searchInput}
                  onChange={(e) =>
                    setSearchInput(
                      e.target.value
                    )
                  }
                  placeholder="Cari nama atau email..."
                  className="bg-transparent outline-none text-[12px] text-white placeholder:text-gray-600 w-full"
                />

              </div>

            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="rounded-2xl border border-white/[0.08] bg-[#13131c] overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[950px]">

                  <thead>

                    <tr className="border-b border-white/[0.07] bg-[#161620]">

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        NAMA
                      </th>

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        EMAIL
                      </th>

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        ROLE
                      </th>

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        STATUS
                      </th>

                      <th className="text-left px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        BERGABUNG
                      </th>

                      <th className="text-center px-4 py-3 text-[10px] tracking-[0.12em] text-gray-500 font-medium">
                        AKSI
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {loading ? (

                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-16 text-center text-[13px] text-gray-500"
                        >
                          Memuat data user...
                        </td>
                      </tr>

                    ) : users.length === 0 ? (

                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-16 text-center text-[13px] text-gray-500"
                        >
                          Tidak ada user ditemukan.
                        </td>
                      </tr>

                    ) : (

                      users.map((user) => {

                        const currentRole =
                          getRoleValue(
                            user.role
                          );

                        return (
                          <tr
                            key={user.id}
                            className="border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.015] transition"
                          >

                            {/* NAME */}

                            <td className="px-4 py-3">

                              <div className="flex items-center gap-3">

                                {user.photo ? (

                                  <img
                                    src={user.photo}
                                    alt={
                                      user.full_name
                                    }
                                    className="w-[38px] h-[38px] rounded-lg object-cover"
                                  />

                                ) : (

                                  <div className="w-[38px] h-[38px] rounded-lg bg-[#27243f] flex items-center justify-center text-[12px] text-purple-200 font-semibold">
                                    {getInitials(
                                      user.full_name
                                    )}
                                  </div>

                                )}

                                <div>

                                  <div className="text-[13px] font-semibold text-gray-100">
                                    {
                                      user.full_name
                                    }
                                  </div>

                                  {user.phone && (
                                    <div className="text-[11px] text-gray-600 mt-1">
                                      {
                                        user.phone
                                      }
                                    </div>
                                  )}

                                </div>

                              </div>

                            </td>

                            {/* EMAIL */}

                            <td className="px-4 py-3">

                              <span className="text-[12px] text-gray-200">
                                {user.email}
                              </span>

                            </td>

                            {/* ROLE */}

                            <td className="px-4 py-3">

                              <span className="inline-flex items-center rounded-full bg-[#20202c] px-3 py-1 text-[11px] text-gray-400">
                                {roleLabel(
                                  currentRole
                                )}
                              </span>

                            </td>

                            {/* STATUS */}

                            <td className="px-4 py-3">

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${
                                  user.status ===
                                  "active"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : user.status ===
                                      "suspended"
                                    ? "bg-amber-500/15 text-amber-400"
                                    : "bg-gray-500/15 text-gray-400"
                                }`}
                              >

                                <span
                                  className={`w-[5px] h-[5px] rounded-full ${
                                    user.status ===
                                    "active"
                                      ? "bg-emerald-400"
                                      : user.status ===
                                        "suspended"
                                      ? "bg-amber-400"
                                      : "bg-gray-400"
                                  }`}
                                />

                                {statusLabel(
                                  user.status
                                )}

                              </span>

                            </td>

                            {/* CREATED */}

                            <td className="px-4 py-3">

                              <span className="text-[12px] text-gray-300">
                                {formatDate(
                                  user.created_at
                                )}
                              </span>

                            </td>

                            {/* ACTION */}

                            <td className="px-4 py-3">

                              <div className="flex justify-center items-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      user
                                    )
                                  }
                                  title="Edit"
                                  className="w-[32px] h-[32px] rounded-lg border border-white/[0.09] bg-[#15151f] text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
                                >
                                  ✎
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStatus(
                                      user
                                    )
                                  }
                                  title={
                                    user.status ===
                                    "active"
                                      ? "Suspend"
                                      : "Aktifkan"
                                  }
                                  className="w-[32px] h-[32px] rounded-lg border border-white/[0.09] bg-[#15151f] text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
                                >
                                  ⏻
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    openDeleteModal(
                                      user
                                    )
                                  }
                                  title="Hapus"
                                  className="w-[32px] h-[32px] rounded-lg border border-red-500/10 bg-[#15151f] text-red-400 hover:bg-red-500/10 transition"
                                >
                                  🗑
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      })

                    )}

                  </tbody>

                </table>

              </div>

              {/* ==================================================
                  FOOTER
              ================================================== */}

              <div className="h-[58px] px-4 flex items-center justify-between border-t border-white/[0.07]">

                <div className="text-[11px] text-gray-500">
                  Menampilkan{" "}
                  {firstItem}–{lastItem} dari{" "}
                  {total} akun
                </div>

                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    disabled={
                      page <= 1 ||
                      loading
                    }
                    onClick={
                      previousPage
                    }
                    className="w-[32px] h-[32px] rounded-lg border border-white/[0.09] bg-[#15151f] text-gray-400 disabled:opacity-30 hover:text-white transition"
                  >
                    ‹
                  </button>

                  <span className="text-[12px] text-gray-500 px-2">
                    {page} /{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >=
                        totalPages ||
                      loading
                    }
                    onClick={nextPage}
                    className="w-[32px] h-[32px] rounded-lg border border-white/[0.09] bg-[#15151f] text-gray-400 disabled:opacity-30 hover:text-white transition"
                  >
                    ›
                  </button>

                </div>

              </div>

            </div>

          </section>

        </main>
      </div>

      {/* ========================================================
          ADD / EDIT MODAL
      ======================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative w-full max-w-[540px] rounded-2xl border border-white/[0.1] bg-[#1a1a25] shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">

              <h2 className="text-[16px] font-semibold">
                {editingUser
                  ? "Edit Akun"
                  : "Tambah Akun Staff"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="w-[32px] h-[32px] rounded-lg border border-white/[0.08] text-gray-500 hover:text-white transition"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form onSubmit={handleSubmit}>

              <div className="p-5 space-y-5">

                {/* NAME */}

                <div>

                  <label className="block text-[12px] text-gray-400 mb-2">
                    Nama Lengkap
                  </label>

                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={
                      handleFormChange
                    }
                    placeholder="cth. Rani Kusuma"
                    autoComplete="name"
                    className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                  />

                </div>

                {/* EMAIL + ROLE */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* EMAIL */}

                  <div>

                    <label className="block text-[12px] text-gray-400 mb-2">
                      Email
                    </label>

                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={
                        handleFormChange
                      }
                      placeholder="rani@smencore.id"
                      autoComplete="email"
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                    />

                  </div>

                  {/* ROLE */}

                  <div>

                    <label className="block text-[12px] text-gray-400 mb-2">
                      Role
                    </label>

                    <select
                      name="role"
                      value={form.role}
                      onChange={
                        handleFormChange
                      }
                      className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50"
                    >

                      {roleOptions.length ===
                      0 ? (

                        <option value="">
                          Memuat role...
                        </option>

                      ) : (

                        roleOptions.map(
                          (role) => (
                            <option
                              key={role}
                              value={role}
                            >
                              {roleLabel(
                                role
                              )}
                            </option>
                          )
                        )

                      )}

                    </select>

                    {/* DEBUG ROLE */}

                    <div className="mt-1 text-[10px] text-gray-600">
                      Value:{" "}
                      {form.role || "-"}
                    </div>

                  </div>

                </div>

                {/* PHONE */}

                <div>

                  <label className="block text-[12px] text-gray-400 mb-2">
                    Nomor Telepon
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={
                      handleFormChange
                    }
                    placeholder="08xxxxxxxxxx"
                    autoComplete="tel"
                    className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <label className="block text-[12px] text-gray-400 mb-2">
                    {editingUser
                      ? "Password Baru (opsional)"
                      : "Password Sementara"}
                  </label>

                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={
                      handleFormChange
                    }
                    placeholder={
                      editingUser
                        ? "Kosongkan jika tidak diubah"
                        : "Minimal 8 karakter"
                    }
                    autoComplete="new-password"
                    className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                  />

                </div>

                {/* STATUS */}

                <div>

                  <label className="block text-[12px] text-gray-400 mb-2">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={
                      handleFormChange
                    }
                    className="w-full h-[42px] rounded-xl border border-white/[0.08] bg-[#14141e] px-3 text-[13px] text-white outline-none focus:border-purple-500/50"
                  >

                    <option value="active">
                      Aktif
                    </option>

                    <option value="suspended">
                      Suspended
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                  </select>

                </div>

                {/* ERROR */}

                {error && (

                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-[12px] text-red-300">
                    {error}
                  </div>

                )}

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/[0.08]">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-[40px] px-5 rounded-xl border border-white/[0.08] text-[13px] text-gray-400 hover:text-white transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-[40px] px-5 rounded-xl bg-[#ffc857] text-black text-[13px] font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingUser
                    ? "Simpan Perubahan"
                    : "Simpan Akun"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ========================================================
          DELETE MODAL
      ======================================================== */}

      {showDeleteModal &&
        deletingUser && (

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={
                closeDeleteModal
              }
            />

            <div className="relative w-full max-w-[420px] rounded-2xl border border-white/[0.1] bg-[#1a1a25] shadow-2xl p-5">

              <h2 className="text-[16px] font-semibold mb-2">
                Hapus Akun?
              </h2>

              <p className="text-[13px] text-gray-500 leading-6">

                Apakah kamu yakin ingin
                menghapus akun{" "}

                <span className="text-white font-medium">
                  {
                    deletingUser.full_name
                  }
                </span>
                ?

              </p>

              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={
                    closeDeleteModal
                  }
                  disabled={saving}
                  className="h-[40px] px-5 rounded-xl border border-white/[0.08] text-[13px] text-gray-400"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="h-[40px] px-5 rounded-xl bg-red-500 text-white text-[13px] font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Menghapus..."
                    : "Hapus"}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}