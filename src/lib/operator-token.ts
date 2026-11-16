export const COOKIE = "alphastream_operator";
export const MAX_AGE = 8 * 60 * 60;
const encoder = new TextEncoder();

export async function signature(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++)
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function verifyToken(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  if (secret.length < 32) return false;
  const [expires, mac, extra] = token.split(".");
  const expiry = Number(expires);
  if (
    extra ||
    !mac ||
    !Number.isInteger(expiry) ||
    expiry <= now ||
    expiry > now + MAX_AGE
  )
    return false;
  return equal(mac, await signature(expires, secret));
}
