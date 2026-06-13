"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/ui/Icon";
import { KiddoloopAppicon } from "@/components/ui/Logo";

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

declare global {
  interface Window {
    onNativeGoogleToken?: (idToken: string, nonce?: string) => void;
    isKiddoloopApp?: boolean;
  }
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 앱(WebView)에서 네이티브 구글 로그인 완료 시 호출되는 훅
    window.onNativeGoogleToken = async (idToken: string, nonce?: string) => {
      try {
        const res = await fetch("/api/auth/google-native", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ idToken, nonce }),
        });
        const data = await res.json();
        if (data.ok) {
          router.replace(data.redirectTo ?? "/");
        } else {
          alert("로그인 실패: " + (data.error ?? "unknown"));
        }
      } catch {
        alert("네트워크 오류가 발생했습니다.");
      }
    };

    // 앱 환경 여부 플래그 (Android JS Bridge 존재 여부로 판단)
    window.isKiddoloopApp = !!(window as unknown as Record<string, unknown>)["AndroidNativeAuth"];

    return () => {
      delete window.onNativeGoogleToken;
    };
  }, [router]);

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
        <KiddoloopAppicon size={78} />
        <div
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600,
            fontSize: 28,
            marginTop: 18,
            letterSpacing: "0em",
            whiteSpace: "nowrap",
            color: "var(--ink)",
          }}
        >
          kiddoloop
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--muted)",
            fontWeight: 600,
            marginTop: 6,
            whiteSpace: "nowrap",
          }}
        >
          아이가 스스로 만드는 숙제 루틴
        </div>
      </div>

      {/* 일러스트 */}
      <div
        style={{
          flex: "1 1 auto",
          display: "flex",
          alignItems: "center",
          padding: "26px 0",
          minHeight: 180,
        }}
      >
        <div style={{ width: "100%", borderRadius: 24, overflow: "hidden" }}>
          <Image
            src="/login-illustration.png"
            alt="부모와 자녀가 함께하는 숙제 일러스트"
            width={860}
            height={604}
            sizes="(max-width: 430px) 100vw, 430px"
            priority
            style={{ width: "100%", height: "auto", display: "block" }}
          />
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
