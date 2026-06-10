import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAvatar } from "@/lib/avatars";
import { getEffectiveGradeLabel } from "@/lib/grade";
import DashboardHero from "./DashboardHero";
import BottomNav from "@/components/ui/BottomNav";
import Icon from "@/components/ui/Icon";
import { LogoLockup } from "@/components/ui/Logo";

function getWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
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

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id, display_name")
    .eq("id", user.id)
    .single();

  let pair = null;
  let childProfile: { display_name?: string; avatar_id?: string; grade?: number; grade_school_year?: number } | null = null;
  let completedHomeworks: { id: string; subject: string; description: string; due_date: string; checked: boolean }[] = [];
  let weeklyDots: boolean[] = [false, false, false, false, false, false, false];
  let streak = 0;
  let rewardBalance = 0;
  let rewardUnit = "P";

  if (profile?.pair_id) {
    const { data } = await supabase.from("pairs").select("*").eq("id", profile.pair_id).single();
    pair = data;

    // 리워드 잔액 + 단위
    const { data: rwSettings } = await supabase
      .from("reward_settings")
      .select("point_reward_unit")
      .eq("pair_id", profile.pair_id)
      .single();
    rewardUnit = rwSettings?.point_reward_unit ?? "P";

    const { data: rwLogs } = await supabase
      .from("reward_logs")
      .select("type, amount")
      .eq("pair_id", profile.pair_id);
    const earned = (rwLogs ?? []).filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
    const spent = (rwLogs ?? []).filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);
    rewardBalance = earned - spent;

    if (pair?.child_id) {
      const { data: cp } = await supabase
        .from("user_profiles")
        .select("display_name, avatar_id, grade, grade_school_year")
        .eq("id", pair.child_id)
        .single();
      childProfile = cp;

      // 이번 주 완료 현황
      const { monday, sunday } = getWeekRange();
      const { data: weekHws } = await supabase
        .from("homeworks")
        .select("due_date, is_completed")
        .eq("pair_id", profile.pair_id)
        .gte("due_date", monday.toISOString().split("T")[0])
        .lte("due_date", sunday.toISOString().split("T")[0]);

      const completedDays = new Set(
        (weekHws ?? []).filter((h) => h.is_completed).map((h) => h.due_date)
      );
      weeklyDots = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return completedDays.has(d.toISOString().split("T")[0]);
      });

      // 스트릭 계산 (완료한 날 연속)
      const { data: allCompleted } = await supabase
        .from("homeworks")
        .select("due_date")
        .eq("pair_id", profile.pair_id)
        .eq("is_completed", true)
        .order("due_date", { ascending: false });

      const completedDateSet = new Set((allCompleted ?? []).map((h) => h.due_date));
      const today = new Date();
      let count = 0;
      for (let i = 1; i <= 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (completedDateSet.has(d.toISOString().split("T")[0])) count++;
        else break;
      }
      streak = count;

      // 검사 대기 숙제
      const { data: hws } = await supabase
        .from("homeworks")
        .select("id, subject, description, due_date")
        .eq("pair_id", profile.pair_id)
        .eq("is_completed", true)
        .order("due_date", { ascending: false })
        .limit(10);

      if (hws?.length) {
        const { data: checks } = await supabase
          .from("homework_checks")
          .select("homework_id")
          .in("homework_id", hws.map((h) => h.id));
        const checkedIds = new Set(checks?.map((c) => c.homework_id) ?? []);
        completedHomeworks = hws.map((h) => ({ ...h, checked: checkedIds.has(h.id) }));
      }
    }
  }

  const avatar = getAvatar(childProfile?.avatar_id ?? null);
  const gradeLabel = getEffectiveGradeLabel(childProfile?.grade ?? null, childProfile?.grade_school_year ?? null);
  const weeklyDone = weeklyDots.filter(Boolean).length;
  const pendingChecks = completedHomeworks.filter((h) => !h.checked);

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
      {/* 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 22px" }}>
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
              }}
            >
              <Icon name="bell" size={19} color="var(--text-soft)" />
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
        {pair?.child_id ? (
          <DashboardHero
            childName={childProfile?.display_name ?? "자녀"}
            childInitial={(childProfile?.display_name ?? "자")[0]}
            childAvatar={avatar.emoji}
            gradeLabel={gradeLabel ?? ""}
            streak={streak}
            weeklyDone={weeklyDone}
            weeklyDots={weeklyDots}
            balance={rewardBalance}
            unit={rewardUnit}
            pairId={profile!.pair_id!}
          />
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
        {pair?.child_id && (
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
        letterSpacing: 0,
      }}
    >
      {subject}
    </span>
  );
}
