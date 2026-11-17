
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { getToken, clearSession } from "./api";
import { isAllowedRole } from "./auth-config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek session saat aplikasi dibuka
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("smencore_user");
      const storedToken = getToken();

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);

        if (parsedUser && isAllowedRole(parsedUser.role)) {
          setUser(parsedUser);
        } else {
          clearSession();
        }
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, []);

  // LOGOUT
  const logout = useCallback(() => {
    clearSession();
    setUser(null);

    // Redirect langsung ke halaman login
    window.location.replace("/login");
  }, []);

  const value = {
    user,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// CUSTOM HOOK
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}

// AMBIL TOKEN
export function getStoredToken() {
  return getToken();
}

// AMBIL USER
export function getStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("smencore_user");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
