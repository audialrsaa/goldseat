"use client";

import { useState } from "react";

import EventManagerHeader from "./EventManagerHeader";
import EventManagerSidebar from "./EventManagerSidebar";

export default function EventManagerLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0a0a0e] text-zinc-100">
      <EventManagerSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <EventManagerHeader onMenuClick={() => setMobileMenuOpen(true)} />
        {children}
      </div>
    </div>
  );
}
