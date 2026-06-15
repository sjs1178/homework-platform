"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    AndroidPush?: { getToken(): string };
  }
}

export default function FcmTokenRegistration() {
  useEffect(() => {
    async function register() {
      const token = window.AndroidPush?.getToken();
      if (!token) return;

      const storedToken = localStorage.getItem("fcm_token_sent");
      if (storedToken === token) return;

      try {
        const res = await fetch("/api/device-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fcm_token: token, platform: "android" }),
        });
        if (res.ok) {
          localStorage.setItem("fcm_token_sent", token);
        }
      } catch {
        // 실패 시 다음 페이지 로드에서 재시도
      }
    }

    register();
  }, []);

  return null;
}
