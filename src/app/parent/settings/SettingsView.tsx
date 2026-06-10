"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GRADES, currentSchoolYear } from "@/lib/grade";
import Icon from "@/components/ui/Icon";
import {
  type AiProvider,
  AI_PROVIDER_LABELS,
  AI_PROVIDER_PLACEHOLDERS,
  getStoredAiToken,
  storeAiToken,
  clearStoredAiToken,
} from "@/lib/ai-token";

interface Pair {
  id: string;
  invite_code: string;
  pair_name: string | null;
  child_id: string | null;
  childName: string | null;
  childAvatar: string | null;
  childGrade: string;
}

interface Props {
  parentId: string;
  displayName: string;
  pairs: Pair[];
  pairId: string | null;
  rewardName: string;
  rewardUnit: string;
}

const SCHOOL_LEVELS = ["초등", "중등", "고등"] as const;

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 800, color: "var(--faint)", letterSpacing: "0.04em", textTransform: "uppercase", margin: "20px 4px 8px" }}>
      {children}
    </p>
  );
}

function SettingRow({
  icon, label, value, onClick, danger, disabled, rightEl,
}: {
  icon: string;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  rightEl?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", background: "none", border: "none", cursor: onClick ? "pointer" : "default",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center",
            justifyContent: "center", background: danger ? "#FEF2F2" : "var(--green-50)", flexShrink: 0,
          }}
        >
          <Icon name={icon} size={18} color={danger ? "#E11D48" : "var(--green-d)"} stroke={2} />
        </span>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: danger ? "#E11D48" : "var(--text)" }}>
          {label}
        </span>
      </div>
      {rightEl ?? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {value && <span style={{ fontSize: 13, color: "var(--faint)", fontWeight: 600 }}>{value}</span>}
          {onClick && <Icon name="chevron-right" size={16} color="var(--faint)" />}
        </div>
      )}
    </button>
  );
}

