import { coreFetch, getRuntimeConfig } from "@/lib/core";
import { operatorSession, requireOperator } from "@/lib/operator";
export const runtime = "edge";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
const actions = new Set(["credentials", "portfolios", "verify", "reconnect"]);
function safeResponse(data: Record<string, unknown>, action: string) {
  const allowed = action === "portfolios" ? ["portfolios"] : action ? ["ok", "saved", "version", "fingerprint", "maskedKey", "restarting"] : ["storageConfigured", "readOnly", "saved", "connected", "activeFingerprint", "fingerprint", "maskedKey", "portfolioId", "savedAt", "verification", "brokerError"];
  const safe: Record<string, unknown> = {};
  for (const key of allowed) if (data[key] !== undefined) safe[key] = data[key];
  if (data.storageError) safe.storageError = "Core cannot access credential storage. Check the secret resource and service-account permissions.";
  if (Array.isArray(data.portfolios)) safe.portfolios = data.portfolios.map((row: Record<string, unknown>) => ({name:row.name,uuid:row.uuid,type:row.type}));
  if (data.verification && typeof data.verification === "object") { const v = data.verification as Record<string, unknown>; safe.verification = {running:v.running,fingerprint:v.fingerprint,completedAt:v.completedAt,checks:Array.isArray(v.checks) ? v.checks.map((row: Record<string, unknown>) => ({name:row.name,ok:row.ok,message:row.message})) : []}; }
  return safe;
}
async function proxy(request: Request, context: { params: Promise<{ action?: string[] }> }) {
  if (request.method === "GET") {
    if (!(await operatorSession(request))) return Response.json({ error: "Unlock operator access to view Coinbase setup." }, { status: 401, headers });
  } else { const denied = await requireOperator(request); if (denied) return denied; }
  const segments = (await context.params).action ?? [];
  const action = segments.join("/");
  if ((request.method === "GET" && segments.length) || (request.method === "POST" && !actions.has(action))) return Response.json({ error: "Unknown Coinbase setup action" }, { status: 404, headers });
  const target = new URL(getRuntimeConfig().coreUrl);
  if (target.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["127.0.0.1", "localhost"].includes(target.hostname))) return Response.json({ error: "Credential setup requires an HTTPS Core URL." }, { status: 503, headers });
  let body: string | undefined;
  if (request.method === "POST" && ["credentials", "portfolios"].includes(action)) {
    const length = Number(request.headers.get("content-length"));
    if (length > 16384) return Response.json({ error: "Credential payload exceeds 16 KB." }, { status: 413, headers });
    const reader = request.body?.getReader(); if (!reader) return Response.json({ error: "Credentials are required." }, { status: 400, headers });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.byteLength; if (size > 16384) { await reader.cancel(); return Response.json({ error: "Credential payload exceeds 16 KB." }, { status: 413, headers }); } chunks.push(chunk.value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { const input = JSON.parse(new TextDecoder().decode(bytes)); body = JSON.stringify({ keyName: input.keyName, privateKey: input.privateKey, portfolioId: input.portfolioId ?? "" }); } catch { return Response.json({ error: "Invalid credential request." }, { status: 400, headers }); }
  }
  try {
    const upstream = await coreFetch(`/admin/coinbase${action ? `/${action}` : ""}`, { method: request.method, body, signal: AbortSignal.timeout(25_000) });
    if (!upstream.ok) {
      const messages: Record<number, string> = { 400: "Invalid credential request.", 401: "Dashboard service authentication to Core failed.", 404: "Deploy the updated Core service to enable dashboard setup.", 409: "This action requires read-only mode and no conflicting verification request.", 422: "Invalid credentials. Use the full CDP key identifier, ECDSA P-256 PEM, and valid portfolio UUID.", 503: "Credential storage is unavailable. Complete the one-time Core secret/IAM setup." };
      return Response.json({ error: messages[upstream.status] ?? "Core could not complete the Coinbase setup request." }, { status: upstream.status, headers });
    }
    const data = await upstream.json();
    if (!action && (typeof data.storageConfigured !== "boolean" || typeof data.readOnly !== "boolean")) return Response.json({error:"Deploy the updated Core service to enable Coinbase setup."},{status:503,headers});
    return Response.json(safeResponse(data, action), { status: upstream.status, headers });
  } catch { return Response.json({ error: "Core is unreachable or restarting. Refresh connection status shortly." }, { status: 502, headers }); }
}
export const GET = proxy;
export const POST = proxy;
