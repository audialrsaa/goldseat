
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { loginUser, saveSession } from "../../lib/api";

import {
  ROLE_DASHBOARDS,
  isAllowedRole,
} from "../../lib/auth-config";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      // Login ke backend Flask
      const res = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      const accessToken = res?.data?.access_token;
      const user = res?.data?.user;
      const role = user?.role;

      // Validasi token
      if (!accessToken) {
        throw new Error(
          "Login berhasil, tetapi access token tidak ditemukan."
        );
      }

      // Validasi role
      if (!role || !isAllowedRole(role)) {
        throw new Error(
          "Your account does not have access to this system."
        );
      }

      // Simpan session ke localStorage
      saveSession({
        access_token: accessToken,
        user,
      });

      // Redirect sesuai role
      window.location.replace(
        ROLE_DASHBOARDS[role] || "/forbidden"
      );

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F5F0EB]">

      {/* LEFT — FORM */}
      <section className="flex items-center justify-center px-6 py-12 lg:px-10">
        <div className="w-full max-w-[420px]">

          {/* Logo */}
          <Link
            href="/"
            className="inline-block font-display font-semibold text-xl tracking-[-0.07em] text-[#24151B] mb-10"
          >
            sm<span className="text-[#E77D9A]">Encore</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display font-semibold text-[36px] leading-[1.1] text-[#24151B] tracking-[-0.04em]">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#24151B]/50">
              Sign in to access the management dashboard and manage
              concerts, tickets, transactions, and event operations.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="bg-[#FDE8ED] border border-[#F7C8D4] text-[#A03952] text-sm px-4 py-3 rounded-xl mb-5"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-[#24151B]/60"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3.5 rounded-xl bg-white/60 border border-[#24151B]/10 text-[#24151B] text-sm placeholder:text-[#24151B]/25 outline-none transition focus:border-[#E77D9A] focus:ring-4 focus:ring-[#E77D9A]/10 disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-[0.08em] text-[#24151B]/60"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3.5 pr-[100px] rounded-xl bg-white/60 border border-[#24151B]/10 text-[#24151B] text-sm placeholder:text-[#24151B]/25 outline-none transition focus:border-[#E77D9A] focus:ring-4 focus:ring-[#E77D9A]/10 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#24151B]/30 transition hover:text-[#E77D9A] disabled:opacity-50"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() =>
                  setError("Forgot password is not available yet.")
                }
                className="text-xs font-semibold text-[#E77D9A] transition hover:text-[#24151B]"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3.5 px-4 rounded-xl bg-[#24151B] text-[#F5F0EB] text-sm font-semibold transition hover:bg-[#E77D9A] hover:text-[#24151B] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>
        </div>
      </section>

      {/* RIGHT — VISUAL */}
      <VisualPanel />

    </main>
  );
}

/* ============================================================
   RIGHT PANEL
============================================================ */

function VisualPanel() {
  const panelRef = useRef(null);

  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
  });

  const [hovering, setHovering] = useState(false);

  function handleMouseMove(event) {
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();

    const px =
      (event.clientX - rect.left) / rect.width - 0.5;

    const py =
      (event.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: px * 18,
      y: py * -18,
    });
  }

  function handleMouseLeave() {
    setHovering(false);

    setTilt({
      x: 0,
      y: 0,
    });
  }

  return (
    <div
      ref={panelRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleMouseLeave}
      className="relative hidden lg:flex items-center justify-center bg-[#24151B] m-6 rounded-3xl overflow-hidden min-h-[calc(100vh-3rem)]"
    >

      {/* Background photo */}
      <Image
        src="/logo/image.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 50vw, 0px"
        className="object-cover transition-transform duration-700 ease-out"
        style={{
          opacity: 0.7,
          transform: `
            scale(${hovering ? 1.05 : 1})
            translate(
              ${tilt.x * 0.4}px,
              ${tilt.y * 0.4}px
            )
          `,
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#24151B]/80 via-[#24151B]/55 to-[#24151B]/90" />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-30 blur-[140px]"
          style={{
            background:
              "radial-gradient(#E77D9A, transparent 70%)",
          }}
        />

        <div
          className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-20 blur-[120px]"
          style={{
            background:
              "radial-gradient(#E77D9A, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full min-h-[calc(100vh-3rem)] w-full px-10 py-12">

        {/* Ticker */}
        <div className="w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm py-2.5">
          <span className="inline-block whitespace-nowrap animate-ticker text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">
            Next On Stage — smEncore
            &nbsp;•&nbsp;
            Presale Now Open
            &nbsp;•&nbsp;
            Safe, Fast, Official
            &nbsp;•&nbsp;
            Next On Stage — smEncore
            &nbsp;•&nbsp;
            Presale Now Open
            &nbsp;•&nbsp;
          </span>
        </div>

        {/* Logo */}
        <div className="relative flex-1 flex items-center justify-center w-full py-8">

          <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-white/5 rounded-full" />

          <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/10 rounded-full" />

          <div
            className="relative flex items-center justify-center transition-transform duration-300 ease-out"
            style={{
              transform: `
                perspective(700px)
                rotateX(${tilt.y}deg)
                rotateY(${tilt.x}deg)
                scale(${hovering ? 1.08 : 1})
              `,
            }}
          >
            <div
              className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-300"
              style={{
                background:
                  "radial-gradient(#E77D9A, transparent 70%)",
                opacity: hovering ? 0.5 : 0.25,
              }}
            />

            <span className="relative font-display font-semibold text-white text-5xl tracking-[-0.06em] drop-shadow-lg">
              sm<span className="text-[#E77D9A]">Encore</span>
            </span>
          </div>

        </div>

        {/* Bottom text */}
        <div className="text-center max-w-sm">

          <h2 className="font-display text-xl font-semibold text-white leading-snug tracking-[-0.04em]">
            One ticket,
            <br />
            <span className="text-[#E77D9A]">
              a thousand memories.
            </span>
          </h2>

          <p className="mt-1.5 text-sm text-white/40">
            Book SM Entertainment concert tickets without the drama.
          </p>

          <div className="flex justify-center gap-2 mt-5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-6 h-1.5 rounded-full bg-[#E77D9A]" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }

        .animate-ticker {
          animation: ticker 25s linear infinite;
        }
      `}</style>

    </div>
  );
}
