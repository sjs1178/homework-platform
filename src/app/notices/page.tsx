import { createClient as createAdmin } from "@supabase/supabase-js";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

export const revalidate = 60;

export default async function NoticesPage() {
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: notices } = await admin
    .from("announcements")
    .select("id, title, content, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div style={{ minHeight: "100svh", background: "var(--bg)", maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ position: "sticky", top: 0, background: "var(--bg)", zIndex: 10, paddingTop: 16 }}>
        <PageHeader title="공지사항" />
      </div>

      {(notices ?? []).length === 0 ? (
        <p style={{ color: "#94A3B8", textAlign: "center", padding: "48px 0" }}>공지사항이 없습니다.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(notices ?? []).map((n) => (
            <Link
              key={n.id}
              href={`/notices/${n.id}`}
              style={{
                display: "block",
                background: "#fff",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 6px rgba(0,0,0,.06)",
                textDecoration: "none",
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 5 }}>{n.title}</p>
              <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                {n.content.slice(0, 100)}{n.content.length > 100 ? "…" : ""}
              </p>
              <p style={{ fontSize: 11.5, color: "#CBD5E1", marginTop: 8 }}>
                {new Date(n.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
