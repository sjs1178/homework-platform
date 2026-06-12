import { createClient as createAdmin } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import MarkdownBody from "@/components/ui/MarkdownBody";

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
    <div style={{ minHeight: "100svh", background: "var(--bg)", maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ position: "sticky", top: 0, background: "var(--bg)", zIndex: 10, paddingTop: 16 }}>
        <PageHeader title="공지사항" />
      </div>

      <h2 style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", margin: "0 4px 8px" }}>
        {notice.title}
      </h2>
      <p style={{ fontSize: 12.5, color: "#94A3B8", margin: "0 4px 20px" }}>
        {new Date(notice.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <MarkdownBody content={notice.content} />
    </div>
  );
}
