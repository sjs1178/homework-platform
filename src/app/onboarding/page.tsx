import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import OnboardingFlow from "./OnboardingFlow";
import { KiddoloopAppicon } from "@/components/ui/Logo";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 이미 온보딩 완료된 경우
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role, consent_at")
    .eq("id", user.id)
    .single();

  if (profile?.role && profile?.consent_at) {
    redirect(`/${profile.role}/dashboard`);
  }

  // 미성년자 승인 대기 중인 경우
  const adminClient = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: pendingApproval } = await adminClient
    .from("pending_approvals")
    .select("id, child_name, child_birthday, approval_code, expires_at, status")
    .eq("child_auth_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 승인 대기 중이면 대기 화면 표시
  if (pendingApproval) {
    const isExpired = new Date(pendingApproval.expires_at) < new Date();
    return (
      <div
        style={{
          minHeight: "100svh",
          background: "linear-gradient(160deg, #F0FDF4 0%, #FAF9F5 60%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "56px 20px 40px",
          maxWidth: 430,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <KiddoloopAppicon size={72} />
        <div style={{ marginTop: 16, fontSize: 22, fontWeight: 800, color: "var(--text)" }}>
          kiddoloop
        </div>
        <div style={{ marginTop: 32, fontSize: 48 }}>{isExpired ? "⏰" : "⏳"}</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 16, marginBottom: 8 }}>
          {isExpired ? "승인 요청이 만료되었습니다" : "부모님의 승인을 기다리고 있어요"}
        </h2>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, lineHeight: 1.7, marginBottom: 24 }}>
          {isExpired
            ? "7일이 지나 만료되었습니다. 다시 요청해주세요."
            : "부모님이 kiddoloop에 가입 후 설정 화면에서 승인해주시면 자동으로 연결됩니다."}
        </p>
        {!isExpired && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "20px",
              boxShadow: "0 4px 20px -4px rgba(0,0,0,.10)",
              width: "100%",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>
              승인 코드 (부모님께 알려주세요)
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "0.14em", color: "var(--green-d)" }}>
              {pendingApproval.approval_code}
            </div>
            <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8, fontWeight: 600 }}>
              만료: {new Date(pendingApproval.expires_at).toLocaleDateString("ko-KR")}
            </div>
          </div>
        )}
        {isExpired && (
          <a
            href="/onboarding?reset=1"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              borderRadius: 16,
              background: "var(--green)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            다시 요청하기
          </a>
        )}
      </div>
    );
  }

  return (
    <OnboardingFlow
      userName={user.user_metadata?.full_name ?? user.email ?? ""}
      userEmail={user.email ?? ""}
    />
  );
}
