"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    onNativeFcmToken?: (token: string) => void;
  }
}

export default function FcmTokenRegistration() {
  useEffect(() => {
    window.onNativeFcmToken = async (token: string) => {
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
        // 실패 시 다음 호출에서 재시도
      }
    };

    return () => {
      window.onNativeFcmToken = undefined;
    };
  }, []);

  return null;
}
