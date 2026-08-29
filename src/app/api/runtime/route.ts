import { getRuntimeConfig } from "@/lib/core";

export const runtime = "edge";

export async function GET() {
  try {
    const config = getRuntimeConfig();

    return Response.json(
      {
        ok: true,

        cloudflareRuntime: true,

        hasAdminKey: config.adminKey.length > 0,

        adminKeyLength: config.adminKey.length,

        hasCoreUrl: config.coreUrl.length > 0,

        hasMlUrl: config.mlUrl.length > 0,

        coreUrl: config.coreUrl,

        mlUrl: config.mlUrl,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Runtime configuration error:", error);

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown runtime configuration error",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
