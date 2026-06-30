import Anthropic from "@anthropic-ai/sdk";
import type { HomeworkItem, SubjectRule } from "./types";
import type { AiProvider } from "./ai-token";
import { callParseText, callParseImage, callParseMulti } from "./ai-caller";

const systemClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 55_000 });

function buildSystemPrompt(rules: SubjectRule[]): string {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const dow = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", weekday: "long" });

  const customRules =
    rules.length === 0
      ? "\n(없음)"
      : "\n" + rules.map((r) => `[${r.subject}]: ${r.ruleContent}`).join("\n");

  return `You are a homework scheduling assistant.
Today is ${today} (${dow}, Asia/Seoul timezone). All dueDate values MUST use the year ${today.slice(0, 4)}.

Analyze the message and return a JSON array of homework items:

[
  {
    "subject": "string (과목명, Korean)",
    "description": "string (숙제 내용, Korean)",
    "dueDate": "YYYY-MM-DD",
    "dueTime": "HH:MM or null",
    "endTime": "HH:MM or null"
  }
]

Rules:
- If no due date specified, use next weekday.
- Use 24h time format.
- For subjects not in the rules below, parse date/time from the message; if no time, set dueTime=null.
- Return [] if nothing found.

=== 과목별 규칙 ===${customRules}

IMPORTANT: Output ONLY the raw JSON array. No explanation, no markdown, no code fences.`;
}

export async function parseHomeworkText(
  text: string,
  rules: SubjectRule[] = [],
  userApiKey?: string,
  userProvider?: AiProvider
): Promise<HomeworkItem[]> {
  const prompt = buildSystemPrompt(rules);
  let raw: string;

  if (userApiKey && userProvider) {
    raw = await callParseText(prompt, text, userProvider, userApiKey);
  } else {
    const response = await systemClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      system: [{ type: "text", text: prompt, cache_control: { type: "ephemeral" } }] as any,
      messages: [{ role: "user", content: text }],
    });
    raw = (response.content[0] as Anthropic.TextBlock).text;
  }

  return parseResponse(raw);
}

export async function parseHomeworkImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
  rules: SubjectRule[] = [],
  userApiKey?: string,
  userProvider?: AiProvider
): Promise<HomeworkItem[]> {
  const prompt = buildSystemPrompt(rules);
  let raw: string;

  if (userApiKey && userProvider) {
    raw = await callParseImage(prompt, imageBase64, mediaType, userProvider, userApiKey);
  } else {
    const response = await systemClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      system: [{ type: "text", text: prompt, cache_control: { type: "ephemeral" } }] as any,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: "이 숙제 이미지에서 숙제 일정을 추출해줘." },
        ],
      }],
    });
    raw = (response.content[0] as Anthropic.TextBlock).text;
  }

  return parseResponse(raw);
}

export async function parseHomeworkMulti(
  images: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" }[],
  text?: string,
  rules: SubjectRule[] = [],
  userApiKey?: string,
  userProvider?: AiProvider
): Promise<HomeworkItem[]> {
  const prompt = buildSystemPrompt(rules);
  let raw: string;

  if (userApiKey && userProvider) {
    raw = await callParseMulti(prompt, images, text, userProvider, userApiKey);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = images.map((img) => ({
      type: "image", source: { type: "base64", media_type: img.mediaType, data: img.base64 },
    }));
    const fallbackText = "이 숙제 이미지에서 숙제 일정을 추출해줘.";
    const textContent = text?.trim() ? `${text.trim()}\n\n이 내용과 이미지에서 숙제 일정을 추출해줘.` : fallbackText;
    content.push({ type: "text", text: textContent });

    const response = await systemClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      system: [{ type: "text", text: prompt, cache_control: { type: "ephemeral" } }] as any,
      messages: [{ role: "user", content }],
    });
    raw = (response.content[0] as Anthropic.TextBlock).text;
  }

  return parseResponse(raw);
}

function parseResponse(raw: string): HomeworkItem[] {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  const jsonStr = (fenceMatch ? fenceMatch[1] : arrayMatch ? arrayMatch[0] : raw).trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // 출력이 잘렸거나 JSON이 아님 → '못 찾음'과 구분해서 에러로 surface (로그 포함)
    console.error("Parse homework: invalid JSON (rawLen=%d):", raw.length, raw.slice(0, 600));
    throw new Error("PARSE_FAIL");
  }

  if (Array.isArray(parsed)) return parsed as HomeworkItem[];
  // 모델이 { items: [...] } 형태로 감싼 경우 허용
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)) {
    return (parsed as { items: HomeworkItem[] }).items;
  }
  // 유효 JSON이지만 배열이 아님 → 항목 없음
  return [];
}
