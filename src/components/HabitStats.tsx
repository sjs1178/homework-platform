"use client";

import Icon from "@/components/ui/Icon";
import {
  usageLogs, usageByCategory, usageByDate, CATEGORY_EMOJI,
  type CurrencyConfig, type LedgerLog,
} from "@/lib/reward";
import { getKSTWeekRange, getKSTYearMonth, toKSTDateString } from "@/lib/date";

interface GoalRow {
  daily_limit: number | null; weekly_limit: number | null;
  monthly_budget: number | null; saving_goal: number | null;
}

interface Props {
  currency: CurrencyConfig;
  logs: LedgerLog[];
  goal?: GoalRow;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: 16, boxShadow: "var(--sh-md)", marginBottom: 12 }}>
      {children}
    </div>
  );
}

export default function HabitStats({ currency, logs, goal }: Props) {
  const isTime = currency.kind === "time";
  const unit = currency.unit;

  const { mondayStr, sundayStr } = getKSTWeekRange();
  const { year, month } = getKSTYearMonth();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  const uses = usageLogs(logs, currency.kind);
  const byDate = usageByDate(logs, currency.kind);

  const weekUsed = Object.entries(byDate)
    .filter(([d]) => d >= mondayStr && d <= sundayStr)
    .reduce((s, [, v]) => s + v, 0);
  const monthUsed = Object.entries(byDate)
    .filter(([d]) => d.startsWith(monthPrefix))
    .reduce((s, [, v]) => s + v, 0);

  const periodUsed = isTime ? weekUsed : monthUsed;
  const limit = isTime ? goal?.weekly_limit : goal?.monthly_budget;
  const pct = limit && limit > 0 ? Math.min(100, Math.round((periodUsed / limit) * 100)) : 0;
  const over = !!(limit && periodUsed > limit);

  // 최근 14일 일별
  const days: { date: string; label: string; amount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    const ds = toKSTDateString(d);
    days.push({ date: ds, label: ds.slice(8), amount: byDate[ds] ?? 0 });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.amount));
  const dailyLimit = goal?.daily_limit ?? null;

  const cats = usageByCategory(logs, currency.kind);
  const catTotal = cats.reduce((s, c) => s + c.amount, 0);

  // 저축률 (용돈)
  const saved = cats.find((c) => c.category === "저축")?.amount ?? 0;
  const savingRate = catTotal > 0 ? Math.round((saved / catTotal) * 100) : 0;

  const unclassified = uses.filter((l) => !l.category).length;

  if (uses.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "28px 8px" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <Icon name={isTime ? "clock" : "gift"} size={30} color="#9DB3A6" stroke={1.9} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
            아직 사용 기록이 없어요
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, lineHeight: 1.6 }}>
            리워드 화면에서 {isTime ? "사용한 시간" : "쓴 돈"}을 기록하면
            <br />여기에 통계가 쌓여요
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* 기간 요약 + 목표 대비 */}
      <Card>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>
          {isTime ? "이번 주 사용" : "이번 달 사용"}
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: over ? "#E11D48" : "var(--text)" }}>
            {periodUsed.toLocaleString()}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)" }}>{unit}</span>
          {limit && limit > 0 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--faint)", marginLeft: "auto" }}>
              목표 {limit.toLocaleString()}{unit}
            </span>
          )}
        </div>

        {limit && limit > 0 ? (
          <>
            <div style={{ height: 10, borderRadius: 999, background: "var(--line)", overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: over ? "#F2607D" : "var(--green)" }} />
            </div>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: over ? "#E11D48" : "var(--green-d)" }}>
              {over
                ? `목표보다 ${(periodUsed - limit).toLocaleString()}${unit} 더 썼어요`
                : `목표까지 ${(limit - periodUsed).toLocaleString()}${unit} 남았어요`}
            </p>
          </>
        ) : (
          <p style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600 }}>
            설정에서 {isTime ? "주간 한도" : "월 예산"}를 정하면 목표 대비로 볼 수 있어요
          </p>
        )}

        {!isTime && catTotal > 0 && (
          <div style={{ display: "flex", gap: 14, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)" }}>저축</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "var(--green-d)" }}>{saved.toLocaleString()}{unit}</p>
            </div>
            <div style={{ width: 1, background: "var(--line)" }} />
            <div>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)" }}>저축률</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "var(--green-d)" }}>{savingRate}%</p>
            </div>
            {goal?.saving_goal ? (
              <>
                <div style={{ width: 1, background: "var(--line)" }} />
                <div>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)" }}>저축 목표</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "var(--muted)" }}>{goal.saving_goal.toLocaleString()}{unit}</p>
                </div>
              </>
            ) : null}
          </div>
        )}
      </Card>

      {/* 최근 14일 */}
      <Card>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>최근 14일</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 110 }}>
          {days.map((d) => {
            const h = Math.round((d.amount / maxDay) * 88);
            const exceed = !!(dailyLimit && d.amount > dailyLimit);
            return (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  title={`${d.date} · ${d.amount}${unit}`}
                  style={{
                    width: "100%", height: Math.max(3, h), borderRadius: 4,
                    background: d.amount === 0 ? "var(--line)" : exceed ? "#F2607D" : "var(--green)",
                  }}
                />
                <span style={{ fontSize: 9.5, color: "var(--faint)", fontWeight: 600 }}>{d.label}</span>
              </div>
            );
          })}
        </div>
        {dailyLimit ? (
          <p style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, marginTop: 10 }}>
            빨간 막대는 하루 한도({dailyLimit.toLocaleString()}{unit})를 넘은 날이에요
          </p>
        ) : null}
      </Card>

      {/* 카테고리 구성비 */}
      <Card>
        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>무엇에 썼나</p>
        {cats.map((c) => {
          const p = catTotal > 0 ? Math.round((c.amount / catTotal) * 100) : 0;
          return (
            <div key={c.category} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{CATEGORY_EMOJI[c.category] ?? "📦"}</span>{c.category}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-soft)", whiteSpace: "nowrap" }}>
                  {c.amount.toLocaleString()}{unit} · {p}%
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
                <div style={{ width: `${p}%`, height: "100%", borderRadius: 999, background: c.category === "저축" ? "var(--green)" : "var(--amber)" }} />
              </div>
            </div>
          );
        })}
        {unclassified > 0 && (
          <p style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, marginTop: 4 }}>
            분류 없이 기록된 {unclassified}건은 &lsquo;미분류&rsquo;로 표시돼요
          </p>
        )}
      </Card>
    </>
  );
}
