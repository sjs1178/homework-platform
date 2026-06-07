"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SelectRolePage() {
  const router = useRouter();

  async function handleSelectRole(role: "parent" | "child") {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_profiles").upsert({
      id: user.id,
      role,
      display_name: user.user_metadata.full_name ?? user.email,
    });

    router.push(`/${role}/dashboard`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h2 className="text-2xl font-bold">역할을 선택해주세요</h2>
      <div className="flex gap-4">
        <button
          onClick={() => handleSelectRole("parent")}
          className="w-40 h-40 flex flex-col items-center justify-center gap-3 border-2 border-blue-400 rounded-2xl hover:bg-blue-50 transition-colors"
        >
          <span className="text-4xl">👨‍👩‍👧</span>
          <span className="text-lg font-semibold text-blue-600">부모</span>
          <span className="text-xs text-gray-400">숙제를 등록해요</span>
        </button>
        <button
          onClick={() => handleSelectRole("child")}
          className="w-40 h-40 flex flex-col items-center justify-center gap-3 border-2 border-green-400 rounded-2xl hover:bg-green-50 transition-colors"
        >
          <span className="text-4xl">🧒</span>
          <span className="text-lg font-semibold text-green-600">자녀</span>
          <span className="text-xs text-gray-400">숙제를 완료해요</span>
        </button>
      </div>
    </main>
  );
}
