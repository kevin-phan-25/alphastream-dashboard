import { coreFetch } from "@/lib/core";

export const runtime = "edge";

export async function POST() {
  try {
    const response = await coreFetch("/admin/clear-hard-flat", {
      method: "POST",
    });
    const data = await response.json().catch(() => ({}));
    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error("Clear hard-flat proxy error:", error);
    return Response.json(
      { error: "Failed to clear hard flat on Core" },
      { status: 502 }
    );
  }
}
