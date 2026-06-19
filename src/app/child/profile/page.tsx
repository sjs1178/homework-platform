import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "./ProfileEditForm";
import PairInput from "@/app/child/dashboard/PairInput";
import Icon from "@/components/ui/Icon";
import BackButton from "@/components/ui/BackButton";

export default async function ChildProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_id")
    .eq("id", user.id)
    .single();

  return (
    <div style={{ minHeight: "100svh", background: "var(--bg)", maxWidth: 430, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 18px 14px", flexShrink: 0 }}>
        <BackButton />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>내 프로필 설정</h1>
      </div>

      <div style={{ padding: "0 20px 40px" }}>
        <ProfileEditForm
          userId={user.id}
          displayName={profile?.display_name ?? ""}
          avatarId={profile?.avatar_id ?? null}
        />

        {/* 부모님 추가 연결 */}
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "var(--faint)", letterSpacing: "0.04em", textTransform: "uppercase", margin: "4px 4px 8px" }}>
            부모님 추가 연결
          </p>
          <PairInput />
        </div>

        {/* 사용 방법 / 문의하기 링크 */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          <a
            href="/help"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", background: "#fff", borderRadius: "var(--r-card)",
              boxShadow: "var(--sh-sm)", textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 42, height: 42, borderRadius: 12, background: "#E9F4EC",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="book-open" size={22} color="#16A34A" />
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>사용 방법</span>
            </div>
            <Icon name="chevron-right" size={16} color="var(--faint)" />
          </a>
          <a
            href="mailto:contact@kiddoloop.com"
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", background: "#fff", borderRadius: "var(--r-card)",
              boxShadow: "var(--sh-sm)", textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 42, height: 42, borderRadius: 12, background: "#E9F4EC",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="mail" size={22} color="#16A34A" />
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>문의하기</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600 }}>contact@kiddoloop.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