export default function SettingsView({
  parentId, displayName, pairs: initialPairs, pairId: initialPairId,
  rewardName: initRewardName, rewardUnit: initRewardUnit,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  // ── 자녀 관리 ─────────────────────────────────────────
  const [pairs, setPairs] = useState(initialPairs);
  const [pairsLoading, setPairsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [gradeEditingPairId, setGradeEditingPairId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [gradeSaving, setGradeSaving] = useState(false);

  // ── AI 설정 (localStorage only, DB에 저장 안 함) ───────────
  const [aiProvider, setAiProvider] = useState<AiProvider>("claude");
  const [aiTokenInput, setAiTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [savedTokenMask, setSavedTokenMask] = useState<string | null>(null);
  const [aiSaved, setAiSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredAiToken();
    if (stored) {
      setAiProvider(stored.provider);
      setSavedTokenMask(`...${stored.token.slice(-6)}`);
    }
  }, []);

  function handleSaveAiToken() {
    const token = aiTokenInput.trim();
    if (!token) return;
    storeAiToken(aiProvider, token);
    setSavedTokenMask(`...${token.slice(-6)}`);
    setAiTokenInput("");
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2500);
  }

  function handleClearAiToken() {
    if (!confirm("저장된 AI 토큰을 삭제할까요?")) return;
    clearStoredAiToken();
    setSavedTokenMask(null);
    setAiTokenInput("");
  }

  // ── 리워드 설정 ────────────────────────────────────────
  const [pairId] = useState(initialPairId);
  const [rewardName, setRewardName] = useState(initRewardName);
  const [rewardUnit, setRewardUnit] = useState(initRewardUnit);
  const [savingReward, setSavingReward] = useState(false);
  const [rewardSaved, setRewardSaved] = useState(false);

  // ── 자녀 추가 ─────────────────────────────────────────
  async function addChild() {
    setPairsLoading(true);
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", parentId }),
    });
    const json = await res.json();
    if (json.pair) {
      setPairs((prev) => [...prev, { ...json.pair, childName: null, childAvatar: null, childGrade: "" }]);
    }
    setPairsLoading(false);
  }

  async function removeChild(pId: string) {
    if (!confirm("이 자녀와의 연결을 해제할까요?")) return;
    setPairsLoading(true);
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", pairId: pId }),
    });
    setPairs((prev) => prev.map((p) => p.id === pId ? { ...p, child_id: null, childName: null, childAvatar: null, childGrade: "" } : p));
    setPairsLoading(false);
    router.refresh();
  }

  async function deletePair(pId: string) {
    if (!confirm("초대 코드를 삭제할까요?")) return;
    setPairsLoading(true);
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", pairId: pId }),
    });
    setPairs((prev) => prev.filter((p) => p.id !== pId));
    setPairsLoading(false);
  }

  async function saveGrade(pId: string, childId: string) {
    if (!selectedGrade) return;
    setGradeSaving(true);
    const gradeLabel = GRADES.find((g) => g.value === selectedGrade)?.label ?? "";
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setGrade", childId, grade: selectedGrade, gradeSchoolYear: currentSchoolYear() }),
    });
    setPairs((prev) => prev.map((p) => p.id === pId ? { ...p, childGrade: gradeLabel } : p));
    setGradeEditingPairId(null);
    setSelectedGrade(null);
    setGradeSaving(false);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  // ── 리워드 저장 ────────────────────────────────────────
  async function saveRewardSettings() {
    if (!pairId) return;
    setSavingReward(true);
    await supabase.from("reward_settings").upsert({
      pair_id: pairId,
      point_reward_name: rewardName,
      point_reward_unit: rewardUnit,
    }, { onConflict: "pair_id" });
    setRewardSaved(true);
    setTimeout(() => setRewardSaved(false), 2500);
    setSavingReward(false);
    router.refresh();
  }

  // ── 로그아웃 ─────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div>
      {/* ── 자녀 관리 ───────────────────────────────── */}
      <SectionHeader>자녀 관리</SectionHeader>
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", overflow: "hidden" }}>
        {pairs.length === 0 && (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--faint)", fontSize: 14 }}>
            연결된 자녀가 없습니다
          </div>
        )}

        {pairs.map((pair, idx) => (
          <div
            key={pair.id}
            style={{ borderBottom: idx < pairs.length - 1 ? "1px solid var(--line)" : "none" }}
          >
            {pair.child_id ? (
              <div style={{ padding: "14px 16px" }}>
                {/* 자녀 행 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28, lineHeight: 1 }}>{pair.childAvatar ?? "🧒"}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                          {pair.childName ?? "자녀"}
                        </span>
                        {pair.childGrade ? (
                          <span style={{ fontSize: 11.5, fontWeight: 700, background: "var(--green-100)", color: "var(--green-d)", padding: "2px 8px", borderRadius: 999 }}>
                            {pair.childGrade}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, fontWeight: 600, background: "var(--line)", color: "var(--faint)", padding: "2px 8px", borderRadius: 999 }}>
                            학년 미설정
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginTop: 2 }}>연결됨</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => { setGradeEditingPairId(gradeEditingPairId === pair.id ? null : pair.id); setSelectedGrade(null); }}
                      style={{
                        height: 34, padding: "0 12px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                        border: "1.5px solid var(--green-200)", background: "var(--green-50)",
                        color: "var(--green-d)", cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      학년 설정
                    </button>
                    <button
                      onClick={() => removeChild(pair.id)}
                      disabled={pairsLoading}
                      style={{
                        height: 34, padding: "0 12px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                        border: "1.5px solid #FECDD3", background: "#FFF1F2",
                        color: "#E11D48", cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      연결 해제
                    </button>
                  </div>
                </div>

                {/* 학년 선택 패널 */}
                {gradeEditingPairId === pair.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>학년 선택 (매년 3월 자동 승급)</p>
                    {SCHOOL_LEVELS.map((level) => (
                      <div key={level} style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 700, marginBottom: 6 }}>{level}학교</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                          {GRADES.filter((g) => g.school === level).map((g) => (
                            <button
                              key={g.value}
                              onClick={() => setSelectedGrade(g.value)}
                              style={{
                                padding: "8px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
                                border: `2px solid ${selectedGrade === g.value ? "var(--green)" : "var(--line-strong)"}`,
                                background: selectedGrade === g.value ? "var(--green-50)" : "#fff",
                                color: selectedGrade === g.value ? "var(--green-d)" : "var(--text-soft)",
                                cursor: "pointer",
                              }}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        onClick={() => saveGrade(pair.id, pair.child_id!)}
                        disabled={!selectedGrade || gradeSaving}
                        style={{
                          flex: 1, height: 42, borderRadius: 12, border: "none",
                          background: "var(--green)", color: "#fff", fontWeight: 800, fontSize: 14,
                          cursor: "pointer", opacity: !selectedGrade || gradeSaving ? 0.5 : 1,
                        }}
                      >
                        {gradeSaving ? "저장 중..." : "저장"}
                      </button>
                      <button
                        onClick={() => { setGradeEditingPairId(null); setSelectedGrade(null); }}
                        style={{
                          height: 42, padding: "0 16px", borderRadius: 12,
                          border: "1.5px solid var(--line-strong)", background: "#fff",
                          color: "var(--muted)", fontWeight: 700, fontSize: 14, cursor: "pointer",
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, marginBottom: 8 }}>
                  자녀 대기 중 — 초대 코드를 공유하세요
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.12em", color: "var(--green-d)" }}>
                    {pair.invite_code}
                  </span>
                  <button
                    onClick={() => copyCode(pair.invite_code)}
                    style={{
                      height: 30, padding: "0 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: "1.5px solid var(--line-strong)", background: "#fff",
                      color: "var(--text-soft)", cursor: "pointer",
                    }}
                  >
                    {copied === pair.invite_code ? "복사됨 ✓" : "복사"}
                  </button>
                  <button
                    onClick={() => deletePair(pair.id)}
                    style={{ marginLeft: "auto", fontSize: 12, color: "var(--faint)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 자녀 추가 버튼 */}
        <button
          onClick={addChild}
          disabled={pairsLoading}
          style={{
            width: "100%", padding: "14px 16px", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, background: "none", border: "none",
            borderTop: pairs.length > 0 ? "1px solid var(--line)" : "none",
            color: "var(--green-d)", fontWeight: 800, fontSize: 14, cursor: "pointer",
            opacity: pairsLoading ? 0.5 : 1,
          }}
        >
          <Icon name="plus" size={17} color="var(--green-d)" stroke={2.5} />
          자녀 추가
        </button>
      </div>

      {/* ── 리워드 설정 ─────────────────────────────── */}
      <SectionHeader>리워드 설정</SectionHeader>
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", padding: "16px 16px 18px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, marginBottom: 5 }}>리워드 이름</p>
            <input
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              placeholder="포인트"
              style={{
                width: "100%", height: 42, borderRadius: 10,
                border: "1.5px solid var(--line-strong)", padding: "0 12px",
                fontSize: 14, fontWeight: 600, color: "var(--text)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ width: 90 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, marginBottom: 5 }}>단위</p>
            <input
              value={rewardUnit}
              onChange={(e) => setRewardUnit(e.target.value)}
              placeholder="P"
              style={{
                width: "100%", height: 42, borderRadius: 10,
                border: "1.5px solid var(--line-strong)", padding: "0 12px",
                fontSize: 14, fontWeight: 700, color: "var(--text)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        <button
          onClick={saveRewardSettings}
          disabled={savingReward || !pairId}
          style={{
            width: "100%", height: 44, borderRadius: 12,
            border: rewardSaved ? "1.5px solid var(--green-200)" : "none",
            background: rewardSaved ? "var(--green-50)" : "var(--green)",
            color: rewardSaved ? "var(--green-d)" : "#fff",
            fontWeight: 800, fontSize: 14, cursor: "pointer",
            opacity: !pairId ? 0.4 : 1,
          }}
        >
          {rewardSaved ? "저장됐습니다 ✓" : savingReward ? "저장 중..." : "설정 저장"}
        </button>
        {!pairId && (
          <p style={{ fontSize: 12, color: "var(--faint)", textAlign: "center", marginTop: 6 }}>
            자녀를 먼저 연결해주세요
          </p>
        )}
      </div>

      {/* ── AI 설정 ──────────────────────────────── */}
      <SectionHeader>AI 설정</SectionHeader>
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", padding: "16px 16px 18px" }}>
        <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 12, lineHeight: 1.6 }}>
          본인의 AI API 토큰을 입력하면 AI 기능을 무제한으로 이용할 수 있어요.
          토큰이 없으면 광고 시청 후 1회 이용이 가능합니다.
        </p>

        {/* AI 제공사 선택 */}
        <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>AI 제공사</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {(["claude", "openai", "gemini"] as AiProvider[]).map((p) => {
            const on = aiProvider === p;
            return (
              <button
                key={p}
                onClick={() => { setAiProvider(p); setAiTokenInput(""); }}
                style={{
                  flex: 1, height: 38, borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                  border: `2px solid ${on ? "var(--green)" : "var(--line-strong)"}`,
                  background: on ? "var(--green-50)" : "#fff",
                  color: on ? "var(--green-d)" : "var(--muted)",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {p === "claude" ? "Claude" : p === "openai" ? "ChatGPT" : "Gemini"}
              </button>
            );
          })}
        </div>

        {/* 현재 저장 상태 */}
        {savedTokenMask && (
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--green-50)", borderRadius: 10,
              padding: "10px 12px", marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="check-circle" size={16} color="var(--green)" stroke={2} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green-d)" }}>
                {AI_PROVIDER_LABELS[aiProvider]} 토큰 저장됨 ({savedTokenMask})
              </span>
            </div>
            <button
              onClick={handleClearAiToken}
              style={{ fontSize: 12, color: "#E11D48", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
            >
              삭제
            </button>
          </div>
        )}

        {/* 토큰 입력 */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <input
            type={showToken ? "text" : "password"}
            value={aiTokenInput}
            onChange={(e) => setAiTokenInput(e.target.value)}
            placeholder={AI_PROVIDER_PLACEHOLDERS[aiProvider]}
            style={{
              width: "100%", height: 44, borderRadius: 10,
              border: "1.5px solid var(--line-strong)", padding: "0 44px 0 12px",
              fontSize: 13, fontWeight: 500, color: "var(--text)", outline: "none",
              boxSizing: "border-box", fontFamily: "ui-monospace, monospace",
            }}
          />
          <button
            onClick={() => setShowToken((v) => !v)}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 2,
            }}
          >
            <Icon name={showToken ? "eye-off" : "eye"} size={17} color="var(--faint)" stroke={2} />
          </button>
        </div>
        <button
          onClick={handleSaveAiToken}
          disabled={!aiTokenInput.trim()}
          style={{
            width: "100%", height: 44, borderRadius: 12, border: "none",
            background: aiSaved ? "var(--green-50)" : aiTokenInput.trim() ? "var(--green)" : "var(--line-strong)",
            color: aiSaved ? "var(--green-d)" : aiTokenInput.trim() ? "#fff" : "var(--faint)",
            fontWeight: 800, fontSize: 14, cursor: aiTokenInput.trim() ? "pointer" : "default",
          }}
        >
          {aiSaved ? "이 기기에 저장됐습니다 ✓" : "토큰 저장 (이 기기에만)"}
        </button>

        {/* 보안 안내 */}
        <div
          style={{
            marginTop: 12, padding: "10px 12px",
            background: "var(--surface-2)", borderRadius: 10,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}
        >
          <span style={{ marginTop: 1, flexShrink: 0 }}>
            <Icon name="lock" size={14} color="var(--faint)" stroke={2} />
          </span>
          <p style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
            토큰은 이 기기(브라우저)에만 저장됩니다. 서버 데이터베이스에는 기록되지 않으며,
            AI 호출 시에만 HTTPS를 통해 전달된 뒤 즉시 폐기됩니다.
          </p>
        </div>
      </div>

      {/* ── 계정 ──────────────────────────────────── */}
      <SectionHeader>계정</SectionHeader>
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", overflow: "hidden" }}>
        <SettingRow
          icon="user"
          label={displayName || "이름 없음"}
          value="부모"
        />
        <SettingRow
          icon="arrow-left"
          label="로그아웃"
          danger
          onClick={handleLogout}
        />
      </div>

      {/* ── 앱 정보 ───────────────────────────────── */}
      <SectionHeader>앱 정보</SectionHeader>
      <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", overflow: "hidden" }}>
        <SettingRow
          icon="clipboard-check"
          label="공지사항"
          onClick={() => router.push("/notices")}
        />
        <SettingRow
          icon="lock"
          label="이용약관"
          onClick={() => router.push("/terms")}
        />
        <SettingRow
          icon="lock"
          label="개인정보처리방침"
          onClick={() => router.push("/privacy")}
        />
        <div
          style={{
            padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: "1px solid var(--line)",
          }}
        >
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--muted)" }}>버전</span>
          <span style={{ fontSize: 13, color: "var(--faint)", fontWeight: 600 }}>0.1.0</span>
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
