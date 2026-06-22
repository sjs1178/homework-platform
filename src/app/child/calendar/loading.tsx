import Skeleton from "@/components/ui/Skeleton";
import BottomNav from "@/components/ui/BottomNav";

export default function Loading() {
  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "4px 18px 12px", gap: 6 }}>
        <Skeleton><Skeleton.Circle size={40} /></Skeleton>
        <Skeleton><Skeleton.Bar width={100} height={20} /></Skeleton>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <Skeleton>
          {/* 캘린더 그리드 */}
          <div style={{ background: "#fff", borderRadius: 20, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <Skeleton.Bar width="40%" height={16} style={{ margin: "0 auto 16px" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton.Bar key={i} width="100%" height={32} radius={10} />
              ))}
            </div>
          </div>
          {/* 날짜별 숙제 */}
          <Skeleton.Card height={100} style={{ marginTop: 16 }} />
        </Skeleton>
      </div>
      <BottomNav active="캘린더" role="child" />
    </div>
  );
}
