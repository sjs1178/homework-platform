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
    <main style={{ minHeight: "100vh", background: "#F5F5F5", padding: 24 }}>
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <BackButton />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#13241B", margin: 0 }}>숙제 등록 요청</h1>
        </div>
        <p style={{ fontSize: 14, color: "#7B8A81", fontWeight: 600, marginBottom: 24, paddingLeft: 4 }}>
          숙제를 사진 찍어서 부모님께 등록을 요청해요
        </p>
        <RequestForm pairId={pair.id} parentId={pair.parent_id} />
      </div>
    </main>
  );
}
