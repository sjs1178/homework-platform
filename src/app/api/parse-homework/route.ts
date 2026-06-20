import { NextRequest, NextResponse } from "next/server";
import { parseHomeworkText, parseHomeworkImage, parseHomeworkMulti } from "@/lib/parse-homework";
import type { SubjectRule } from "@/lib/types";
import type { AiProvider } from "@/lib/ai-token";

function toUserFriendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("quota") || lower.includes("rate") || lower.includes("429"))
    return "API 키의 사용 한도가 초과되었어요. 잠시 후 다시 시도하거나, 다른 AI 키를 사용해 주세요.";
  if (lower.includes("invalid") && lower.includes("key"))
    return "API 키가 유효하지 않아요. 설정에서 키를 다시 확인해 주세요.";
  if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("403"))
    return "API 키 인증에 실패했어요. 설정에서 키를 다시 확인해 주세요.";
  if (lower.includes("timeout") || lower.includes("timed out"))
    return "AI 응답 시간이 초과되었어요. 잠시 후 다시 시도해 주세요.";
  if (lower.includes("network") || lower.includes("fetch"))
    return "네트워크 오류가 발생했어요. 인터넷 연결을 확인해 주세요.";
  return "AI 처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rules: SubjectRule[] = body.rules ?? [];
  const userApiKey: string | undefined = body.aiToken || undefined;
  const userProvider: AiProvider | undefined = body.aiProvider || undefined;

  try {
    // 복수 이미지 + 텍스트 혼합 입력
    if (body.images?.length) {
      const items = await parseHomeworkMulti(body.images, body.text || undefined, rules, userApiKey, userProvider);
      return NextResponse.json({ items });
    }
    // 레거시: 단일 이미지
    if (body.imageBase64 && body.mediaType) {
      const items = await parseHomeworkImage(body.imageBase64, body.mediaType, rules, userApiKey, userProvider);
      return NextResponse.json({ items });
    }
    if (body.text) {
      const items = await parseHomeworkText(body.text, rules, userApiKey, userProvider);
      return NextResponse.json({ items });
    }
    return NextResponse.json({ error: "text 또는 images 필요" }, { status: 400 });
  } catch (err) {
    console.error(err);
    const raw = err instanceof Error ? err.message : "파싱 실패";
    const msg = toUserFriendlyError(raw);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
