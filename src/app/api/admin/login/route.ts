import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_TOKEN,
  ADMIN_EMAIL,
  checkAdminCredentials,
} from "@/lib/admin-auth";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { username, password, supabaseToken } = await req.json();

  let valid = false;

  // username/password auth
  if (username && password) {
    valid = checkAdminCredentials(username, password);
  }

  // Supabase email auto-login (when already signed in as admin email)
  if (!valid && supabaseToken) {
    try {
      const admin = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data } = await admin.auth.getUser(supabaseToken);
      valid = data.user?.email === ADMIN_EMAIL;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, ADMIN_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
