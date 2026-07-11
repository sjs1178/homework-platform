"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CheckResult, Problem } from "@/lib/check-homework";
import Icon from "@/components/ui/Icon";
import AiProcessing from "@/components/ui/AiProcessing";
import AdGateModal from "@/components/ui/AdGateModal";
import { getStoredAiToken } from "@/lib/ai-token";
import { compressImageFile } from "@/lib/image";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

interface Props {
  homeworkId: string;
  checkId: string | null;
  existingResult: CheckResult | null;
  existingScore: { score: number; total: number } | null;
  isReviewed: boolean;
  subject?: string;
  pairId: string;
  childId: string | null;
  rewardName: string;
  rewardUnit: string;
  defaultRewardAmount: number;
  rewardTrigger: "completion" | "score";
}

interface EditState {
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
}

// ── Manual check form state ───────────────────────────────

interface ManualCheckData {
  scoreStr: string;
  totalStr: string;
  wrongItems: string[];
  comments: string[];
}

function ManualCheckForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (data: ManualCheckData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [scoreStr, setScoreStr] = useState("");
  const [totalStr, setTotalStr] = useState("");
  const [wrongItems, setWrongItems] = useState<string[]>([""]);
  const [comments, setComments] = useState<string[]>([""]);

  function updateList(
    list: string[],
    setList: (v: string[]) => void,
    idx: number,
    val: string
  ) {
    const next = [...list];
    next[idx] = val;
    setList(next);
  }

  function removeFromList(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

  return (
    <div
      style={{
        background: "#fff", borderRadius: "var(--r-card)",
        padding: 18, boxShadow: "var(--sh-md)",
        display: "flex", flexDirection: "column", gap: 18,
      }}
    >
      {/* 점수 */}
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-soft)", marginBottom: 8 }}>
          점수 <span style={{ color: "var(--faint)", fontWeight: 600 }}>(선택)</span>
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="number"
            min={0}
            value={scoreStr}
            onChange={(e) => setScoreStr(e.target.value)}
            placeholder="맞은 개수"
            style={{
              flex: 1, height: 44, borderRadius: 10,
              border: "1.5px solid var(--line-strong)", padding: "0 12px",
              fontSize: 16, fontWeight: 800, color: "var(--text)", outline: "none",
            }}
          />
          <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 700 }}>/</span>
          <input
            type="number"
            min={0}
            value={totalStr}
            onChange={(e) => setTotalStr(e.target.value)}
            placeholder="전체 문제"
            style={{
              flex: 1, height: 44, borderRadius: 10,
              border: "1.5px solid var(--line-strong)", padding: "0 12px",
              fontSize: 16, fontWeight: 800, color: "var(--text)", outline: "none",
            }}
          />
        </div>
      </div>

      {/* 틀린 부분 */}
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-soft)", marginBottom: 8 }}>
          틀린 부분 <span style={{ color: "var(--faint)", fontWeight: 600 }}>(선택)</span>
        </p>
        {wrongItems.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input
              value={item}
              onChange={(e) => updateList(wrongItems, setWrongItems, i, e.target.value)}
              placeholder={`틀린 부분 ${i + 1}`}
              style={{
                flex: 1, height: 42, borderRadius: 10,
                border: "1.5px solid var(--line-strong)", padding: "0 12px",
                fontSize: 14, color: "var(--text)", outline: "none",
              }}
            />
            {wrongItems.length > 1 && (
              <button
                onClick={() => removeFromList(wrongItems, setWrongItems, i)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
              >
                <Icon name="x" size={16} color="var(--faint)" stroke={2} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setWrongItems((p) => [...p, ""])}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--green-d)", fontWeight: 700, fontSize: 13,
          }}
        >
          <Icon name="plus" size={14} color="var(--green-d)" stroke={2.5} />
          추가하기
        </button>
      </div>

      {/* 부모 코멘트 */}
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-soft)", marginBottom: 8 }}>
          부모 코멘트 <span style={{ color: "var(--faint)", fontWeight: 600 }}>(선택)</span>
        </p>
        {comments.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <textarea
              value={item}
              onChange={(e) => updateList(comments, setComments, i, e.target.value)}
              placeholder={`코멘트 ${i + 1}`}
              rows={2}
              style={{
                flex: 1, borderRadius: 10,
                border: "1.5px solid var(--line-strong)", padding: "10px 12px",
                fontSize: 14, color: "var(--text)", outline: "none",
                resize: "none", fontFamily: "inherit",
              }}
            />
            {comments.length > 1 && (
              <button
                onClick={() => removeFromList(comments, setComments, i)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, marginTop: 8 }}
              >
                <Icon name="x" size={16} color="var(--faint)" stroke={2} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setComments((p) => [...p, ""])}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--green-d)", fontWeight: 700, fontSize: 13,
          }}
        >
          <Icon name="plus" size={14} color="var(--green-d)" stroke={2.5} />
          추가하기
        </button>
      </div>

      {/* 버튼 */}
      <button
        onClick={() => onSubmit({ scoreStr, totalStr, wrongItems, comments })}
        disabled={submitting}
        style={{
          width: "100%", height: 52, borderRadius: 16, border: "none",
          background: "var(--green)", color: "#fff",
          fontWeight: 800, fontSize: 15, cursor: submitting ? "default" : "pointer",
          boxShadow: "var(--sh-green)", opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "저장 중..." : "검사 결과 저장하기"}
      </button>
      <button
        onClick={onCancel}
        style={{ fontSize: 13, color: "var(--faint)", background: "none", border: "none", cursor: "pointer", textAlign: "center" }}
      >
        취소
      </button>
    </div>
  );
}

