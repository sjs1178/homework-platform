"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

interface HwRequest {
  id: string;
  pair_id: string;
  child_id: string;
  parent_id: string;
  image_url: string | null;
  comment: string | null;
  status: string;
  created_at: string;
}

interface Props {
  childName: string;
}

export default function RequestList({ childName }: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState<HwRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/homework-request?status=pending")
      .then((r) => r.json())
      .then((d) => {
        setRequests(d.requests ?? []);
        setLoading(false);
      });
  }, []);

  async function handleAction(requestId: string, action: "accept" | "reject") {
    if (action === "reject" && !confirm("이 요청을 거절할까요?")) return;

    await fetch("/api/homework-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, requestId }),
    });

    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    if (action === "accept") {
      router.push("/parent/homework/new");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "#7B8A81", fontSize: 14, fontWeight: 600 }}>
        불러오는 중...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{
          width: 88, height: 88, borderRadius: 26, background: "#E9F4EC",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px",
        }}>
          <Icon name="message-circle" size={46} color="#9DB3A6" stroke={1.9} />
        </div>
        <p style={{ fontSize: 17, fontWeight: 800, color: "#13241B" }}>
          대기 중인 요청이 없어요
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {requests.map((req) => {
        const date = new Date(req.created_at);
        const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

        return (
          <div
            key={req.id}
            style={{
              background: "#fff", borderRadius: 18,
              boxShadow: "0 1px 4px rgba(0,0,0,.06)",
              overflow: "hidden",
            }}
          >
            {/* 헤더 */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #F1F5F9",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#E9F4EC",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="send" size={18} color="#16A34A" stroke={2} />
                </span>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#13241B" }}>
                    {childName}의 요청
                  </span>
                  <div style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600, marginTop: 1 }}>
                    {timeStr}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px",
                borderRadius: 999, background: "#FEF9C3", color: "#92400E",
              }}>
                대기 중
              </span>
            </div>

            {/* 이미지 */}
            {req.image_url && (
              <div style={{ padding: "12px 16px 0" }}>
                <img
                  src={req.image_url}
                  alt="숙제 사진"
                  style={{
                    width: "100%", borderRadius: 14,
                    border: "1px solid #E5E7EB",
                    maxHeight: 300, objectFit: "cover",
                  }}
                />
              </div>
            )}

            {/* 코멘트 */}
            {req.comment && (
              <div style={{ padding: "12px 16px 0" }}>
                <div style={{
                  padding: "12px 14px", borderRadius: 12,
                  background: "#F8FAFC", border: "1px solid #E2E8F0",
                  fontSize: 14, color: "#334155", fontWeight: 600, lineHeight: 1.7,
                }}>
                  {req.comment}
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
              <button
                onClick={() => handleAction(req.id, "reject")}
                style={{
                  height: 44, borderRadius: 12,
                  border: "1.5px solid #FECDD3", background: "#FFF1F2",
                  color: "#E11D48", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}
              >
                거절
              </button>
              <button
                onClick={() => handleAction(req.id, "accept")}
                style={{
                  height: 44, borderRadius: 12, border: "none",
                  background: "#16A34A", color: "#fff",
                  fontWeight: 800, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Icon name="sparkles" size={17} color="#fff" stroke={2} />
                AI로 숙제 등록하기
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
