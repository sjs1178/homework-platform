import { createClient as createAdmin } from "@supabase/supabase-js";
import PageHeader from "@/components/ui/PageHeader";
import MarkdownBody from "@/components/ui/MarkdownBody";

export const revalidate = 300;

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: doc } = await admin
    .from("legal_documents")
    .select("version, content, created_at")
    .eq("doc_type", "privacy")
    .eq("is_current", true)
    .single();

  return (
    <div style={{ minHeight: "100svh", background: "var(--bg)", maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
      <div style={{ position: "sticky", top: 0, background: "var(--bg)", zIndex: 10, paddingTop: 16 }}>
        <PageHeader title="개인정보처리방침" backHref={from} />
      </div>

      {doc && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "0 4px 16px" }}>
          <span style={{ fontSize: 12, background: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: 99, fontWeight: 700 }}>
            {doc.version}
          </span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            최종 수정: {new Date(doc.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      )}

      {doc ? (
        <MarkdownBody content={doc.content} />
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, padding: "48px 24px", boxShadow: "0 1px 6px rgba(0,0,0,.06)", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>
          개인정보처리방침을 준비 중입니다.
        </div>
      )}
    </div>
  );
}
