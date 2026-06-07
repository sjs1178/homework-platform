"use client";

import { useEffect } from "react";

interface Homework {
  id: string;
  subject: string;
  description: string;
  due_date: string;
  due_time: string | null;
  is_completed: boolean;
}

export default function NotificationSetup({ homeworks }: { homeworks: Homework[] }) {
  useEffect(() => {
    if (!("Notification" in window)) return;

    async function setup() {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") return;

      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      homeworks
        .filter((hw) => !hw.is_completed && hw.due_time)
        .forEach((hw) => {
          const dueAt = new Date(`${hw.due_date}T${hw.due_time}`).getTime();
          const notifyAt = dueAt - ONE_HOUR;
          const delay = notifyAt - now;

          if (delay > 0 && delay < 24 * ONE_HOUR) {
            setTimeout(() => {
              new Notification("숙제 알림 📚", {
                body: `1시간 후 마감: ${hw.subject} — ${hw.description}`,
                icon: "/favicon.ico",
              });
            }, delay);
          }
        });
    }

    setup();
  }, [homeworks]);

  return null;
}
