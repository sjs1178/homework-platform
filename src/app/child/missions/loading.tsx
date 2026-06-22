import Skeleton from "@/components/ui/Skeleton";
import BottomNav from "@/components/ui/BottomNav";

export default function Loading() {
  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 18px 8px", gap: 6 }}>
        <Skeleton><Skeleton.Circle size={40} /></Skeleton>
        <Skeleton><Skeleton.Bar width={100} height={20} /></Skeleton>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <Skeleton>
          <Skeleton.Card height={120} style={{ marginTop: 8 }} />
          <Skeleton.Card height={120} style={{ marginTop: 12 }} />
          <Skeleton.Card height={120} style={{ marginTop: 12 }} />
        </Skeleton>
      </div>
      <BottomNav active="홈" role="child" />
    </div>
  );
}
