// lib/auth-config.js
// Centralized RBAC configuration — roles, route mappings, and redirects.

export const ALLOWED_ROLES = [
  "super_admin",
  "event-manager",
  "cashier",
  "checkin-staff",
];

export const ROLE_ROUTE_PREFIXES = {
  super_admin: "/superadmin",
  "event-manager": "/event-manager",
  cashier: "/cashier",
  "checkin-staff": "/checkin-staff",
};

export const ROLE_DASHBOARDS = {
  super_admin: "/superadmin/dashboard",
  "event-manager": "/event-manager/dashboard",
  cashier: "/cashier/dashboard",
  "checkin-staff": "/checkin-staff/dashboard",
};

export const TOKEN_COOKIE_NAME = "smencore_token";

export const PUBLIC_PATHS = ["/login", "/forbidden"];

export const STATIC_ASSET_REGEX = /\.(.*)$/;

export function isAllowedRole(role) {
  return ALLOWED_ROLES.includes(role);
}

export function getRoleFromPath(pathname) {
  for (const [role, prefix] of Object.entries(ROLE_ROUTE_PREFIXES)) {
    if (pathname.startsWith(prefix + "/") || pathname === prefix) {
      return role;
    }
  }
  return null;
}

export function getDashboardForRole(role) {
  return ROLE_DASHBOARDS[role] || "/forbidden";
}
