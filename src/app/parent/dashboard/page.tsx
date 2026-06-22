import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getAvatar } from "@/lib/avatars";
import { getEffectiveGradeLabel } from "@/lib/grade";
import { toKSTDateString, getKSTWeekRange, getKSTWeekDates } from "@/lib/date";
import ChildCarousel, { type ChildData } from "./ChildCarousel";
import TodayHomeworkList from "./TodayHomeworkList";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import Icon from "@/components/ui/Icon";
import { LogoLockup } from "@/components/ui/Logo";

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
  const childIds = connectedPairs.map((p) => p.child_id!);
  const hasChildren = connectedPairs.length > 0;

  // 각 자녀에 연결된 모든 페어 조회 (다른 부모 포함)
  let allPairIds: string[] = connectedPairs.map((p) => p.id);
  let childPairMap: Record<string, string[]> = {};
  connectedPairs.forEach((p) => { childPairMap[p.child_id!] = [p.id]; });

  if (childIds.length > 0) {
    const { data: allChildPairs } = await admin
      .from("pairs")
      .select("id, child_id")
      .in("child_id", childIds);
    allPairIds = [...new Set((allChildPairs ?? []).map((p) => p.id))];
    childPairMap = {};
    (allChildPairs ?? []).forEach((p) => {
      if (!childPairMap[p.child_id]) childPairMap[p.child_id] = [];
      childPairMap[p.child_id].push(p.id);
    });
  }

  let childrenData: ChildData[] = [];
  let todayHomeworks: { id: string; subject: string; description: string; due_date: string; due_time: string | null; is_completed: boolean; hasCheck: boolean; childName: string }[] = [];

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
    const { mondayStr, sundayStr } = getKSTWeekRange();

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

      // 주간 도트 (자녀의 모든 페어 통합)
      const childPairIds = childPairMap[pair.child_id!] ?? [pair.id];
      const childWeek = (weekHws ?? []).filter((h) => childPairIds.includes(h.pair_id));
      const completedDays = new Set(childWeek.filter((h) => h.is_completed).map((h) => h.due_date));
      const hwDays = new Set(childWeek.map((h) => h.due_date));
      const weekDates = getKSTWeekDates();
      const weeklyDots = weekDates.map((ds) => ({
        hasHomework: hwDays.has(ds),
        done: completedDays.has(ds),
      }));

      // 스트릭 (자녀의 모든 페어 통합)
      const pairCompleted = (allCompleted ?? [])
        .filter((h) => childPairIds.includes(h.pair_id))
        .map((h) => h.due_date);
      const completedSet = new Set(pairCompleted);
      const kstToday = new Date(toKSTDateString() + "T12:00:00Z");
      let streak = 0;
      for (let i = 1; i <= 365; i++) {
        const d = new Date(kstToday);
        d.setUTCDate(kstToday.getUTCDate() - i);
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
        weeklyDone: weeklyDots.filter((d) => d.done).length,
        weeklyDots,
        balance: earned - spent,
        unit: settingsMap[pair.id]?.point_reward_unit ?? "P",
      };
    });

    // 오늘의 숙제 (전체 자녀 통합, 모든 부모 페어 포함)
    const todayStr = toKSTDateString();
    const { data: todayHws } = await admin
      .from("homeworks")
      .select("id, pair_id, subject, description, due_date, due_time, is_completed")
      .in("pair_id", allPairIds)
      .eq("due_date", todayStr)
      .order("due_time", { ascending: true, nullsFirst: false });

    if (todayHws?.length) {
      const { data: checks } = await admin
        .from("homework_checks")
        .select("homework_id")
        .in("homework_id", todayHws.map((h) => h.id));
      const checkedIds = new Set(checks?.map((c) => c.homework_id) ?? []);

      const pairChildMap: Record<string, string> = {};
      Object.entries(childPairMap).forEach(([childId, pIds]) => {
        const name = profileMap[childId]?.display_name ?? "자녀";
        pIds.forEach((pid) => { pairChildMap[pid] = name; });
      });

      todayHomeworks = todayHws.map((h) => ({
        ...h,
        hasCheck: checkedIds.has(h.id),
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
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
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
            <Link
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
            </Link>
            <Link
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
            </Link>
          </div>
        </div>

        {/* 히어로 카드 */}
        {hasChildren ? (
          <ChildCarousel items={childrenData} />
        ) : (
          <Link
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
          </Link>
        )}

        {/* 미션 배너 */}
        {hasChildren && (
          <Link
            href="/parent/missions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background: "#fff",
              borderRadius: 16,
              boxShadow: "var(--sh-md)",
              textDecoration: "none",
              marginTop: 14,
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: "linear-gradient(140deg,#34D399,#16A34A)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="target" size={19} color="#fff" stroke={2} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>미션 관리</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 1 }}>
                미션별 리워드 설정 · 진행 현황 확인
              </div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--faint)" stroke={2} />
          </Link>
        )}

        {/* 오늘의 숙제 */}
        <TodayHomeworkList homeworks={todayHomeworks} multiChild={childrenData.length > 1} />

        {/* 퀵액션 3열 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 16 }}>
          {([
            ["square-pen", "숙제 입력", "linear-gradient(140deg,#34D399,#16A34A)", "/parent/homework/new"],
            ["gift", "리워드", "linear-gradient(140deg,#FBBF24,#F59E0B)", "/parent/rewards"],
          ] as const).map(([icon, label, grad, href]) => (
            <Link
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
            </Link>
          ))}
        </div>

        {/* 학습 통계 링크 */}
        {hasChildren && (
          <Link
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
            <Icon name="bar-chart-3" size={22} color="#16A34A" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-soft)", whiteSpace: "nowrap" }}>
              학습 통계 · 직업군 가이드
            </span>
          </Link>
        )}
      </div>

      <BottomNav active="홈" role="parent" />
    </div>
  );
}