// ── QCard (AI 결과 카드) ──────────────────────────────────────

function QCard({
  p, editing, onStartEdit, onCancelEdit, onChangeEdit,
}: {
  p: Problem;
  editing: EditState | undefined;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeEdit: (patch: Partial<EditState>) => void;
}) {
  const correct = editing ? editing.isCorrect : p.isCorrect;
  const accent = correct ? "var(--green)" : "#F2607D";

  return (
    <div
      style={{
        background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)",
        marginBottom: 13, overflow: "hidden", display: "flex",
      }}
    >
      <div style={{ width: 5, flexShrink: 0, background: accent }} />
      <div style={{ flex: 1, padding: "15px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 9 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span
              style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                background: correct ? "var(--green-100)" : "#FCE4EA",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name={correct ? "check" : "x"} size={15} color={correct ? "var(--green-d)" : "#E11D48"} stroke={3} />
            </span>
            <div style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.4, color: "var(--text)" }}>
              <span style={{ color: "var(--muted)" }}>{p.number}번.</span> {p.question}
            </div>
          </div>
          {!editing && (
            <button
              onClick={onStartEdit}
              style={{
                display: "flex", alignItems: "center", gap: 3, flexShrink: 0,
                background: "none", border: "none", color: "var(--green-d)",
                fontWeight: 800, fontSize: 12.5, marginTop: 2, cursor: "pointer",
              }}
            >
              <Icon name="edit-3" size={13} color="var(--green-d)" stroke={2.2} />수정
            </button>
          )}
        </div>
        <div style={{ paddingLeft: 34 }}>
          <div style={{ fontSize: 13.5, color: "var(--text-soft)", fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>
            <span style={{ color: "var(--muted)" }}>학생 답</span> · {editing ? editing.studentAnswer : p.studentAnswer}
          </div>
          {!editing ? (
            <>
              {!p.isCorrect && p.correctAnswer && (
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--green-d)", marginBottom: 10, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700 }}>정답</span> · {p.correctAnswer}
                </div>
              )}
              {p.explanation && (
                <div style={{ background: "var(--surface-2)", borderRadius: 13, padding: "11px 13px", marginTop: p.isCorrect ? 0 : 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                    <Icon name="sparkles" size={13} color="var(--green)" stroke={2} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--green-d)", whiteSpace: "nowrap" }}>AI 해설</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-soft)", fontWeight: 500, lineHeight: 1.62 }}>{p.explanation}</div>
                </div>
              )}
            </>
          ) : (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8, background: "var(--amber-50)", borderRadius: 12, padding: 12 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4, display: "block" }}>학생 답 수정</span>
                <input
                  value={editing.studentAnswer}
                  onChange={(e) => onChangeEdit({ studentAnswer: e.target.value })}
                  placeholder="학생이 쓴 답"
                  style={{ width: "100%", border: "1px solid var(--line-strong)", borderRadius: 8, padding: "7px 10px", fontSize: 13.5, color: "var(--text)", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => onChangeEdit({ isCorrect: val })}
                    style={{
                      flex: 1, height: 36, borderRadius: 10, fontWeight: 800, fontSize: 13.5,
                      border: `2px solid ${editing.isCorrect === val ? (val ? "var(--green)" : "#F2607D") : "var(--line-strong)"}`,
                      background: editing.isCorrect === val ? (val ? "var(--green)" : "#F2607D") : "#fff",
                      color: editing.isCorrect === val ? "#fff" : "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {val ? "O 정답" : "X 오답"}
                  </button>
                ))}
              </div>
              <input
                value={editing.correctAnswer}
                onChange={(e) => onChangeEdit({ correctAnswer: e.target.value })}
                placeholder="정답"
                style={{ border: "1px solid var(--line-strong)", borderRadius: 8, padding: "7px 10px", fontSize: 13.5, color: "var(--text)", outline: "none" }}
              />
              <textarea
                value={editing.explanation}
                onChange={(e) => onChangeEdit({ explanation: e.target.value })}
                placeholder="풀이 설명 (선택)"
                rows={2}
                style={{ border: "1px solid var(--line-strong)", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: "var(--text)", resize: "none", outline: "none" }}
              />
              <button onClick={onCancelEdit} style={{ fontSize: 12, color: "var(--faint)", textAlign: "right", background: "none", border: "none", cursor: "pointer" }}>취소</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function HomeworkCheckForm({
  homeworkId, checkId: initialCheckId, existingResult, existingScore, isReviewed: initialReviewed, subject,
  pairId, childId, rewardName, rewardUnit, defaultRewardAmount, rewardTrigger,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [checkMode, setCheckMode] = useState<"ai" | "manual">("ai");
  const [images, setImages] = useState<{ base64: string; mediaType: MediaType; preview: string }[]>([]);
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(existingResult);
  const [score, setScore] = useState(existingScore);
  const [checkId, setCheckId] = useState<string | null>(initialCheckId);
  const [isReviewed, setIsReviewed] = useState(initialReviewed);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [editing, setEditing] = useState<Record<number, EditState>>({});
  const [savedMsg, setSavedMsg] = useState("");

  // Reward modal
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(String(defaultRewardAmount || 10));
  const [rewardDone, setRewardDone] = useState(false);

  // Add problem manually
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [addQuestion, setAddQuestion] = useState("");
  const [addStudentAnswer, setAddStudentAnswer] = useState("");
  const [addCorrectAnswer, setAddCorrectAnswer] = useState("");
  const [addIsCorrect, setAddIsCorrect] = useState(false);
  const [addExplanation, setAddExplanation] = useState("");

  // Ad gate
  const [showAdGate, setShowAdGate] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      // 업로드 전 리사이즈·압축 (Vercel 요청 본문 4.5MB 한도 회피 → 여러 장 첨부 가능)
      const img = await compressImageFile(file);
      setImages((prev) => [...prev, {
        base64: img.base64,
        mediaType: img.mediaType as MediaType,
        preview: img.preview,
      }]);
    }
  }

  function buildApiBody(extra: Record<string, unknown> = {}) {
    const stored = getStoredAiToken();
    return {
      homeworkId,
      ...extra,
      ...(stored ? { aiToken: stored.token, aiProvider: stored.provider } : {}),
    };
  }

  async function doAiCheck() {
    setChecking(true);
    setError("");
    const body: Record<string, unknown> = buildApiBody();
    if (images.length) body.images = images.map(({ base64, mediaType }) => ({ base64, mediaType }));
    if (text.trim()) body.text = text.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    try {
      const res = await fetch("/api/check-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let msg = "채점 중 오류가 발생했어요.";
        let code = "unknown";
        try {
          const json = await res.json();
          msg = json.error ?? msg;
          code = json.errorCode ?? "unknown";
        } catch {
          if (res.status === 504) {
            msg = "요청 시간이 초과되었어요. 사진 수를 줄이거나 잠시 후 다시 시도해 주세요.";
            code = "timeout";
          } else if (res.status === 413) {
            msg = "이미지 용량이 너무 커요. 사진 수를 줄이거나 작은 사진을 사용해 주세요.";
            code = "payload_too_large";
          }
        }
        setError(msg);
        setErrorCode(code);
      } else {
        const json = await res.json();
        setResult(json.result);
        setScore({ score: json.result.score, total: json.result.total });
        setCheckId(json.checkId ?? null);
        setImages([]);
        setText("");
        setEditing({});
        setIsReviewed(json.result.total === 0);
        router.refresh(); // 대시보드 등 캐시 무효화 → 돌아갔을 때 검사 상태 반영
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("요청 시간이 초과되었어요. 사진 수를 줄이거나 잠시 후 다시 시도해 주세요.");
        setErrorCode("timeout");
      } else {
        setError("네트워크 오류가 발생했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
        setErrorCode("network");
      }
    }
    setChecking(false);
  }

  function handleCheck() {
    const stored = getStoredAiToken();
    if (stored || (!images.length && !text.trim())) {
      // own token or "확인 완료" path (no AI needed)
      doAiCheck();
    } else {
      setShowAdGate(true);
    }
  }

  function onAdComplete() {
    setShowAdGate(false);
    doAiCheck();
  }

  function onAdManual() {
    setShowAdGate(false);
    setCheckMode("manual");
    setImages([]);
    setText("");
  }

  async function handleManualSubmit(data: ManualCheckData) {
    setSaving(true);
    const { scoreStr, totalStr, wrongItems, comments } = data;
    const scoreNum = parseInt(scoreStr) || 0;
    const totalNum = parseInt(totalStr) || 0;

    const manualResult: CheckResult = {
      subject: subject ?? "-",
      problems: wrongItems
        .filter((w) => w.trim())
        .map((w, i) => ({
          number: i + 1,
          question: w.trim(),
          studentAnswer: "",
          correctAnswer: "",
          isCorrect: false,
          explanation: null,
        })),
      score: scoreNum,
      total: totalNum,
      feedback: comments.filter((c) => c.trim()).join("\n") || "부모가 직접 확인했습니다.",
    };

    const res = await fetch("/api/check-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeworkId, manualResult }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "저장 중 오류가 발생했어요.");
    } else {
      setResult(json.result);
      setScore({ score: json.result.score, total: json.result.total });
      setCheckId(json.checkId ?? null);
      setIsReviewed(true);
      router.refresh();
    }
    setSaving(false);
  }

  async function saveCorrections() {
    if (!result || !checkId) return;
    const editedNums = Object.keys(editing).map(Number);
    if (!editedNums.length) return;
    setSaving(true);

    const corrections = editedNums.map((num) => {
      const orig = result.problems.find((p) => p.number === num)!;
      const edit = editing[num];
      return {
        problemNumber: num, subject: result.subject, question: orig.question,
        studentAnswer: edit.studentAnswer, aiIsCorrect: orig.isCorrect,
        aiCorrectAnswer: orig.correctAnswer ?? "", aiExplanation: orig.explanation ?? null,
        correctedIsCorrect: edit.isCorrect, correctedCorrectAnswer: edit.correctAnswer,
        correctedExplanation: edit.explanation,
      };
    });

    const res = await fetch("/api/correct-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkId, corrections }),
    });

    if (res.ok) {
      const updatedProblems = result.problems.map((p) => {
        const edit = editing[p.number];
        if (!edit) return p;
        return { ...p, isCorrect: edit.isCorrect, studentAnswer: edit.studentAnswer, correctAnswer: edit.correctAnswer, explanation: edit.explanation || null };
      });
      const newScore = updatedProblems.filter((p) => p.isCorrect).length;
      setResult({ ...result, problems: updatedProblems, score: newScore });
      setScore({ score: newScore, total: result.total });
      setEditing({});
      setIsReviewed(true);
      setSavedMsg("수정 내용이 저장됐습니다");
      setTimeout(() => setSavedMsg(""), 3000);
      router.refresh();
    }
    setSaving(false);
  }

  function handleAddProblem() {
    if (!result || !addQuestion.trim()) return;
    const nextNum = result.problems.length > 0
      ? Math.max(...result.problems.map((p) => p.number)) + 1
      : 1;
    const newProblem: Problem = {
      number: nextNum,
      question: addQuestion.trim(),
      studentAnswer: addStudentAnswer.trim() || "미작성",
      correctAnswer: addCorrectAnswer.trim(),
      isCorrect: addIsCorrect,
      explanation: addIsCorrect ? null : (addExplanation.trim() || null),
    };
    const updatedProblems = [...result.problems, newProblem];
    const newScore = updatedProblems.filter((p) => p.isCorrect).length;
    setResult({ ...result, problems: updatedProblems, score: newScore, total: updatedProblems.length });
    setScore({ score: newScore, total: updatedProblems.length });
    setShowAddProblem(false);
    setAddQuestion("");
    setAddStudentAnswer("");
    setAddCorrectAnswer("");
    setAddIsCorrect(false);
    setAddExplanation("");
    setIsReviewed(false);
  }

  async function handleRewardComplete() {
    const amt = parseInt(rewardAmount) || 0;
    setSaving(true);
    if (amt > 0 && childId) {
      await fetch("/api/adjust-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairId,
          childId,
          type: "earn",
          amount: amt,
          note: `${subject ?? "숙제"} 검사 완료`,
        }),
      });
    }
    setShowRewardModal(false);
    setRewardDone(true);
    setSavedMsg(`검사 완료! ${amt > 0 ? `${rewardName} ${amt}${rewardUnit} 지급` : ""}`);
    setTimeout(() => setSavedMsg(""), 4000);
    setSaving(false);
    router.refresh(); // 대시보드 캐시 무효화 → 돌아가면 검사 완료 반영
  }

  const hasEdits = Object.keys(editing).length > 0;
  const isManualResult = result?.total === 0;

  function checkBtnLabel() {
    if (checking) return "처리 중...";
    if (images.length) return `AI 채점하기 (사진 ${images.length}장)`;
    if (text.trim()) return "AI 채점하기 (텍스트)";
    return "확인 완료로 저장";
  }

  // ── 결과 뷰 ─────────────────────────────────────────────
  if (result) {
    const pct = score && score.total > 0 ? Math.round((score.score / score.total) * 100) : 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {/* 점수 히어로 */}
        <div
          style={{
            borderRadius: 24, padding: 20,
            background: "linear-gradient(150deg,#1FB259,#15803D)",
            color: "#fff", boxShadow: "var(--sh-hero-green)",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ display: "flex", gap: 20, position: "relative" }}>
            {isManualResult ? (
              <div
                style={{
                  width: 92, height: 92, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(255,255,255,.22)", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="check-circle" size={42} color="#fff" stroke={2} />
              </div>
            ) : (
              <div
                style={{
                  width: 92, height: 92, borderRadius: "50%", flexShrink: 0,
                  background: `conic-gradient(#fff 0% ${pct}%, rgba(255,255,255,.22) ${pct}% 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 70, height: 70, borderRadius: "50%", background: "#16823f",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 24, fontWeight: 800 }}>{pct}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 1 }}>점</span>
                </div>
              </div>
            )}
            <div>
              {isManualResult ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>검사 결과</div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "4px 0" }}>확인 완료</div>
                  {score && score.score > 0 && (
                    <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.85 }}>{score.score}점</div>
                  )}
                  {isReviewed && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <Icon name="check-circle" size={14} color="#fff" stroke={2.4} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.9, whiteSpace: "nowrap" }}>검토 완료</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>{score!.total}문제 중</div>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: "2px 0 4px" }}>{score!.score}개 정답</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="check-circle" size={14} color="#fff" stroke={2.4} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.92, whiteSpace: "nowrap" }}>
                      {isReviewed ? "검토 완료" : "수정 가능"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 총평 / 코멘트 */}
        {result.feedback && (
          <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: 16, boxShadow: "var(--sh-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
              <Icon name={isManualResult ? "message-square" : "sparkles"} size={16} color="var(--green)" stroke={2} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--green-d)" }}>
                {isManualResult ? "부모 코멘트" : "AI 총평"}
              </span>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-soft)", fontWeight: 500, lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {result.feedback}
            </p>
          </div>
        )}

        {/* 문항별 결과 (AI) */}
        {result.problems.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 4px" }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
              {isManualResult ? "틀린 부분" : "문항별 결과"}
            </h2>
            {!isManualResult && (
              <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
                오답 {result.problems.filter((p) => !p.isCorrect).length} · 정답 {result.problems.filter((p) => p.isCorrect).length}
              </span>
            )}
          </div>
        )}

        {/* 수동 모드: 틀린 항목 간단 리스트 */}
        {isManualResult && result.problems.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.problems.map((p) => (
              <div
                key={p.number}
                style={{
                  background: "#fff", borderRadius: 14, padding: "13px 16px",
                  boxShadow: "var(--sh-sm)", display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <span
                  style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: "#FCE4EA", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name="x" size={14} color="#E11D48" stroke={3} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{p.question}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI 모드: 문항 카드 */}
        {!isManualResult && result.problems.map((p) => (
          <QCard
            key={p.number}
            p={p}
            editing={editing[p.number]}
            onStartEdit={() =>
              setEditing((prev) => ({
                ...prev,
                [p.number]: { isCorrect: p.isCorrect, studentAnswer: p.studentAnswer, correctAnswer: p.correctAnswer ?? "", explanation: p.explanation ?? "" },
              }))
            }
            onCancelEdit={() => setEditing((prev) => { const n = { ...prev }; delete n[p.number]; return n; })}
            onChangeEdit={(patch) => setEditing((prev) => ({ ...prev, [p.number]: { ...prev[p.number], ...patch } }))}
          />
        ))}

        {/* 문제 추가 */}
        {!isManualResult && (
          showAddProblem ? (
            <div style={{
              background: "#fff", borderRadius: "var(--r-card)", padding: 16,
              boxShadow: "var(--sh-md)", border: "2px solid var(--green-100)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Icon name="plus-circle" size={16} color="var(--green-d)" stroke={2} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--green-d)" }}>문제 추가</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  value={addQuestion}
                  onChange={(e) => setAddQuestion(e.target.value)}
                  placeholder="문제 내용"
                  style={{
                    width: "100%", border: "1.5px solid var(--line-strong)", borderRadius: 10,
                    padding: "9px 12px", fontSize: 13.5, color: "var(--text)", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={addStudentAnswer}
                    onChange={(e) => setAddStudentAnswer(e.target.value)}
                    placeholder="학생 답"
                    style={{
                      flex: 1, border: "1.5px solid var(--line-strong)", borderRadius: 10,
                      padding: "9px 12px", fontSize: 13.5, color: "var(--text)", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <input
                    value={addCorrectAnswer}
                    onChange={(e) => setAddCorrectAnswer(e.target.value)}
                    placeholder="정답"
                    style={{
                      flex: 1, border: "1.5px solid var(--line-strong)", borderRadius: 10,
                      padding: "9px 12px", fontSize: 13.5, color: "var(--text)", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => setAddIsCorrect(val)}
                      style={{
                        flex: 1, height: 36, borderRadius: 10, fontWeight: 800, fontSize: 13.5,
                        border: `2px solid ${addIsCorrect === val ? (val ? "var(--green)" : "#F2607D") : "var(--line-strong)"}`,
                        background: addIsCorrect === val ? (val ? "var(--green)" : "#F2607D") : "#fff",
                        color: addIsCorrect === val ? "#fff" : "var(--muted)",
                        cursor: "pointer",
                      }}
                    >
                      {val ? "O 정답" : "X 오답"}
                    </button>
                  ))}
                </div>
                {!addIsCorrect && (
                  <input
                    value={addExplanation}
                    onChange={(e) => setAddExplanation(e.target.value)}
                    placeholder="풀이 설명 (선택)"
                    style={{
                      width: "100%", border: "1.5px solid var(--line-strong)", borderRadius: 10,
                      padding: "9px 12px", fontSize: 13.5, color: "var(--text)", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={() => setShowAddProblem(false)}
                    style={{
                      flex: 1, height: 40, borderRadius: 10,
                      border: "1.5px solid var(--line-strong)", background: "#fff",
                      color: "var(--muted)", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddProblem}
                    disabled={!addQuestion.trim()}
                    style={{
                      flex: 1, height: 40, borderRadius: 10, border: "none",
                      background: addQuestion.trim() ? "var(--green)" : "var(--line-strong)",
                      color: addQuestion.trim() ? "#fff" : "var(--faint)",
                      fontWeight: 800, fontSize: 13.5, cursor: "pointer",
                    }}
                  >
                    추가하기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddProblem(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                height: 44, borderRadius: 14,
                border: "1.5px dashed var(--line-strong)", background: "var(--surface-2)",
                color: "var(--green-d)", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
              }}
            >
              <Icon name="plus" size={16} color="var(--green-d)" stroke={2.5} />
              인식되지 않은 문제 추가
            </button>
          )
        )}

        {hasEdits && (
          <button
            onClick={saveCorrections}
            disabled={saving}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: "var(--amber)", color: "#fff",
              fontWeight: 800, fontSize: 15, cursor: saving ? "default" : "pointer",
              boxShadow: "0 6px 14px -6px rgba(245,158,11,.7)", opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "저장 중..." : "수정 내용 저장하기"}
          </button>
        )}

        {!hasEdits && !rewardDone && (
          <button
            onClick={() => {
              // 점수 기반이면 (맞은 개수 × 개당 리워드)로 제안 금액 미리 채움
              if (rewardTrigger === "score" && score && score.total > 0) {
                setRewardAmount(String(score.score * defaultRewardAmount));
              }
              setShowRewardModal(true);
            }}
            style={{
              width: "100%", height: 54, borderRadius: 16, border: "none",
              background: "var(--green)", color: "#fff",
              fontWeight: 800, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "var(--sh-hero-green)",
            }}
          >
            <Icon name="check-circle" size={20} color="#fff" stroke={2} />
            검사 완료
          </button>
        )}

        {rewardDone && (
          <div style={{
            textAlign: "center", padding: "12px 0",
            fontSize: 14, fontWeight: 700, color: "var(--green-d)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Icon name="check-circle" size={18} color="var(--green-d)" stroke={2} />
            검사 완료됨
          </div>
        )}

        <button
          onClick={() => { setResult(null); setScore(null); setEditing({}); setCheckMode("ai"); setRewardDone(false); }}
          style={{ padding: "8px 0", fontSize: 13.5, color: "var(--faint)", background: "none", border: "none", cursor: "pointer", textAlign: "center" }}
        >
          다시 채점하기
        </button>

        {/* 리워드 지급 모달 */}
        {showRewardModal && (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,.45)", display: "flex",
              alignItems: "center", justifyContent: "center", padding: 20,
            }}
            onClick={() => setShowRewardModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: 24, padding: "28px 24px 24px",
                width: "100%", maxWidth: 340, boxShadow: "var(--sh-md)",
                boxSizing: "border-box",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
                  background: "var(--amber-100)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="star" size={28} color="var(--amber-d)" stroke={2} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                  {rewardName} 지급
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
                  검사 완료 후 자녀에게 지급할 {rewardName}
                </p>
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--surface-2)", borderRadius: 14, padding: "10px 14px", marginBottom: 20,
              }}>
                <input
                  type="number"
                  min={0}
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  style={{
                    flex: 1, height: 44, border: "1.5px solid var(--line-strong)",
                    borderRadius: 10, padding: "0 12px", fontSize: 22, fontWeight: 800,
                    color: "var(--text)", outline: "none", textAlign: "center", background: "#fff",
                    boxSizing: "border-box", minWidth: 0,
                  }}
                />
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--muted)", flexShrink: 0 }}>
                  {rewardUnit}
                </span>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowRewardModal(false)}
                  style={{
                    flex: 1, height: 48, borderRadius: 14,
                    border: "1.5px solid var(--line-strong)", background: "#fff",
                    color: "var(--muted)", fontWeight: 800, fontSize: 14, cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleRewardComplete}
                  disabled={saving}
                  style={{
                    flex: 1, height: 48, borderRadius: 14, border: "none",
                    background: "var(--green)", color: "#fff",
                    fontWeight: 800, fontSize: 14, cursor: saving ? "default" : "pointer",
                    boxShadow: "var(--sh-green)", opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "처리 중..." : "확인"}
                </button>
              </div>
            </div>
          </div>
        )}

        {savedMsg && (
          <div
            style={{
              position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
              background: "var(--text)", color: "#fff",
              padding: "12px 20px", borderRadius: 999,
              fontSize: 13.5, fontWeight: 700, boxShadow: "var(--sh-md)", whiteSpace: "nowrap",
            }}
          >
            {savedMsg} ✓
          </div>
        )}
      </div>
    );
  }

  // ── 입력 뷰 ─────────────────────────────────────────────

  return (
    <>
      {/* 검사 방식 탭 */}
      <div
        style={{
          display: "flex", gap: 8, marginBottom: 16,
          background: "var(--surface-2)", borderRadius: 14, padding: 4,
        }}
      >
        {(["ai", "manual"] as const).map((m) => {
          const on = checkMode === m;
          return (
            <button
              key={m}
              onClick={() => { setCheckMode(m); setError(""); }}
              style={{
                flex: 1, height: 38, borderRadius: 10, fontWeight: 800, fontSize: 13.5,
                border: "none",
                background: on ? "#fff" : "transparent",
                color: on ? "var(--text)" : "var(--muted)",
                boxShadow: on ? "var(--sh-sm)" : "none",
                cursor: "pointer",
              }}
            >
              {m === "ai" ? "AI 채점" : "직접 입력"}
            </button>
          );
        })}
      </div>

      {/* AI 채점 폼 */}
      {checkMode === "ai" && (
        <div
          style={{
            background: "#fff", borderRadius: "var(--r-card)",
            padding: 16, boxShadow: "var(--sh-md)",
            display: "flex", flexDirection: "column", gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-soft)", marginBottom: 8 }}>
              사진 첨부 <span style={{ color: "var(--faint)", fontWeight: 600 }}>(선택)</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%", height: 96, borderRadius: 16, cursor: "pointer",
                border: "1.5px dashed var(--line-strong)", background: "var(--surface-2)",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 7,
              }}
            >
              <Icon name="camera" size={24} color="var(--green-d)" stroke={1.9} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>사진 추가하기</span>
            </button>
            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 10 }} />
                    <button
                      onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                      style={{
                        position: "absolute", top: 4, right: 4,
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#F2607D", border: "none", color: "#fff",
                        fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-soft)", marginBottom: 8 }}>
              메모 <span style={{ color: "var(--faint)", fontWeight: 600 }}>(선택)</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"숙제 내용이나 학생 답을 입력하세요\n예) 1번 정답 O, 2번 틀림"}
              rows={3}
              style={{
                width: "100%", border: "1.5px solid var(--line-strong)", borderRadius: 14,
                padding: "12px 14px", fontSize: 14, color: "var(--text)",
                resize: "none", outline: "none", fontFamily: "inherit", background: "var(--surface-2)",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#FEF2F2", borderRadius: 14, padding: "14px 16px",
              border: "1px solid #FECACA",
            }}>
              <p style={{ color: "#DC2626", fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>
                {error}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {(errorCode === "timeout" || errorCode === "payload_too_large") && images.length > 1 && (
                  <button
                    onClick={() => {
                      setImages((prev) => prev.slice(0, Math.ceil(prev.length / 2)));
                      setError("");
                      setErrorCode("");
                    }}
                    style={{
                      flex: 1, height: 36, borderRadius: 10, border: "1px solid #FECACA",
                      background: "#fff", color: "#DC2626", fontWeight: 700, fontSize: 12.5,
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    사진 줄여서 재시도
                  </button>
                )}
                <button
                  onClick={() => {
                    setCheckMode("manual");
                    setError("");
                    setErrorCode("");
                  }}
                  style={{
                    flex: 1, height: 36, borderRadius: 10, border: "1px solid var(--line-strong)",
                    background: "#fff", color: "var(--text-soft)", fontWeight: 700, fontSize: 12.5,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  직접 입력으로 전환
                </button>
              </div>
            </div>
          )}

          {checking ? (
            <AiProcessing label="AI가 채점하고 있어요" />
          ) : (
            <button
              onClick={handleCheck}
              disabled={checking}
              style={{
                width: "100%", height: 54, borderRadius: 16, border: "none",
                background: "var(--green)", color: "#fff",
                fontWeight: 800, fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "var(--sh-green)",
              }}
            >
              <Icon name="clipboard-check" size={20} color="#fff" stroke={2} />
              {checkBtnLabel()}
            </button>
          )}
          {!images.length && !text.trim() && (
            <p style={{ fontSize: 12, textAlign: "center", color: "var(--faint)" }}>
              사진이나 메모 없이 누르면 확인 완료로만 저장됩니다
            </p>
          )}
        </div>
      )}

      {/* 수동 입력 폼 */}
      {checkMode === "manual" && (
        <ManualCheckForm
          onSubmit={handleManualSubmit}
          onCancel={() => setCheckMode("ai")}
          submitting={saving}
        />
      )}

      {/* Ad Gate Modal */}
      {showAdGate && (
        <AdGateModal
          onWatchComplete={onAdComplete}
          onManualEntry={onAdManual}
          onClose={() => setShowAdGate(false)}
        />
      )}
    </>
  );
}
