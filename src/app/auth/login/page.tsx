"use client";

import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/ui/Icon";

function GoogleG() {
  return (
    <svg width={21} height={21} viewBox="0 0 48 48" style={{ display: "block", flexShrink: 0 }}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
    </svg>
  );
}

export default function LoginPage() {
  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <main
      style={{
        minHeight: "100svh",
        background: "#F1F7F3",
        display: "flex",
        flexDirection: "column",
        padding: "0 28px 30px",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* 브랜드 락업 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 64,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: 24,
            background: "linear-gradient(150deg,#22C55E,#15803D)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 14px 30px -10px rgba(21,128,61,.65)",
          }}
        >
          <Icon name="clipboard-check" size={38} color="#fff" stroke={2.1} />
        </div>
        <div
          style={{
            fontSize: 25,
            fontWeight: 800,
            marginTop: 20,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
            color: "var(--text)",
          }}
        >
          kiddoloop
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: "var(--muted)",
            fontWeight: 600,
            marginTop: 7,
            whiteSpace: "nowrap",
          }}
        >
          부모와 자녀가 함께하는 숙제 캘린더
        </div>
      </div>

      {/* 일러스트 자리 */}
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          alignItems: "center",
          padding: "26px 0",
          minHeight: 180,
        }}
      >
        <div
          style={{
            width: "100%",
            height: 240,
            borderRadius: 24,
            border: "1.5px dashed var(--line-strong)",
            background: "repeating-linear-gradient(135deg,#F1F5F2 0 10px,#E9F0EB 10px 20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "#8B988F",
          }}
        >
          <Icon name="image" size={26} color="#A6B2AB" stroke={1.8} />
          <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11.5, fontWeight: 600 }}>
            부모–자녀 숙제 일러스트
          </span>
        </div>
      </div>

      {/* 로그인 영역 */}
      <div style={{ flexShrink: 0 }}>
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 16,
            border: "1.5px solid var(--line-strong)",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 11,
            fontSize: 16,
            fontWeight: 800,
            color: "var(--text)",
            boxShadow: "var(--sh-sm)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <GoogleG /> Google로 시작하기
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 16,
            color: "var(--faint)",
          }}
        >
          <Icon name="lock" size={13} color="var(--faint)" stroke={2} />
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
            가입 시 이용약관 및 개인정보 처리방침에 동의합니다
          </span>
        </div>
      </div>
    </main>
  );
}
