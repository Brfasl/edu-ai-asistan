import { SignJWT, importPKCS8 } from "jose";
import { env } from "./env";

function normalizeAppleKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

function getAppleClientIds(): string[] {
  return [env.APPLE_SERVICE_ID, env.APPLE_BUNDLE_ID].filter(
    (value): value is string => !!value
  );
}

export function isAppleWebConfigured() {
  return !!(
    env.APPLE_TEAM_ID &&
    env.APPLE_KEY_ID &&
    env.APPLE_SERVICE_ID &&
    env.APPLE_PRIVATE_KEY
  );
}

async function generateAppleClientSecret(clientId: string): Promise<string> {
  if (!env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY) {
    throw new Error("Apple OAuth yapılandırması eksik.");
  }

  const key = await importPKCS8(
    normalizeAppleKey(env.APPLE_PRIVATE_KEY),
    "ES256"
  );
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.APPLE_KEY_ID })
    .setIssuer(env.APPLE_TEAM_ID)
    .setIssuedAt(now)
    .setExpirationTime(now + 86400 * 150)
    .setAudience("https://appleid.apple.com")
    .setSubject(clientId)
    .sign(key);
}

export async function exchangeAppleAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<string> {
  if (!env.APPLE_SERVICE_ID) {
    throw new Error("APPLE_SERVICE_ID tanımlı değil.");
  }

  const clientSecret = await generateAppleClientSecret(env.APPLE_SERVICE_ID);

  const res = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.APPLE_SERVICE_ID,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const data = (await res.json()) as {
    id_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.id_token) {
    throw new Error(
      data.error_description || data.error || "Apple kod değişimi başarısız."
    );
  }

  return data.id_token;
}

export function getAppleAudiences() {
  return getAppleClientIds();
}
