"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { HomeworkItem, SubjectRule } from "@/lib/types";
import { tagCurriculum } from "@/lib/curriculum";
import Icon from "@/components/ui/Icon";
import AdGateModal from "@/components/ui/AdGateModal";
import { getStoredAiToken } from "@/lib/ai-token";

interface Props {
  pairId: string;
  rules: SubjectRule[];
  childGrade: number | null;
  childName: string;
  childInitial: string;
  gradeLabel: string;
  rewardUnit: string;
  rewardName: string;
}

const SUBJECT_COLORS: Record<string, [string, string]> = {
  수학: ["#EEF2FF", "#4F46E5"],
  국어: ["#FEF2F2", "#E11D48"],
  영어: ["#ECFEFF", "#0891B2"],
};

const today = new Date().toISOString().split("T")[0];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-soft)", marginBottom: 9, marginLeft: 2 }}>
      {children}
    </div>
  );
}

function emptyItem(): HomeworkItem {
  return { subject: "", description: "", dueDate: today, dueTime: undefined, endTime: undefined };
}

export default function HomeworkInputForm({
  pairId, rules, childGrade, childName, childInitial, gradeLabel, rewardUnit, rewardName,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState<HomeworkItem[] | null>(null);
  const [error, setError] = useState("");
  const [manualMode, setManualMode] = useState(false);

  // 리워드 설정
  const [rewardTrigger, setRewardTrigger] = useState<"completion" | "score">("completion");
  const [rewardAmount, setRewardAmount] = useState("");

  // Ad gate
  const [showAdGate, setShowAdGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // ── Ad gate wrapper ───────────────────────────────────────
  function withAiGate(action: () => Promise<void>) {
    const stored = getStoredAiToken();
    if (stored) {
      action();
    } else {
      setPendingAction(() => action);
      setShowAdGate(true);
    }
  }

  function onAdComplete() {
    setShowAdGate(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }

  function onAdManual() {
    setShowAdGate(false);
    setPendingAction(null);
    switchToManual();
  }

  function switchToManual() {
    setManualMode(true);
    if (!parsed?.length) setParsed([emptyItem()]);
  }

  // ── AI parse helpers ──────────────────────────────────────
  function buildApiBody(extra: Record<string, unknown>) {
    const stored = getStoredAiToken();
    return {
      ...extra,
      rules,
      ...(stored ? { aiToken: stored.token, aiProvider: stored.provider } : {}),
    };
  }

  async function doParseText() {
    if (!text.trim()) return;
    setParsing(true);
    setError("");
    setParsed(null);
    setManualMode(false);
    const res = await fetch("/api/parse-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildApiBody({ text })),
    });
    const json = await res.json();
    if (!res.ok || !json.items?.length) {
      setError(json.error ?? "숙제를 찾지 못했어요. 다시 입력해보세요.");
    } else {
      setParsed(json.items);
    }
    setParsing(false);
  }

  function handleParse() {
    withAiGate(doParseText);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const doParseImage = () => new Promise<void>((resolve) => {
      setParsing(true);
      setError("");
      setParsed(null);
      setManualMode(false);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const res = await fetch("/api/parse-homework", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildApiBody({ imageBase64: base64, mediaType })),
        });
        const json = await res.json();
        if (!res.ok || !json.items?.length) {
          setError(json.error ?? "이미지에서 숙제를 찾지 못했어요.");
        } else {
          setParsed(json.items);
        }
        setParsing(false);
        resolve();
      };
      reader.readAsDataURL(file);
    });
    withAiGate(doParseImage);
    e.target.value = "";
  }

  async function handleSave() {
    if (!parsed?.length) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amt = parseInt(rewardAmount) || 0;

    await supabase.from("homeworks").insert(
      parsed.map((item) => ({
        pair_id: pairId,
        subject: item.subject,
        description: item.description,
        due_date: item.dueDate,
        due_time: item.dueTime ?? null,
        end_time: item.endTime ?? null,
        reward_amount: amt,
        reward_trigger: rewardTrigger,
        created_by: user.id,
        curriculum_meta: tagCurriculum(item.subject, item.description, childGrade),
      }))
    );
    setSaving(false);
    router.push("/parent/dashboard");
  }

  function addManualItem() {
    setParsed((prev) => [...(prev ?? []), emptyItem()]);
  }

  function removeManualItem(index: number) {
    setParsed((prev) => (prev ?? []).filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof HomeworkItem, value: string) {
    if (!parsed) return;
    const updated = [...parsed];
    updated[index] = { ...updated[index], [field]: value };
    setParsed(updated);
  }

  const isManual = manualMode;
  const showResults = parsed && parsed.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100svh", background: "var(--bg)" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0, padding: "4px 18px 14px", gap: 6 }}>
        <button
          onClick={() => window.history.back()}
          style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>숙제 입력</h1>
        {isManual && (
          <span
            style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, background: "var(--amber-100)", color: "var(--amber-d)", padding: "3px 10px", borderRadius: 999 }}
          >
            수동 입력
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 24px" }}>

        {/* 자녀 */}
        <FieldLabel>자녀</FieldLabel>
        <div
          style={{
            background: "#fff", borderRadius: "var(--r-card)", padding: "11px 14px",
            marginBottom: 20, boxShadow: "var(--sh-sm)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg,#34D399,#16A34A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0,
              }}
            >
              {childInitial}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", color: "var(--text)" }}>
              {childName}
              {gradeLabel && (
                <span style={{ color: "var(--muted)", fontWeight: 600, fontSize: 13 }}> · {gradeLabel}</span>
              )}
            </div>
          </div>
          <Icon name="chevron-right" size={18} color="var(--faint)" />
        </div>

        {/* AI 입력 (수동 모드가 아닐 때만) */}
        {!isManual && (
          <>
            <FieldLabel>숙제 내용 (자연어 입력)</FieldLabel>
            <div
              style={{
                background: "#fff", border: "1.5px solid var(--line-strong)", borderRadius: 14,
                padding: "15px 16px", marginBottom: 8, boxShadow: "var(--sh-sm)",
              }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={"수학 학습지 내일까지\n영어학원 숙제 목요일 오후 7시"}
                rows={3}
                style={{
                  width: "100%", border: "none", outline: "none", resize: "none",
                  fontSize: 15, fontWeight: 600, color: "var(--text)",
                  background: "transparent", fontFamily: "inherit",
                }}
              />
            </div>
            <button
              onClick={handleParse}
              disabled={!text.trim() || parsing}
              style={{
                width: "100%", height: 44, borderRadius: 12, border: "none",
                background: text.trim() ? "var(--green)" : "var(--line-strong)",
                color: text.trim() ? "#fff" : "var(--faint)",
                fontWeight: 800, fontSize: 14, cursor: text.trim() ? "pointer" : "default",
                marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon name="sparkles" size={16} color={text.trim() ? "#fff" : "var(--faint)"} stroke={2} />
              {parsing ? "분석 중..." : "AI로 분석하기"}
            </button>

            {/* 사진 업로드 */}
            <FieldLabel>학습지 사진 (선택)</FieldLabel>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={parsing}
              style={{
                width: "100%", height: 96, borderRadius: 16, cursor: "pointer",
                border: "1.5px dashed var(--line-strong)", background: "var(--surface-2)",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 7, marginBottom: 10,
              }}
            >
              <Icon name="camera" size={24} color="var(--green-d)" stroke={1.9} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
                {parsing ? "분석 중..." : "사진 추가하기"}
              </span>
            </button>

            {/* 수동 입력 전환 */}
            <button
              onClick={switchToManual}
              style={{
                width: "100%", height: 40, borderRadius: 12,
                border: "1.5px solid var(--line-strong)", background: "#fff",
                color: "var(--muted)", fontWeight: 700, fontSize: 13,
                cursor: "pointer", marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon name="edit-3" size={14} color="var(--muted)" stroke={2} />
              AI 없이 직접 입력하기
            </button>
          </>
        )}

        {/* 수동 모드 헤더 */}
        {isManual && !showResults && (
          <button
            onClick={() => { setManualMode(false); setParsed(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--green-d)", fontWeight: 700, fontSize: 13.5,
              marginBottom: 16,
            }}
          >
            <Icon name="sparkles" size={14} color="var(--green-d)" stroke={2} />
            AI 입력으로 전환
          </button>
        )}

        {/* 완료 시 리워드 */}
        <FieldLabel>완료 시 {rewardName}</FieldLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {([["completion", "완료 시 지급"], ["score", "점수 기반 지급"]] as const).map(([val, label]) => {
            const on = rewardTrigger === val;
            return (
              <button
                key={val}
                onClick={() => setRewardTrigger(val)}
                style={{
                  flex: 1, height: 42, borderRadius: 12, fontWeight: 800, fontSize: 13,
                  border: `2px solid ${on ? "var(--green)" : "var(--line-strong)"}`,
                  background: on ? "var(--green)" : "#fff",
                  color: on ? "#fff" : "var(--muted)",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <input
            type="number"
            min={0}
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            placeholder="0"
            style={{
              width: "100%", height: 52, borderRadius: 14,
              border: "1.5px solid var(--line-strong)",
              padding: "0 56px 0 16px",
              fontSize: 20, fontWeight: 800, color: "var(--text)",
              outline: "none", boxSizing: "border-box",
              background: rewardAmount ? "var(--amber-50)" : "#fff",
            }}
          />
          <span
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              fontSize: 15, fontWeight: 800, color: "var(--amber-d)", pointerEvents: "none",
            }}
          >
            {rewardUnit}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 22, marginLeft: 2 }}>
          {rewardTrigger === "completion"
            ? `숙제 완료 시 ${rewardAmount || "0"}${rewardUnit} 즉시 적립`
            : `정답 1개당 ${rewardAmount || "0"}${rewardUnit} 적립 (채점 후)`}
        </p>

        {error && (
          <p style={{ color: "var(--red)", fontSize: 14, textAlign: "center", marginBottom: 12 }}>{error}</p>
        )}

        {/* 파싱/수동 결과 편집 */}
        {showResults && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <FieldLabel>
                {isManual ? `직접 입력 (${parsed.length}개)` : `분석 결과 (${parsed.length}개) — 수정 후 저장`}
              </FieldLabel>
              {isManual && (
                <button
                  onClick={addManualItem}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--green-d)", fontSize: 13, fontWeight: 800,
                  }}
                >
                  <Icon name="plus" size={14} color="var(--green-d)" stroke={2.5} />
                  추가
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {parsed.map((item, i) => {
                const [bg, color] = SUBJECT_COLORS[item.subject] ?? ["var(--green-50)", "var(--green-d)"];
                return (
                  <div
                    key={i}
                    style={{
                      background: "#fff", borderRadius: "var(--r-md)", padding: "13px 14px",
                      border: "1px solid var(--line)", boxShadow: "var(--sh-sm)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <input
                        value={item.subject}
                        onChange={(e) => updateItem(i, "subject", e.target.value)}
                        placeholder="과목"
                        style={{
                          width: 80, border: "1px solid var(--line-strong)", borderRadius: 8,
                          padding: "5px 9px", fontSize: 13, fontWeight: 800, color, background: bg,
                        }}
                      />
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                        placeholder="숙제 내용"
                        style={{
                          flex: 1, border: "1px solid var(--line-strong)", borderRadius: 8,
                          padding: "5px 9px", fontSize: 13.5, fontWeight: 600, color: "var(--text)",
                        }}
                      />
                      {isManual && parsed.length > 1 && (
                        <button
                          onClick={() => removeManualItem(i)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
                        >
                          <Icon name="x" size={16} color="var(--faint)" stroke={2} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => updateItem(i, "dueDate", e.target.value)}
                        style={{
                          border: "1px solid var(--line-strong)", borderRadius: 8,
                          padding: "4px 9px", fontSize: 12.5, color: "var(--text-soft)",
                        }}
                      />
                      <input
                        type="time"
                        value={item.dueTime ?? ""}
                        onChange={(e) => updateItem(i, "dueTime", e.target.value)}
                        placeholder="시간(선택)"
                        style={{
                          border: "1px solid var(--line-strong)", borderRadius: 8,
                          padding: "4px 9px", fontSize: 12.5, color: "var(--text-soft)",
                        }}
                      />
                    </div>
                    {childGrade && tagCurriculum(item.subject, item.description, childGrade) && (
                      <p style={{ fontSize: 11.5, color: "#6366F1", marginTop: 6, fontWeight: 600 }}>
                        📚 {tagCurriculum(item.subject, item.description, childGrade)!.subject} · {tagCurriculum(item.subject, item.description, childGrade)!.area}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 고정 CTA */}
      {showResults && (
        <div
          style={{
            flexShrink: 0, padding: "12px 20px 26px",
            background: "rgba(244,248,245,.92)", backdropFilter: "blur(8px)",
            borderTop: "1px solid var(--line)",
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving || parsed.some((p) => !p.subject.trim() || !p.description.trim())}
            style={{
              width: "100%", height: 54, borderRadius: 16, border: "none",
              background: "var(--green)", color: "#fff",
              fontWeight: 800, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 8px 20px -8px rgba(22,163,74,.7)",
              opacity: saving || parsed.some((p) => !p.subject.trim() || !p.description.trim()) ? 0.5 : 1,
            }}
          >
            <Icon name="plus" size={20} color="#fff" stroke={2.4} />
            {saving ? "저장 중..." : `숙제 ${parsed.length}개 추가하기`}
          </button>
        </div>
      )}

      {/* Ad Gate Modal */}
      {showAdGate && (
        <AdGateModal
          onWatchComplete={onAdComplete}
          onManualEntry={onAdManual}
          onClose={() => { setShowAdGate(false); setPendingAction(null); }}
        />
      )}
    </div>
  );
}
