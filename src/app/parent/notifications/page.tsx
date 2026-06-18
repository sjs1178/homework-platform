import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createClient as createAdmin } from "@supabase/supabase-js";
import Icon from "@/components/ui/Icon";
import BottomNav from "@/components/ui/BottomNav";

interface Notification {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

export default async function ParentNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: notifications } = await admin
    .from("notifications")
    .select("id, title, body, image_url, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items: Notification[] = notifications ?? [];

  // 읽지 않은 알림을 읽음 처리
  const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
  if (unreadIds.length > 0) {
    await admin
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
  }

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
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
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

        {items.length === 0 ? (
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
            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>
              알림이 없어요
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", lineHeight: 1.6 }}>
              자녀가 숙제를 완료하거나
              <br />
              중요한 소식이 있으면 여기서 알려드릴게요
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  background: "#fff",
                  borderRadius: "var(--r-card)",
                  padding: "14px 16px",
                  boxShadow: "var(--sh-sm)",
                  borderLeft: n.is_read
                    ? "3px solid transparent"
                    : "3px solid var(--green)",
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  {n.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={n.image_url}
                      alt=""
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: "var(--green-50)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="bell" size={20} color="var(--green)" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14.5,
                        fontWeight: 800,
                        color: "var(--text)",
                        marginBottom: 3,
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {n.body}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "var(--faint)",
                        marginTop: 6,
                      }}
                    >
                      {formatDate(n.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="홈" role="parent" />
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;

  return d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}
