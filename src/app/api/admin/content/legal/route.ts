import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { ADMIN_COOKIE, ADMIN_TOKEN } from "@/lib/admin-auth";

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN;
}

// GET — list all versions for a doc_type, or current only
// ?type=terms|privacy&current=true
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const docType = url.searchParams.get("type");
  const currentOnly = url.searchParams.get("current") === "true";

  const admin = adminClient();

  let query = admin
    .from("legal_documents")
    .select("id, doc_type, version, is_current, edited_by, created_at, content")
    .order("created_at", { ascending: false });

  if (docType) query = query.eq("doc_type", docType);
  if (currentOnly) query = query.eq("is_current", true);

  const { data } = await query;
  return NextResponse.json({ documents: data ?? [] });
}

// POST — create new version (marks previous as not current)
export async function POST(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { doc_type, content, version, edited_by } = await req.json();
  if (!doc_type || !content || !version)
    return NextResponse.json({ error: "doc_type, content, version required" }, { status: 400 });

  const admin = adminClient();

  // Mark all previous versions as not current
  await admin
    .from("legal_documents")
    .update({ is_current: false })
    .eq("doc_type", doc_type);

  // Insert new current version
  const { data, error } = await admin
    .from("legal_documents")
    .insert({ doc_type, content, version, is_current: true, edited_by: edited_by ?? "admin" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data });
}
