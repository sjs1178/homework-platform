import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "4px 18px 12px", gap: 6 }}>
        <Skeleton><Skeleton.Circle size={40} /></Skeleton>
        <Skeleton><Skeleton.Bar width={100} height={20} /></Skeleton>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <Skeleton>
          {/* 자녀 정보 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Skeleton.Circle size={48} />
            <div>
              <Skeleton.Bar width={80} height={14} />
              <Skeleton.Bar width={50} height={12} style={{ marginTop: 6 }} />
            </div>
          </div>
          {/* 입력 영역 */}
          <Skeleton.Card height={160} style={{ marginTop: 8 }} />
          {/* 버튼 */}
          <Skeleton.Bar width="100%" height={48} radius={14} style={{ marginTop: 16 }} />
        </Skeleton>
      </div>
    </div>
  );
}
