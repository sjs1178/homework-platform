import Anthropic from "@anthropic-ai/sdk";
import type { HomeworkItem, SubjectRule } from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  rules: SubjectRule[] = []
): Promise<HomeworkItem[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    system: [{ type: "text", text: buildSystemPrompt(rules), cache_control: { type: "ephemeral" } }] as any,
    messages: [{ role: "user", content: text }],
  });

  return parseResponse((response.content[0] as Anthropic.TextBlock).text);
}

export async function parseHomeworkImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
  rules: SubjectRule[] = []
): Promise<HomeworkItem[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    system: [{ type: "text", text: buildSystemPrompt(rules), cache_control: { type: "ephemeral" } }] as any,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: "이 숙제 이미지에서 숙제 일정을 추출해줘." },
        ],
      },
    ],
  });

  return parseResponse((response.content[0] as Anthropic.TextBlock).text);
}

function parseResponse(raw: string): HomeworkItem[] {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const arrayMatch = raw.match(/(\[[\s\S]*\])/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : arrayMatch ? arrayMatch[1].trim() : raw;
  try {
    return JSON.parse(jsonStr) as HomeworkItem[];
  } catch {
    console.error("Claude returned invalid JSON:", raw);
    return [];
  }
}
