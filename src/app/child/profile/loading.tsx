import Skeleton from "@/components/ui/Skeleton";
import BottomNav from "@/components/ui/BottomNav";

export default function Loading() {
  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "4px 18px 14px", gap: 6 }}>
        <Skeleton><Skeleton.Circle size={40} /></Skeleton>
        <Skeleton><Skeleton.Bar width={130} height={20} /></Skeleton>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <Skeleton>
          {/* 아바타 */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Skeleton.Circle size={80} />
          </div>
          {/* 프로필 폼 */}
          <Skeleton.Card height={60} style={{ marginTop: 8 }} />
          <Skeleton.Card height={60} style={{ marginTop: 12 }} />
          <Skeleton.Card height={100} style={{ marginTop: 24 }} />
        </Skeleton>
      </div>
      <BottomNav active="내정보" role="child" />
    </div>
  );
}
