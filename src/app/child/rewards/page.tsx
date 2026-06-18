import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import RewardBody from "./RewardBody";

export default async function ChildRewardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("pair_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.pair_id) redirect("/child/dashboard");

  const { data: logs } = await supabase
    .from("reward_logs")
    .select("*")
    .eq("pair_id", profile.pair_id)
    .eq("child_id", user.id)
    .order("created_at", { ascending: false });

  const { data: settings } = await supabase
    .from("reward_settings")
    .select("*")
    .eq("pair_id", profile.pair_id)
    .single();

  const { data: catalogRaw } = await supabase
    .from("reward_catalog")
    .select("*")
    .eq("pair_id", profile.pair_id)
    .order("cost", { ascending: true });

  const totalEarned = (logs ?? []).filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
  const totalSpent = (logs ?? []).filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);
  const balance = totalEarned - totalSpent;

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#F1F7F3",
        display: "flex",
        flexDirection: "column",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <RewardBody
          childName={profile.display_name ?? "자녀"}
          balance={balance}
          logs={(logs ?? []).slice(0, 20)}
          catalog={catalogRaw ?? []}
          pairId={profile.pair_id}
          unit={settings?.point_reward_unit ?? "P"}
        />
      </div>
      <BottomNav active="리워드" />
    </div>
  );
}
