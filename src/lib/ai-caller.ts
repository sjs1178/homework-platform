import type { AiProvider } from "./ai-token";

// ── Text/Image parsing ────────────────────────────────────────────────────

export async function callParseText(
  systemPrompt: string,
  userText: string,
  provider: AiProvider,
  apiKey: string
): Promise<string> {
  if (provider === "claude") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userText }],
    });
    return (res.content[0] as { type: string; text: string }).text;
  }
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        max_tokens: 2048,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? "OpenAI API error");
    return json.choices[0].message.content as string;
  }
  // gemini
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userText}` }] }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Gemini API error");
  return json.candidates[0].content.parts[0].text as string;
}

export async function callParseImage(
  systemPrompt: string,
  imageBase64: string,
  mediaType: string,
  provider: AiProvider,
  apiKey: string
): Promise<string> {
  const imageText = "이 숙제 이미지에서 숙제 일정을 추출해줘.";
  if (provider === "claude") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg", data: imageBase64 } },
          { type: "text", text: imageText },
        ],
      }],
    });
    return (res.content[0] as { type: string; text: string }).text;
  }
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
              { type: "text", text: imageText },
            ],
          },
        ],
        max_tokens: 2048,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? "OpenAI API error");
    return json.choices[0].message.content as string;
  }
  // gemini
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: mediaType, data: imageBase64 } },
            { text: `${systemPrompt}\n\n${imageText}` },
          ],
        }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Gemini API error");
  return json.candidates[0].content.parts[0].text as string;
}

export async function callParseMulti(
  systemPrompt: string,
  images: { base64: string; mediaType: string }[],
  userText: string | undefined,
  provider: AiProvider,
  apiKey: string
): Promise<string> {
  const fallbackText = "이 숙제 이미지에서 숙제 일정을 추출해줘.";
  const textContent = userText?.trim() ? `${userText.trim()}\n\n이 내용과 이미지에서 숙제 일정을 추출해줘.` : fallbackText;

  if (provider === "claude") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = images.map((img) => ({
      type: "image", source: { type: "base64", media_type: img.mediaType, data: img.base64 },
    }));
    content.push({ type: "text", text: textContent });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6", max_tokens: 2048, system: systemPrompt,
      messages: [{ role: "user", content }],
    });
    return (res.content[0] as { type: string; text: string }).text;
  }
  if (provider === "openai") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = images.map((img) => ({
      type: "image_url", image_url: { url: `data:${img.mediaType};base64,${img.base64}` },
    }));
    content.push({ type: "text", text: textContent });
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o", max_tokens: 2048,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content }],
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? "OpenAI API error");
    return json.choices[0].message.content as string;
  }
  // gemini
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = images.map((img) => ({
    inlineData: { mimeType: img.mediaType, data: img.base64 },
  }));
  parts.push({ text: `${systemPrompt}\n\n${textContent}` });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Gemini API error");
  return json.candidates[0].content.parts[0].text as string;
}

// ── Homework checking ─────────────────────────────────────────────────────

type CheckPayload =
  | { type: "text"; text: string }
  | { type: "images"; images: { base64: string; mediaType: string }[] };

export async function callCheckHomework(
  systemPrompt: string,
  payload: CheckPayload,
  provider: AiProvider,
  apiKey: string
): Promise<string> {
  const imageText = "이 숙제 이미지들을 검사해줘. 모든 문제를 찾아서 채점해줘.";

  if (provider === "claude") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const content =
      payload.type === "text"
        ? `다음 숙제 내용을 검사해줘:\n\n${payload.text}`
        : [
            ...payload.images.map((img) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: img.mediaType as "image/jpeg", data: img.base64 },
            })),
            { type: "text" as const, text: imageText },
          ];
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });
    return (res.content[0] as { type: string; text: string }).text;
  }

  if (provider === "openai") {
    const userContent =
      payload.type === "text"
        ? `다음 숙제 내용을 검사해줘:\n\n${payload.text}`
        : [
            ...payload.images.map((img) => ({
              type: "image_url",
              image_url: { url: `data:${img.mediaType};base64,${img.base64}` },
            })),
            { type: "text", text: imageText },
          ];
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 4096,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? "OpenAI API error");
    return json.choices[0].message.content as string;
  }

  // gemini
  const parts: unknown[] =
    payload.type === "text"
      ? [{ text: `${systemPrompt}\n\n다음 숙제 내용을 검사해줘:\n\n${payload.text}` }]
      : [
          { text: `${systemPrompt}\n\n${imageText}` },
          ...payload.images.map((img) => ({ inlineData: { mimeType: img.mediaType, data: img.base64 } })),
        ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message ?? "Gemini API error");
  return json.candidates[0].content.parts[0].text as string;
}
