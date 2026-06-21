import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAvatar } from "@/lib/avatars";
import { getEffectiveGradeLabel } from "@/lib/grade";
import BottomNav from "@/components/ui/BottomNav";
import Icon from "@/components/ui/Icon";
import { LogoLockup } from "@/components/ui/Logo";
import PairInput from "./PairInput";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const SUBJECT_COLORS: Record<string, [string, string]> = {
  수학: ["#EEF2FF", "#4F46E5"],
  국어: ["#FEF2F2", "#E11D48"],
  영어: ["#ECFEFF", "#0891B2"],
};

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

export default async function ChildDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profileRes, pairsRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("pair_id, display_name, avatar_id, grade, grade_school_year")
      .eq("id", user.id)
      .single(),
    // 다:다 지원: 자녀가 연결된 모든 페어 조회
    supabase
      .from("pairs")
      .select("id")
      .eq("child_id", user.id)
      .eq("status", "active"),
  ]);
  const profile = profileRes.data;
  const allPairIds = (pairsRes.data ?? []).map((p) => p.id);
  const hasPair = allPairIds.length > 0;

  const avatar = getAvatar(profile?.avatar_id);
  const gradeLabel = getEffectiveGradeLabel(
    profile?.grade as number | null,
    profile?.grade_school_year as number | null
  );
  const childName = profile?.display_name ?? "자녀";
  const todayIdx = (new Date().getDay() + 6) % 7;
  const todayStr = new Date().toISOString().split("T")[0];

  // ── 페어링된 경우에만 데이터 로드 ────────────────────
  let weeklyDots: { hasHomework: boolean; done: boolean }[] = Array(7).fill({ hasHomework: false, done: false });
  let weeklyDone = 0;
  let rewardBalance = 0;
  let rewardUnit = "P";
  let nextHw: { id: string; subject: string; description: string; due_date: string; due_time: string | null } | null = null;
  let missionDaily = { total: 0, done: 0 };

  if (hasPair) {
    const { monday, sunday } = getWeekRange();
    const mondayStr = monday.toISOString().split("T")[0];
    const sundayStr = sunday.toISOString().split("T")[0];
    // primary pair_id (리워드 설정용)
    const primaryPairId = profile?.pair_id ?? allPairIds[0];

    const [weekRes, nextRes, logsRes, settingsRes] = await Promise.all([
      supabase
        .from("homeworks")
        .select("due_date, is_completed")
        .in("pair_id", allPairIds)
        .gte("due_date", mondayStr)
        .lte("due_date", sundayStr),
      supabase
        .from("homeworks")
        .select("id, subject, description, due_date, due_time")
        .in("pair_id", allPairIds)
        .eq("is_completed", false)
        .gte("due_date", todayStr)
        .order("due_date")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("reward_logs")
        .select("type, amount")
        .in("pair_id", allPairIds)
        .eq("child_id", user.id),
      supabase
        .from("reward_settings")
        .select("point_reward_unit")
        .eq("pair_id", primaryPairId)
        .single(),
    ]);

    const weekHws = weekRes.data ?? [];
    const completedDates = new Set(weekHws.filter((h) => h.is_completed).map((h) => h.due_date));
    const hasDates = new Set(weekHws.map((h) => h.due_date));

    weeklyDots = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      return { hasHomework: hasDates.has(ds), done: completedDates.has(ds) };
    });
    weeklyDone = weeklyDots.filter((d) => d.done).length;

    const logs = logsRes.data ?? [];
    rewardBalance = logs.reduce((s, l) => s + (l.type === "earn" ? l.amount : -l.amount), 0);
    rewardUnit = settingsRes.data?.point_reward_unit ?? "P";
    nextHw = nextRes.data ?? null;

    // 데일리 미션 진행률
    const todayHws = weekHws.filter((h) => h.due_date === todayStr);
    missionDaily = {
      total: todayHws.length,
      done: todayHws.filter((h) => h.is_completed).length,
    };
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
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 2px",
          }}
        >
          <LogoLockup height={26} badge="child" />
          <a
            href="/child/profile"
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#fff", boxShadow: "var(--sh-sm)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, textDecoration: "none", fontSize: 20,
            }}
          >
            {avatar.emoji}
          </a>
        </div>

        {!hasPair ? (
          /* ── 페어링 전 ── */
          <div>
            <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{avatar.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                {childName}님, 안녕하세요!
              </div>
              <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600 }}>
                부모님 초대 코드를 입력해 연결해요
              </p>
            </div>
            <PairInput />
          </div>
        ) : (
          /* ── 페어링 후 ── */
          <>
            {/* 히어로 카드 */}
            <div
              style={{
                borderRadius: 24, padding: "19px 19px 17px",
                background: "linear-gradient(150deg,#1FB259 0%,#15803D 100%)",
                color: "#fff", boxShadow: "var(--sh-hero-green)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)", pointerEvents: "none" }} />

              {/* 프로필 + 리워드 잔액 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "rgba(255,255,255,.22)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 26, border: "2px solid rgba(255,255,255,.5)", flexShrink: 0,
                    }}
                  >
                    {avatar.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{childName}</div>
                    {gradeLabel && (
                      <div style={{ fontSize: 12.5, opacity: 0.85, fontWeight: 600, marginTop: 1, whiteSpace: "nowrap" }}>
                        {gradeLabel}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    background: "rgba(255,193,7,.95)", color: "#7c4a02",
                    padding: "7px 12px", borderRadius: 999,
                    fontSize: 13.5, fontWeight: 800,
                    boxShadow: "0 4px 10px -3px rgba(0,0,0,.25)", whiteSpace: "nowrap",
                  }}
                >
                  <Icon name="star" size={15} color="#7c4a02" stroke={0} fill="#7c4a02" />
                  {rewardBalance.toLocaleString()}{rewardUnit}
                </div>
              </div>

              {/* 주간 현황 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, position: "relative" }}>
                <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.92, whiteSpace: "nowrap" }}>
                  이번 주 숙제
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, whiteSpace: "nowrap" }}>
                  {weeklyDone}일 완료
                </span>
              </div>

              {/* 주간 도트 */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, position: "relative" }}>
                {DAY_LABELS.map((label, i) => {
                  const { hasHomework, done } = weeklyDots[i];
                  const isToday = i === todayIdx;
                  return (
                    <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, opacity: isToday ? 1 : 0.7 }}>{label}</span>
                      <span
                        style={{
                          width: 26, height: 26, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: done ? "#fff" : hasHomework ? "rgba(255,193,7,.55)" : isToday ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.12)",
                          border: isToday && !done ? "2px dashed rgba(255,255,255,.8)" : "none",
                        }}
                      >
                        {done && <Icon name="check" size={15} color="#16A34A" stroke={3} />}
                        {!done && hasHomework && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FBBF24", display: "block" }} />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 미션 배너 */}
            <a
              href="/child/missions"
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
                border: missionDaily.total > 0 && missionDaily.done >= missionDaily.total
                  ? "1.5px solid var(--green)"
                  : "1.5px solid transparent",
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
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>오늘의 미션</div>
                <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 1 }}>
                  {missionDaily.total === 0
                    ? "오늘 숙제가 없어요"
                    : missionDaily.done >= missionDaily.total
                      ? "달성 완료! 리워드를 받으세요"
                      : `${missionDaily.done}/${missionDaily.total} 완료`}
                </div>
              </div>
              <Icon name="chevron-right" size={18} color="var(--faint)" stroke={2} />
            </a>

            {/* 다음 숙제 카드 */}
            <div style={{ margin: "20px 4px 11px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>다음 숙제</h2>
            </div>

            {nextHw ? (
              <a
                href="/child/calendar"
                style={{
                  display: "block", textDecoration: "none",
                  background: "#fff", borderRadius: "var(--r-card)",
                  padding: 15, marginBottom: 16,
                  border: "1.5px solid var(--green-200)",
                  boxShadow: "var(--sh-md)",
                }}
              >
                <div style={{ display: "flex", gap: 13 }}>
                  <span
                    style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: "var(--green-50)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    <Icon name="book-open" size={24} color="var(--green)" stroke={2} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                      {(() => {
                        const [bg, color] = SUBJECT_COLORS[nextHw.subject] ?? ["var(--green-50)", "var(--green-d)"];
                        return (
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 8, background: bg, color, whiteSpace: "nowrap" }}>
                            {nextHw.subject}
                          </span>
                        );
                      })()}
                      <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {nextHw.due_date}
                        {nextHw.due_time && ` · ${nextHw.due_time.slice(0, 5)}`}
                      </span>
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)" }}>
                      {nextHw.description}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    width: "100%", height: 42, borderRadius: 12,
                    background: "var(--green)", color: "#fff",
                    fontWeight: 800, fontSize: 14, marginTop: 13,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  캘린더에서 완료하기
                  <Icon name="arrow-right" size={16} stroke={2.4} color="#fff" />
                </div>
              </a>
            ) : (
              <div
                style={{
                  background: "#fff", borderRadius: "var(--r-card)",
                  padding: "28px 16px", textAlign: "center",
                  boxShadow: "var(--sh-sm)", marginBottom: 16,
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 20, background: "#E9F4EC",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                }}>
                  <Icon name="party-popper" size={34} color="#9DB3A6" stroke={1.9} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                  남은 숙제가 없어요!
                </p>
                <p style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, marginTop: 4 }}>
                  오늘 할 일을 모두 마쳤어요
                </p>
              </div>
            )}

            {/* 퀵 액션 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              {([
                ["calendar", "숙제 캘린더", "linear-gradient(140deg,#34D399,#16A34A)", "/child/calendar"],
                ["gift", "내 리워드", "linear-gradient(140deg,#FBBF24,#F59E0B)", "/child/rewards"],
              ] as const).map(([icon, label, grad, href]) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    padding: "15px 8px 13px", borderRadius: 18,
                    background: "#fff", boxShadow: "var(--sh-md)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 9,
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      width: 46, height: 46, borderRadius: 14, background: grad,
                      display: "flex", alignItems: "center", justifyContent: "center",
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

          </>
        )}
      </div>

      <BottomNav active="홈" role="child" />
    </div>
  );
}
