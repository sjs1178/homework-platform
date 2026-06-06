import { NextRequest, NextResponse } from "next/server";
import { parseHomeworkText, parseHomeworkImage } from "@/lib/parse-homework";
import type { SubjectRule } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rules: SubjectRule[] = body.rules ?? [];

  try {
    if (body.imageBase64 && body.mediaType) {
      const items = await parseHomeworkImage(body.imageBase64, body.mediaType, rules);
      return NextResponse.json({ items });
    }
    if (body.text) {
      const items = await parseHomeworkText(body.text, rules);
      return NextResponse.json({ items });
    }
    return NextResponse.json({ error: "text 또는 imageBase64 필요" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "파싱 실패" }, { status: 500 });
  }
}
