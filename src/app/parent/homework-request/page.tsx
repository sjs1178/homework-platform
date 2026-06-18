import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import RequestList from "./RequestList";

export default async function ParentHomeworkRequestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: pair } = await supabase
    .from("pairs")
    .select("id, child_id")
    .eq("parent_id", user.id)
    .eq("status", "active")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  let childName = "자녀";
  if (pair?.child_id) {
    const { data: childProfile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", pair.child_id)
      .single();
    childName = childProfile?.display_name ?? "자녀";
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F5F5F5", padding: 24 }}>
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <BackButton />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#13241B", margin: 0 }}>숙제 등록 요청</h1>
        </div>
        <RequestList childName={childName} />
      </div>
    </main>
  );
}
