import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
try {
const ctx = getRequestContext();
const env = ctx.env as Record<string, unknown>;

```
return Response.json({
  ok: true,

  envKeys: Object.keys(env || {}),

  adminKey: {
    exists: typeof env.ADMIN_KEY === "string",
    type: typeof env.ADMIN_KEY,
    length:
      typeof env.ADMIN_KEY === "string"
        ? env.ADMIN_KEY.length
        : 0,
  },

  coreUrl: {
    exists: typeof env.CORE_URL === "string",
    value:
      typeof env.CORE_URL === "string"
        ? env.CORE_URL
        : null,
  },
});
```

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
