// 리워드 원장 공용 타입·상수·집계 헬퍼.
// 통화(게임시간/용돈)는 reward_logs.reward_type에 기록 시점에 확정된다.
//   kind 'time'  ↔ reward_type 'time'   (게임시간)
//   kind 'money' ↔ reward_type 'point'  (용돈)

export type RewardKind = "time" | "money";
export type RewardType = "time" | "point";

export function kindToType(kind: RewardKind): RewardType {
  return kind === "time" ? "time" : "point";
}

export function typeToKind(type: string): RewardKind {
  return type === "time" ? "time" : "money";
}

export function otherKind(kind: RewardKind): RewardKind {
  return kind === "time" ? "money" : "time";
}

// ── 잔액 변동 사유 ─────────────────────────────────────────────────────────
export const EARN_KINDS = ["homework", "mission", "grant", "request", "topup"] as const;
export const SPEND_KINDS = ["use", "redeem", "revoke", "correct", "unknown"] as const;

// 사용 통계에 집계되는 차감 (회수·정정·미분류는 제외)
export const USAGE_KINDS: readonly string[] = ["use", "redeem"];

export const CATEGORIES: Record<RewardKind, string[]> = {
  time: ["게임", "유튜브", "OTT", "기타"],
  money: ["간식", "문구", "게임아이템", "저축", "기부", "기타"],
};

export const CATEGORY_EMOJI: Record<string, string> = {
  게임: "🎮", 유튜브: "📺", OTT: "🍿",
  간식: "🍪", 문구: "✏️", 게임아이템: "🕹️", 저축: "🐷", 기부: "💝",
  기타: "📦",
};

export interface LedgerLog {
  type: "earn" | "spend";
  reward_type?: string | null;
  entry_kind?: string | null;
  category?: string | null;
  amount: number;
  created_at?: string;
}

function ofKind(logs: LedgerLog[], kind: RewardKind): LedgerLog[] {
  const t = kindToType(kind);
  return logs.filter((l) => (l.reward_type ?? "point") === t);
}

// 잔액 = 적립 − 차감 (사유 무관, 전부 포함)
export function balanceOf(logs: LedgerLog[], kind: RewardKind) {
  const rows = ofKind(logs, kind);
  const earned = rows.filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
  const spent = rows.filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);
  return { earned, spent, balance: earned - spent };
}

// 사용량 = 실제 소비만 (use/redeem). 회수·정정·미분류 제외
export function usageLogs(logs: LedgerLog[], kind: RewardKind): LedgerLog[] {
  return ofKind(logs, kind).filter(
    (l) => l.type === "spend" && USAGE_KINDS.includes(l.entry_kind ?? "unknown")
  );
}

export function usageTotal(logs: LedgerLog[], kind: RewardKind): number {
  return usageLogs(logs, kind).reduce((s, l) => s + l.amount, 0);
}

// 카테고리별 사용 합계 (구성비 차트용). 미분류는 '미분류'로 묶음
export function usageByCategory(logs: LedgerLog[], kind: RewardKind): { category: string; amount: number }[] {
  const map: Record<string, number> = {};
  for (const l of usageLogs(logs, kind)) {
    const c = l.category?.trim() || "미분류";
    map[c] = (map[c] ?? 0) + l.amount;
  }
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// 날짜(KST)별 사용 합계
export function usageByDate(logs: LedgerLog[], kind: RewardKind): Record<string, number> {
  const map: Record<string, number> = {};
  for (const l of usageLogs(logs, kind)) {
    if (!l.created_at) continue;
    const d = new Date(l.created_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    map[d] = (map[d] ?? 0) + l.amount;
  }
  return map;
}

export interface CurrencyConfig {
  kind: RewardKind;
  name: string;
  unit: string;
}

// reward_settings 행에서 활성 통화 목록을 만든다 (주 통화가 항상 첫 번째)
export function currenciesFrom(settings: {
  primary_kind?: string | null;
  secondary_enabled?: boolean | null;
  time_reward_name?: string | null;
  time_reward_unit?: string | null;
  point_reward_name?: string | null;
  point_reward_unit?: string | null;
} | null): CurrencyConfig[] {
  const time: CurrencyConfig = {
    kind: "time",
    name: settings?.time_reward_name || "게임시간",
    unit: settings?.time_reward_unit || "분",
  };
  const money: CurrencyConfig = {
    kind: "money",
    name: settings?.point_reward_name || "리워드",
    unit: settings?.point_reward_unit || "P",
  };
  const primary: RewardKind = settings?.primary_kind === "time" ? "time" : "money";
  const list = primary === "time" ? [time, money] : [money, time];
  return settings?.secondary_enabled ? list : [list[0]];
}
