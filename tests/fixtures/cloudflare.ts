// Route tests run outside Cloudflare. Exercise the real process.env fallback.
export function getRequestContext(): never {
  throw new Error("No Cloudflare request context in Node fixture tests");
}
