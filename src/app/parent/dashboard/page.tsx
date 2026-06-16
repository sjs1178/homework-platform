import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getAvatar } from "@/lib/avatars";
import { getEffectiveGradeLabel } from "@/lib/grade";
import ChildCarousel, { type ChildData } from "./ChildCarousel";
import BottomNav from "@/components/ui/BottomNav";
import Icon from "@/components/ui/Icon";
import { LogoLockup } from "@/components/ui/Logo";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

export default async function ParentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 이 부모의 모든 페어 조회
  const { data: pairs } = await admin
    .from("pairs")
    .select("id, child_id")
    .eq("parent_id", user.id)
    .order("created_at");

  const connectedPairs = (pairs ?? []).filter((p) => p.child_id);
  const allPairIds = connectedPairs.map((p) => p.id);
  const childIds = connectedPairs.map((p) => p.child_id!);
  const hasChildren = connectedPairs.length > 0;

  let childrenData: ChildData[] = [];
  let pendingChecks: { id: string; subject: string; description: string; due_date: string; checked: boolean; childName: string }[] = [];

  if (hasChildren) {
    // 자녀 프로필 배치 조회
    const { data: childProfiles } = await admin
      .from("user_profiles")
      .select("id, display_name, avatar_id, grade, grade_school_year")
      .in("id", childIds);

    const profileMap = Object.fromEntries(
      (childProfiles ?? []).map((p) => [p.id, p])
    );

    // 주간 숙제 배치 조회
    const { monday, sunday } = getWeekRange();
    const mondayStr = monday.toISOString().split("T")[0];
    const sundayStr = sunday.toISOString().split("T")[0];

    const { data: weekHws } = await admin
      .from("homeworks")
      .select("pair_id, due_date, is_completed")
      .in("pair_id", allPairIds)
      .gte("due_date", mondayStr)
      .lte("due_date", sundayStr);

    // 스트릭용 완료 날짜 배치 조회
    const { data: allCompleted } = await admin
      .from("homeworks")
      .select("pair_id, due_date")
      .in("pair_id", allPairIds)
      .eq("is_completed", true)
      .order("due_date", { ascending: false });

    // 리워드 배치 조회
    const { data: allLogs } = await admin
      .from("reward_logs")
      .select("pair_id, type, amount")
      .in("pair_id", allPairIds);

    const { data: allSettings } = await admin
      .from("reward_settings")
      .select("pair_id, point_reward_unit")
      .in("pair_id", allPairIds);

    const settingsMap = Object.fromEntries(
      (allSettings ?? []).map((s) => [s.pair_id, s])
    );

    // 각 자녀별 데이터 구성
    childrenData = connectedPairs.map((pair) => {
      const cp = profileMap[pair.child_id!];
      const avatar = getAvatar(cp?.avatar_id ?? null);
      const gradeLabel = getEffectiveGradeLabel(
        cp?.grade as number | null,
        cp?.grade_school_year as number | null
      ) ?? "";

      // 주간 도트
      const pairWeek = (weekHws ?? []).filter((h) => h.pair_id === pair.id);
      const completedDays = new Set(pairWeek.filter((h) => h.is_completed).map((h) => h.due_date));
      const weeklyDots = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return completedDays.has(d.toISOString().split("T")[0]);
      });

      // 스트릭
      const pairCompleted = (allCompleted ?? [])
        .filter((h) => h.pair_id === pair.id)
        .map((h) => h.due_date);
      const completedSet = new Set(pairCompleted);
      const today = new Date();
      let streak = 0;
      for (let i = 1; i <= 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (completedSet.has(d.toISOString().split("T")[0])) streak++;
        else break;
      }

      // 리워드
      const pairLogs = (allLogs ?? []).filter((l) => l.pair_id === pair.id);
      const earned = pairLogs.filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
      const spent = pairLogs.filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);

      return {
        pairId: pair.id,
        childName: cp?.display_name ?? "자녀",
        childAvatar: avatar.emoji,
        gradeLabel,
        streak,
        weeklyDone: weeklyDots.filter(Boolean).length,
        weeklyDots,
        balance: earned - spent,
        unit: settingsMap[pair.id]?.point_reward_unit ?? "P",
      };
    });

    // 검사 대기 숙제 (전체 자녀 통합)
    const { data: completedHws } = await admin
      .from("homeworks")
      .select("id, pair_id, subject, description, due_date")
      .in("pair_id", allPairIds)
      .eq("is_completed", true)
      .order("due_date", { ascending: false })
      .limit(20);

    if (completedHws?.length) {
      const { data: checks } = await admin
        .from("homework_checks")
        .select("homework_id")
        .in("homework_id", completedHws.map((h) => h.id));
      const checkedIds = new Set(checks?.map((c) => c.homework_id) ?? []);

      const pairChildMap = Object.fromEntries(
        connectedPairs.map((p) => [p.id, profileMap[p.child_id!]?.display_name ?? "자녀"])
      );

      pendingChecks = completedHws
        .filter((h) => !checkedIds.has(h.id))
        .map((h) => ({
          ...h,
          checked: false,
          childName: pairChildMap[h.pair_id] ?? "자녀",
        }));
    }
  }

  // 읽지 않은 알림 수
  const { count: unreadCount } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

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
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0 20px 22px", WebkitOverflowScrolling: "touch" }}>
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 2px",
          }}
        >
          <LogoLockup height={26} badge="parent" />
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href="/parent/notifications"
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
                position: "relative",
              }}
            >
              <Icon name="bell" size={19} color="var(--text-soft)" />
              {(unreadCount ?? 0) > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: "#E11D48",
                    border: "2px solid #fff",
                  }}
                />
              )}
            </a>
            <a
              href="/parent/settings"
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
              }}
            >
              <Icon name="settings" size={19} color="var(--text-soft)" />
            </a>
          </div>
        </div>

        {/* 히어로 카드 */}
        {hasChildren ? (
          <ChildCarousel items={childrenData} />
        ) : (
          <a
            href="/parent/settings"
            style={{
              display: "block",
              borderRadius: 24,
              padding: "20px",
              background: "linear-gradient(150deg,#1FB259 0%,#15803D 100%)",
              color: "#fff",
              boxShadow: "var(--sh-hero-green)",
              textDecoration: "none",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.9 }}>
              자녀 계정을 연결해보세요
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6, fontWeight: 600 }}>
              설정 → 자녀 관리에서 초대 코드로 연결 →
            </div>
          </a>
        )}

        {/* 검사 기다리는 숙제 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "22px 4px 11px",
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>
            검사 기다리는 숙제
          </h2>
          {pendingChecks.length > 0 && (
            <span
              style={{
                background: "var(--amber-100)",
                color: "var(--amber-d)",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {pendingChecks.length}개
            </span>
          )}
        </div>

        {pendingChecks.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--r-card)",
              padding: "28px 16px",
              textAlign: "center",
              boxShadow: "var(--sh-sm)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>
              검사할 숙제가 없어요
            </p>
          </div>
        ) : (
          pendingChecks.slice(0, 3).map((hw) => (
            <a
              key={hw.id}
              href={`/parent/homework/check?id=${hw.id}`}
              style={{
                display: "block",
                background: "#fff",
                borderRadius: "var(--r-card)",
                padding: 15,
                marginBottom: 12,
                border: "1.5px solid var(--green-200)",
                boxShadow: "var(--sh-md)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", gap: 13 }}>
                <span
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: "var(--green-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="clipboard-check" size={24} color="var(--green)" stroke={2} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                    <SubjectTag subject={hw.subject} />
                    {childrenData.length > 1 && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--green-d)", background: "var(--green-50)", padding: "2px 7px", borderRadius: 6 }}>
                        {hw.childName}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {hw.due_date}
                    </span>
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>
                    {hw.description}
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 14,
                  border: "none",
                  background: "var(--green)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  marginTop: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                지금 검사하기
                <Icon name="arrow-right" size={18} stroke={2.4} color="#fff" />
              </div>
            </a>
          ))
        )}

        {/* 퀵액션 2열 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 16 }}>
          {([
            ["square-pen", "숙제 입력", "linear-gradient(140deg,#34D399,#16A34A)", "/parent/homework/new"],
            ["gift", "리워드", "linear-gradient(140deg,#FBBF24,#F59E0B)", "/parent/rewards"],
          ] as const).map(([icon, label, grad, href]) => (
            <a
              key={label}
              href={href}
              style={{
                padding: "15px 8px 13px",
                borderRadius: 18,
                background: "#fff",
                boxShadow: "var(--sh-md)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 9,
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: grad,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 5px 12px -4px rgba(16,40,28,.35)",
                }}
              >
                <Icon name={icon} size={22} color="#fff" stroke={2.2} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-soft)", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </a>
          ))}
        </div>

        {/* 학습 통계 링크 */}
        {hasChildren && (
          <a
            href="/parent/stats"
            style={{
              marginTop: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "15px",
              background: "#fff",
              borderRadius: 18,
              boxShadow: "var(--sh-md)",
              textDecoration: "none",
            }}
          >
            <span style={{ fontSize: 20 }}>📊</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-soft)", whiteSpace: "nowrap" }}>
              학습 통계 · 직업군 가이드
            </span>
          </a>
        )}
      </div>

      <BottomNav active="홈" role="parent" />
    </div>
  );
}

function SubjectTag({ subject }: { subject: string }) {
  const map: Record<string, [string, string]> = {
    수학: ["#EEF2FF", "#4F46E5"],
    국어: ["#FEF2F2", "#E11D48"],
    영어: ["#ECFEFF", "#0891B2"],
  };
  const [bg, color] = map[subject] ?? ["var(--green-50)", "var(--green-d)"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontWeight: 700,
        fontSize: 12,
        padding: "4px 9px",
        borderRadius: 8,
        background: bg,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {subject}
    </span>
  );
}
