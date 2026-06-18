import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "pending";

  const { data, error } = await supabase
    .from("homework_requests")
    .select("*")
    .eq("parent_id", user.id)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "create") {
    const { pairId, parentId, imageBase64, comment } = body;
    if (!pairId || !parentId) {
      return NextResponse.json({ error: "pairId, parentId 필요" }, { status: 400 });
    }

    let imageUrl: string | null = null;

    if (imageBase64) {
      const buffer = Buffer.from(imageBase64, "base64");
      const fileName = `${pairId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("homework-request-images")
        .upload(fileName, buffer, { contentType: "image/jpeg", upsert: false });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from("homework-request-images")
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("homework_requests")
      .insert({
        pair_id: pairId,
        child_id: user.id,
        parent_id: parentId,
        image_url: imageUrl,
        comment: comment ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ request: data });
  }

  if (action === "accept" || action === "reject") {
    const { requestId } = body;
    if (!requestId) return NextResponse.json({ error: "requestId 필요" }, { status: 400 });

    const { error } = await supabase
      .from("homework_requests")
      .update({ status: action === "accept" ? "accepted" : "rejected", updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("parent_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
}
