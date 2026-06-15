import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Icon from "@/components/ui/Icon";
import BottomNav from "@/components/ui/BottomNav";

export default async function ParentNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#F1F7F3",
        display: "flex",
        flexDirection: "column",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 22px" }}>
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 2px",
          }}
        >
          <a
            href="/parent/dashboard"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "var(--sh-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            <Icon name="arrow-left" size={19} color="var(--text-soft)" />
          </a>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
            알림
          </h1>
        </div>

        {/* 빈 상태 */}
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--r-card)",
            padding: "48px 24px",
            textAlign: "center",
            boxShadow: "var(--sh-sm)",
            marginTop: 12,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--green-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Icon name="bell" size={28} color="var(--green)" />
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            알림이 없어요
          </p>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            자녀가 숙제를 완료하거나
            <br />
            중요한 소식이 있으면 여기서 알려드릴게요
          </p>
        </div>
      </div>

      <BottomNav active="홈" role="parent" />
    </div>
  );
}
