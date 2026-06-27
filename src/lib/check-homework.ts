import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider } from "./ai-token";
import { callCheckHomework } from "./ai-caller";

const systemClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 55_000,
});

export interface Problem {
  number: number;
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface CheckResult {
  subject: string;
  problems: Problem[];
  score: number;
  total: number;
  feedback: string;
}

const SYSTEM_PROMPT = `You are a homework checker for Korean elementary/middle school students.
Analyze the homework images and check every problem shown.

Return ONLY a JSON object in this exact format:
{
  "subject": "과목명",
  "problems": [
    {
      "number": 1,
      "question": "문제 내용",
      "studentAnswer": "학생 답",
      "correctAnswer": "정답",
      "isCorrect": true,
      "explanation": null
    },
    {
      "number": 2,
      "question": "문제 내용",
      "studentAnswer": "학생 오답",
      "correctAnswer": "정답",
      "isCorrect": false,
      "explanation": "왜 틀렸는지 설명 + 어떻게 풀어야 하는지 (Korean, friendly tone for children)"
    }
  ],
  "score": 1,
  "total": 2,
  "feedback": "전체적인 피드백 (Korean, encouraging tone)"
}

Rules:
- If student answer is blank/missing, mark as incorrect with studentAnswer "미작성"
- If student handwriting is unreadable, mark as incorrect with studentAnswer "판독 불가" and explanation "손글씨를 인식하지 못했어요. 부모님이 직접 확인해 주세요."
- If a problem's text is partially visible or cut off, still include it with what you can read, set question to what is visible
- If an image is blurry or too dark to read at all, still return valid JSON with problems you CAN read from other images. Set feedback to mention which image was hard to read
- NEVER fail or refuse. Always return valid JSON with at least the problems you could identify
- explanation must be null when isCorrect is true
- explanation must be in Korean when isCorrect is false
- feedback must be encouraging even when score is low
- Output ONLY the raw JSON. No markdown, no explanation.`;

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function checkHomeworkByText(
  text: string,
  userApiKey?: string,
  userProvider?: AiProvider
): Promise<CheckResult> {
  let raw: string;
  if (userApiKey && userProvider) {
    raw = await callCheckHomework(SYSTEM_PROMPT, { type: "text", text }, userProvider, userApiKey);
  } else {
    const response = await systemClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `다음 숙제 내용을 검사해줘:\n\n${text}` }],
    });
    raw = (response.content[0] as Anthropic.TextBlock).text.trim();
  }
  return parseCheckResult(raw);
}

export async function checkHomework(
  images: { base64: string; mediaType: MediaType }[],
  userApiKey?: string,
  userProvider?: AiProvider
): Promise<CheckResult> {
  let raw: string;
  if (userApiKey && userProvider) {
    raw = await callCheckHomework(SYSTEM_PROMPT, { type: "images", images }, userProvider, userApiKey);
  } else {
    const content: Anthropic.MessageParam["content"] = [
      ...images.map((img) => ({
        type: "image" as const,
        source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
      })),
      { type: "text" as const, text: "이 숙제 이미지들을 검사해줘. 모든 문제를 찾아서 채점해줘." },
    ];
    const response = await systemClient.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });
    raw = (response.content[0] as Anthropic.TextBlock).text.trim();
  }
  return parseCheckResult(raw);
}

function parseCheckResult(raw: string): CheckResult {
  const match = raw.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(match ? match[0] : raw) as CheckResult;
  } catch {
    console.error("Check homework returned invalid JSON:", raw);
    throw new Error("채점 결과를 파싱할 수 없습니다.");
  }
}
