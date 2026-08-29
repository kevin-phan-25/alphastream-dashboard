import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
try {
const ctx = getRequestContext();
const env = ctx.env as Record<string, unknown>;


const adminKey =
  typeof env.ADMIN_KEY === "string"
    ? env.ADMIN_KEY
    : "";

const coreUrl =
  typeof env.CORE_URL === "string"
    ? env.CORE_URL
    : "";

return Response.json({
  ok: true,
  envKeys: Object.keys(env || {}),
  adminKeyExists: adminKey.length > 0,
  adminKeyLength: adminKey.length,
  coreUrlExists: coreUrl.length > 0,
  coreUrl: coreUrl || null,
});

} catch (error) {
return Response.json(
{
ok: false,
error:
error instanceof Error
? error.message
: String(error),
},
{
status: 500,
}
);
}
}
