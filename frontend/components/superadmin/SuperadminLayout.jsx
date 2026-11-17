"use client";

import { useState } from "react";

import SuperadminHeader from "./SuperadminHeader";
import SuperadminSidebar from "./SuperadminSidebar";

export default function SuperadminLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0a0a0e] text-zinc-100">
      <SuperadminSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <SuperadminHeader onMenuClick={() => setMobileMenuOpen(true)} />
        {children}
      </div>
    </div>
  );
}
