"use client";

import { useState, useRef } from "react";
import Icon from "@/components/ui/Icon";

interface Props {
  pairId: string;
  parentId: string;
}

export default function RequestForm({ pairId, parentId }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!imageBase64 && !comment.trim()) return;
    setSending(true);

    const res = await fetch("/api/homework-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        pairId,
        parentId,
        imageBase64,
        comment: comment.trim() || null,
      }),
    });

    setSending(false);
    if (res.ok) {
      setSent(true);
    } else {
      alert("전송에 실패했어요. 다시 시도해주세요.");
    }
  }

  if (sent) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{
          width: 88, height: 88, borderRadius: 26, background: "#E9F4EC",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Icon name="send" size={42} color="#9DB3A6" stroke={1.9} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 800, color: "#13241B", marginBottom: 8 }}>
          요청을 보냈어요!
        </p>
        <p style={{ fontSize: 14, color: "#7B8A81", fontWeight: 600, marginBottom: 24 }}>
          부모님이 확인하면 숙제가 등록돼요
        </p>
        <button
          onClick={() => {
            setSent(false);
            setImagePreview(null);
            setImageBase64(null);
            setComment("");
          }}
          style={{
            height: 44, padding: "0 24px", borderRadius: 12,
            border: "1.5px solid #D1D5DB", background: "#fff",
            fontSize: 14, fontWeight: 700, color: "#374151", cursor: "pointer",
            marginRight: 8,
          }}
        >
          추가 요청
        </button>
        <button
          onClick={() => window.history.back()}
          style={{
            height: 44, padding: "0 24px", borderRadius: 12,
            border: "none", background: "#16A34A",
            fontSize: 14, fontWeight: 800, color: "#fff", cursor: "pointer",
          }}
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 사진 촬영/업로드 */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#7B8A81", marginBottom: 10 }}>
          숙제 사진
        </p>
        {imagePreview ? (
          <div style={{ position: "relative" }}>
            <img
              src={imagePreview}
              alt="숙제 사진"
              style={{
                width: "100%", borderRadius: 16, border: "1.5px solid #E5E7EB",
                maxHeight: 300, objectFit: "cover",
              }}
            />
            <button
              onClick={() => { setImagePreview(null); setImageBase64(null); }}
              style={{
                position: "absolute", top: 8, right: 8,
                width: 32, height: 32, borderRadius: 999,
                background: "rgba(0,0,0,.6)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="x" size={18} color="#fff" stroke={2.5} />
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.setAttribute("capture", "environment");
                  fileRef.current.click();
                }
              }}
              style={{
                height: 100, borderRadius: 16,
                border: "2px dashed #D1D5DB", background: "#F9FAFB",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 8, cursor: "pointer",
              }}
            >
              <Icon name="camera" size={28} color="#9CA3AF" stroke={1.8} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7280" }}>촬영하기</span>
            </button>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.removeAttribute("capture");
                  fileRef.current.click();
                }
              }}
              style={{
                height: 100, borderRadius: 16,
                border: "2px dashed #D1D5DB", background: "#F9FAFB",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 8, cursor: "pointer",
              }}
            >
              <Icon name="upload" size={28} color="#9CA3AF" stroke={1.8} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#6B7280" }}>앨범에서 선택</span>
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      {/* 코멘트 */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#7B8A81", marginBottom: 10 }}>
          부모님께 메시지 (선택)
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="예: 내일까지 해야 하는 수학 숙제예요"
          rows={3}
          style={{
            width: "100%", borderRadius: 14, padding: "14px 16px",
            border: "1.5px solid #D1D5DB", fontSize: 14, fontWeight: 600,
            color: "#13241B", resize: "none", outline: "none",
            boxSizing: "border-box", lineHeight: 1.6,
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* 전송 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={sending || (!imageBase64 && !comment.trim())}
        style={{
          width: "100%", height: 52, borderRadius: 14, border: "none",
          background: (!imageBase64 && !comment.trim()) ? "#D1D5DB" : "#16A34A",
          color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          opacity: sending ? 0.6 : 1,
        }}
      >
        {sending ? (
          "보내는 중..."
        ) : (
          <>
            <Icon name="send" size={19} color="#fff" stroke={2.2} />
            부모님께 숙제 등록 요청
          </>
        )}
      </button>
    </div>
  );
}
