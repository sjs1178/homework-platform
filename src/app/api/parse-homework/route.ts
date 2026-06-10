import { NextRequest, NextResponse } from "next/server";
import { parseHomeworkText, parseHomeworkImage } from "@/lib/parse-homework";
import type { SubjectRule } from "@/lib/types";
import type { AiProvider } from "@/lib/ai-token";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rules: SubjectRule[] = body.rules ?? [];
  const userApiKey: string | undefined = body.aiToken || undefined;
  const userProvider: AiProvider | undefined = body.aiProvider || undefined;

  try {
    if (body.imageBase64 && body.mediaType) {
      const items = await parseHomeworkImage(body.imageBase64, body.mediaType, rules, userApiKey, userProvider);
      return NextResponse.json({ items });
    }
    if (body.text) {
      const items = await parseHomeworkText(body.text, rules, userApiKey, userProvider);
      return NextResponse.json({ items });
    }
    return NextResponse.json({ error: "text 또는 imageBase64 필요" }, { status: 400 });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "파싱 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
