import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import RequestForm from "./RequestForm";

export default async function ChildHomeworkRequestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: pair } = await supabase
    .from("pairs")
    .select("id, parent_id")
    .eq("child_id", user.id)
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!pair) redirect("/child/dashboard");

  return (
    <div style={{ minHeight: "100svh", background: "var(--bg)", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 18px 14px", flexShrink: 0 }}>
        <BackButton />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 }}>숙제 등록 요청</h1>
      </div>
      <div style={{ padding: "0 20px 40px" }}>
        <p style={{ fontSize: 14, color: "var(--muted)", fontWeight: 600, marginBottom: 20 }}>
          숙제를 사진 찍어서 부모님께 등록을 요청해요
        </p>
        <RequestForm pairId={pair.id} parentId={pair.parent_id} />
      </div>
    </div>
  );
}
