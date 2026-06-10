export type AiProvider = "claude" | "openai" | "gemini";

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  claude: "Claude (Anthropic)",
  openai: "ChatGPT (OpenAI)",
  gemini: "Gemini (Google)",
};

export const AI_PROVIDER_PLACEHOLDERS: Record<AiProvider, string> = {
  claude: "sk-ant-api03-...",
  openai: "sk-proj-...",
  gemini: "AIzaSy...",
};

const KEY_PROVIDER = "kiddoloop_ai_provider";
const KEY_TOKEN = "kiddoloop_ai_token";

export function getStoredAiToken(): { provider: AiProvider; token: string } | null {
  if (typeof window === "undefined") return null;
  const provider = localStorage.getItem(KEY_PROVIDER) as AiProvider | null;
  const token = localStorage.getItem(KEY_TOKEN);
  if (!provider || !token) return null;
  return { provider, token };
}

export function storeAiToken(provider: AiProvider, token: string): void {
  localStorage.setItem(KEY_PROVIDER, provider);
  localStorage.setItem(KEY_TOKEN, token);
}

export function clearStoredAiToken(): void {
  localStorage.removeItem(KEY_PROVIDER);
  localStorage.removeItem(KEY_TOKEN);
}
