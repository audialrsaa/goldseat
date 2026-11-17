
export const ALLOWED_ROLES = [
  "super_admin",
  "event_manager",
  "cashier",
  "checkin_staff",
  "user",
];

export const ROLE_ROUTE_PREFIXES = {
  super_admin: "/superadmin",
  event_manager: "/event-manager",
  cashier: "/cashier",
  checkin_staff: "/checkin-staff",
  user: "/user",
};

export const ROLE_DASHBOARDS = {
  super_admin: "/superadmin/dashboard",
  event_manager: "/event-manager/dashboard",
  cashier: "/cashier/dashboard",
  checkin_staff: "/checkin-staff/dashboard",
  user: "/user/dashboard",
};

export const TOKEN_COOKIE_NAME = "smencore_token";

export const PUBLIC_PATHS = ["/login", "/forbidden"];

export const STATIC_ASSET_REGEX = /\.[^/]+$/;

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
