import Skeleton from "@/components/ui/Skeleton";
import BottomNav from "@/components/ui/BottomNav";

export default function Loading() {
  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "4px 18px 12px", gap: 6 }}>
        <Skeleton><Skeleton.Circle size={40} /></Skeleton>
        <Skeleton><Skeleton.Bar width={130} height={20} /></Skeleton>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <Skeleton>
          <Skeleton.Card height={100} />
          <Skeleton.Card height={200} style={{ marginTop: 16 }} />
          <Skeleton.Card height={150} style={{ marginTop: 16 }} />
        </Skeleton>
      </div>
      <BottomNav active="홈" role="parent" />
    </div>
  );
}
