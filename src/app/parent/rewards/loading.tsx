import Skeleton from "@/components/ui/Skeleton";
import BottomNav from "@/components/ui/BottomNav";

export default function Loading() {
  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "16px 18px 8px", gap: 6 }}>
        <Skeleton><Skeleton.Circle size={40} /></Skeleton>
        <Skeleton><Skeleton.Bar width={80} height={20} /></Skeleton>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <Skeleton>
          <div style={{ borderRadius: 24, background: "linear-gradient(150deg,#FBBF24,#F59E0B)", padding: "24px", height: 120 }}>
            <Skeleton.Bar width="30%" height={14} style={{ background: "rgba(255,255,255,.3)" }} />
            <Skeleton.Bar width="50%" height={32} style={{ marginTop: 12, background: "rgba(255,255,255,.2)" }} />
          </div>
          <Skeleton.Card height={60} style={{ marginTop: 16 }} />
          <Skeleton.Card height={60} style={{ marginTop: 8 }} />
          <Skeleton.Card height={60} style={{ marginTop: 8 }} />
        </Skeleton>
      </div>
      <BottomNav active="리워드" role="parent" />
    </div>
  );
}
