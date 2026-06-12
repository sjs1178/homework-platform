"use client";

import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

interface Props {
  title: string;
  backHref?: string; // 명시하면 해당 경로로, 없으면 history.back()
}

export default function PageHeader({ title, backHref }: Props) {
  const router = useRouter();

  function handleBack() {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 18px 14px",
        flexShrink: 0,
      }}
    >
      <button
        onClick={handleBack}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2} />
      </button>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>
        {title}
      </h1>
    </div>
  );
}
