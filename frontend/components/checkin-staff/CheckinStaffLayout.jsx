"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "../../lib/auth-context";
import CheckinStaffHeader from "./CheckinStaffHeader";
import CheckinStaffSidebar from "./CheckinStaffSidebar";

export default function CheckinStaffLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    } else if (user.role !== "checkin_staff") {
      router.replace("/forbidden");
    }
  }, [loading, router, user]);

  if (loading || !user || user.role !== "checkin_staff") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0e] text-sm text-zinc-500">
        Memuat sesi...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0e] text-zinc-100">
      <CheckinStaffSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <CheckinStaffHeader
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        {children}
      </div>
    </div>
  );
}