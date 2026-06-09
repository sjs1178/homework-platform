"use client";

import { useEffect, useState } from "react";

type Tab = "announcements" | "terms" | "privacy";

interface Announcement {
  id: string;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface LegalDoc {
  id: string;
  doc_type: string;
  version: string;
  content: string;
  is_current: boolean;
  edited_by: string | null;
  created_at: string;
}

export default function ContentView() {
  const [tab, setTab] = useState<Tab>("announcements");

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 20 }}>콘텐츠 관리</h1>

      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {([["announcements", "공지사항"], ["terms", "이용약관"], ["privacy", "개인정보처리방침"]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 18px", borderRadius: 8, border: "none",
              background: tab === t ? "#0F172A" : "#E2E8F0",
              color: tab === t ? "#fff" : "#475569",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "terms" && <LegalTab docType="terms" label="이용약관" />}
      {tab === "privacy" && <LegalTab docType="privacy" label="개인정보처리방침" />}
    </div>
  );
}

// ── Announcements ──────────────────────────────────────

function AnnouncementsTab() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = { id: "", title: "", content: "", published: true, created_at: "", updated_at: "" };

  useEffect(() => {
    fetch("/api/admin/content/announcements")
      .then((r) => r.json())
      .then((d) => { setList(d.announcements ?? []); setLoading(false); });
  }, []);

  async function handleSave() {
    setSaving(true);
    if (isNew) {
      const res = await fetch("/api/admin/content/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editing!.title, content: editing!.content, published: editing!.published }),
      });
      const d = await res.json();
      if (d.announcement) setList((prev) => [d.announcement, ...prev]);
    } else {
      await fetch("/api/admin/content/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing!.id, title: editing!.title, content: editing!.content, published: editing!.published }),
      });
      setList((prev) => prev.map((a) => a.id === editing!.id ? { ...a, ...editing! } : a));
    }
    setEditing(null);
    setIsNew(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("공지사항을 삭제할까요?")) return;
    await fetch("/api/admin/content/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setList((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr 1fr" : "1fr", gap: 20 }}>
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            onClick={() => { setIsNew(true); setEditing({ ...emptyForm }); }}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: "#0F172A", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            + 새 공지 작성
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#94A3B8" }}>불러오는 중...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {list.map((a) => (
              <div
                key={a.id}
                style={{
                  background: "#fff", borderRadius: 10, padding: "14px 16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                  border: editing?.id === a.id ? "2px solid #0EA5E9" : "2px solid transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{a.title}</span>
                      {!a.published && (
                        <span style={{ fontSize: 10, background: "#FEF3C7", color: "#D97706", padding: "2px 6px", borderRadius: 99, fontWeight: 700 }}>
                          비공개
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                      {a.content.slice(0, 80)}{a.content.length > 80 ? "…" : ""}
                    </p>
                    <p style={{ fontSize: 11, color: "#CBD5E1", marginTop: 6 }}>{fmtDate(a.created_at)}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => { setIsNew(false); setEditing({ ...a }); }}
                      style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #E2E8F0", background: "#F8FAFC", color: "#334155", fontSize: 12, cursor: "pointer" }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #FECDD3", background: "#FFF1F2", color: "#E11D48", fontSize: 12, cursor: "pointer" }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {list.length === 0 && <p style={{ color: "#94A3B8", textAlign: "center", padding: 24 }}>공지사항이 없습니다</p>}
          </div>
        )}
      </div>

      {editing && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 16 }}>
            {isNew ? "새 공지사항" : "공지사항 수정"}
          </p>

          <Label>제목</Label>
          <input
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            style={inputStyle}
            placeholder="공지 제목"
          />

          <Label>내용</Label>
          <textarea
            value={editing.content}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            rows={10}
            style={{ ...inputStyle, height: "auto", padding: "10px 12px", lineHeight: 1.6, resize: "vertical" }}
            placeholder="공지 내용을 입력하세요"
          />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 16 }}>
            <input
              type="checkbox"
              id="pub"
              checked={editing.published}
              onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
            />
            <label htmlFor="pub" style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>공개</label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, height: 42, borderRadius: 10, border: "none", background: "#0F172A", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              {saving ? "저장 중…" : "저장"}
            </button>
            <button
              onClick={() => { setEditing(null); setIsNew(false); }}
              style={{ height: 42, padding: "0 16px", borderRadius: 10, border: "1.5px solid #E2E8F0", background: "#fff", color: "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Legal documents ────────────────────────────────────

function LegalTab({ docType, label }: { docType: "terms" | "privacy"; label: string }) {
  const [history, setHistory] = useState<LegalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [writing, setWriting] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<LegalDoc | null>(null);

  useEffect(() => {
    fetch(`/api/admin/content/legal?type=${docType}`)
      .then((r) => r.json())
      .then((d) => {
        const docs = d.documents ?? [];
        setHistory(docs);
        // Open current version for preview by default
        const cur = docs.find((d: LegalDoc) => d.is_current);
        if (cur) setPreview(cur);
        setLoading(false);
      });
  }, [docType]);

  async function handlePublish() {
    if (!newContent.trim() || !newVersion.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/content/legal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_type: docType, content: newContent, version: newVersion }),
    });
    const d = await res.json();
    if (d.document) {
      const updated = history.map((h) => ({ ...h, is_current: false }));
      setHistory([d.document, ...updated]);
      setPreview(d.document);
      setWriting(false);
      setNewContent("");
      setNewVersion("");
    }
    setSaving(false);
  }

  const current = history.find((d) => d.is_current);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
      {/* History sidebar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>버전 이력</p>
          <button
            onClick={() => {
              setWriting(true);
              setNewContent(current?.content ?? "");
              const today = new Date();
              setNewVersion(`v${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`);
            }}
            style={{
              padding: "5px 10px", borderRadius: 6, border: "none",
              background: "#0F172A", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer",
            }}
          >
            새 버전
          </button>
        </div>

        {loading ? (
          <p style={{ color: "#94A3B8", fontSize: 13 }}>불러오는 중...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((doc) => (
              <button
                key={doc.id}
                onClick={() => { setPreview(doc); setWriting(false); }}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 12px",
                  borderRadius: 8, border: `2px solid ${preview?.id === doc.id ? "#0EA5E9" : "#E2E8F0"}`,
                  background: preview?.id === doc.id ? "#F0F9FF" : "#fff",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0F172A" }}>{doc.version}</span>
                  {doc.is_current && (
                    <span style={{ fontSize: 10, background: "#DCFCE7", color: "#15803D", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>
                      현재
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 3 }}>{fmtDate(doc.created_at)}</p>
                {doc.edited_by && <p style={{ fontSize: 11, color: "#CBD5E1" }}>by {doc.edited_by}</p>}
              </button>
            ))}
            {history.length === 0 && <p style={{ color: "#94A3B8", fontSize: 13 }}>버전 없음</p>}
          </div>
        )}
      </div>

      {/* Editor / Preview */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
        {writing ? (
          <>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 14 }}>
              {label} 새 버전 작성
            </p>
            <Label>버전명</Label>
            <input
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              style={{ ...inputStyle, marginBottom: 12 }}
              placeholder="예: v2026.06.10"
            />
            <Label>내용 (마크다운 또는 평문)</Label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={18}
              style={{ ...inputStyle, height: "auto", padding: "10px 12px", lineHeight: 1.6, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
              placeholder={`${label} 내용을 작성하세요`}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={handlePublish}
                disabled={saving || !newContent.trim() || !newVersion.trim()}
                style={{
                  flex: 1, height: 42, borderRadius: 10, border: "none",
                  background: "#0F172A", color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", opacity: !newContent.trim() || !newVersion.trim() ? 0.4 : 1,
                }}
              >
                {saving ? "게시 중…" : "현재 버전으로 게시"}
              </button>
              <button
                onClick={() => setWriting(false)}
                style={{
                  height: 42, padding: "0 16px", borderRadius: 10,
                  border: "1.5px solid #E2E8F0", background: "#fff",
                  color: "#64748B", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                취소
              </button>
            </div>
          </>
        ) : preview ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{preview.version}</span>
                {preview.is_current && (
                  <span style={{ marginLeft: 8, fontSize: 11, background: "#DCFCE7", color: "#15803D", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                    현재 버전
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>{fmtDate(preview.created_at)}</span>
            </div>
            <div
              style={{
                background: "#F8FAFC", borderRadius: 8, padding: "16px",
                fontSize: 13, color: "#334155", lineHeight: 1.8,
                whiteSpace: "pre-wrap", maxHeight: 480, overflowY: "auto",
              }}
            >
              {preview.content}
            </div>
          </>
        ) : (
          <p style={{ color: "#94A3B8" }}>왼쪽에서 버전을 선택하거나 새 버전을 작성하세요.</p>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 5 }}>{children}</p>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 42, borderRadius: 8,
  border: "1.5px solid #E2E8F0", padding: "0 12px",
  fontSize: 13.5, color: "#0F172A", outline: "none",
  boxSizing: "border-box", marginBottom: 12, display: "block",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}
