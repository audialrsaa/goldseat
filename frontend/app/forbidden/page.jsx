"use client";

import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB] px-6">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#E77D9A]/10 text-[#E77D9A] text-4xl font-bold font-[family-name:var(--font-display)]">
            403
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[#24151B] font-[family-name:var(--font-display)] tracking-[-0.04em]">
          Access Denied
        </h1>
        <p className="mt-3 text-sm text-[#24151B]/50 leading-relaxed">
          You do not have permission to access this page. If you believe this is
          an error, please contact your administrator.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-[#24151B] text-[#F5F0EB] text-sm font-semibold transition hover:bg-[#E77D9A] hover:text-[#24151B]"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
