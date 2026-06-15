import crypto from "crypto";

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON 환경변수가 설정되지 않았습니다");
  return JSON.parse(json);
}

function createJwt(sa: ServiceAccount): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, "base64url");
  return `${header}.${payload}.${signature}`;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const sa = getServiceAccount();
  const jwt = createJwt(sa);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth2 토큰 발급 실패: ${res.status} ${text}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

export interface FcmMessage {
  token: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

export interface FcmResult {
  token: string;
  success: boolean;
  error?: string;
}

export async function sendFcmMessage(msg: FcmMessage): Promise<FcmResult> {
  try {
    const sa = getServiceAccount();
    const accessToken = await getAccessToken();

    const payload: Record<string, unknown> = {
      message: {
        token: msg.token,
        notification: {
          title: msg.title,
          body: msg.body,
          ...(msg.imageUrl ? { image: msg.imageUrl } : {}),
        },
        ...(msg.data ? { data: msg.data } : {}),
      },
    };

    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      return { token: msg.token, success: false, error: err.error?.message ?? res.statusText };
    }

    return { token: msg.token, success: true };
  } catch (e) {
    return { token: msg.token, success: false, error: (e as Error).message };
  }
}

export async function sendFcmToUser(
  tokens: string[],
  title: string,
  body: string,
  imageUrl?: string,
  data?: Record<string, string>
): Promise<FcmResult[]> {
  return Promise.all(
    tokens.map((token) => sendFcmMessage({ token, title, body, imageUrl, data }))
  );
}
