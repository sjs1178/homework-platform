export const ADMIN_COOKIE = "admin_session";
export const ADMIN_EMAIL = "sjs1178@gmail.com";

const ADMIN_SECRET =
  process.env.ADMIN_SECRET ?? "kiddoloop_admin_2026_internal";

export const ADMIN_TOKEN = btoa(ADMIN_SECRET);

export function checkAdminCredentials(
  username: string,
  password: string
): boolean {
  return username === "admin" && password === "admin1178";
}

export function verifyAdminToken(token: string | undefined): boolean {
  return !!token && token === ADMIN_TOKEN;
}
