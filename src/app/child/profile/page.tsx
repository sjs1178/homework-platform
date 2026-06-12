import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "./ProfileEditForm";

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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/child/dashboard" className="text-gray-400 hover:text-gray-600">←</a>
          <h1 className="text-xl font-bold">내 프로필 설정</h1>
        </div>
        <ProfileEditForm
          userId={user.id}
          displayName={profile?.display_name ?? ""}
          avatarId={profile?.avatar_id ?? null}
        />

        {/* 사용 방법 링크 */}
        <div style={{ marginTop: 24 }}>
          <a
            href="/help"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 1px 4px rgba(0,0,0,.06)",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>📖</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>사용 방법</span>
            </div>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>▶</span>
          </a>
        </div>
      </div>
    </main>
  );
}
