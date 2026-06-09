import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function NoticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: notice } = await admin
    .from("announcements")
    .select("id, title, content, created_at")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (!notice) notFound();

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 60px" }}>
      <Link
        href="/notices"
        style={{ fontSize: 13, color: "var(--green-d, #15803D)", textDecoration: "none", fontWeight: 700 }}
      >
        ← 공지사항 목록
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginTop: 16, marginBottom: 8 }}>
        {notice.title}
      </h1>
      <p style={{ fontSize: 12.5, color: "#94A3B8", marginBottom: 24 }}>
        {new Date(notice.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div
        style={{
          background: "#fff", borderRadius: 14, padding: "20px 22px",
          boxShadow: "0 1px 6px rgba(0,0,0,.06)",
          fontSize: 14, color: "#334155", lineHeight: 1.9, whiteSpace: "pre-wrap",
        }}
      >
        {notice.content}
      </div>
    </div>
  );
}
