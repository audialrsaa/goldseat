"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "./api";
import { ROLE_DASHBOARDS, isAllowedRole } from "./auth-config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("smencore_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && isAllowedRole(parsed.role)) {
          setUser(parsed);
        }
      }
    } catch {
      // corrupted data — ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = { user, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getStoredToken() {
  return getToken();
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("smencore_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
