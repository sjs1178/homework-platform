import AdminNav from "./AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100svh", background: "#F1F5F9" }}>
      <AdminNav />
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {children}
      </main>
    </div>
  );
}
