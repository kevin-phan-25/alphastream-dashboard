export const MAX_CREDENTIAL_FILE_BYTES = 16 * 1024;
export type CredentialDraft = { keyName: string; privateKey: string; portfolioId: string };
export function parseCredentialFile(text: string): Partial<CredentialDraft> {
  if (new TextEncoder().encode(text).length > MAX_CREDENTIAL_FILE_BYTES) throw new Error("Choose a credential file smaller than 16 KB.");
  const value = text.trim();
  if (value.startsWith("-----BEGIN ")) return { privateKey: value };
  let data: unknown;
  try { data = JSON.parse(value); } catch { throw new Error("Choose Coinbase’s downloaded JSON key file or a PEM private-key file."); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid Coinbase key file.");
  const record = data as Record<string, unknown>;
  const keyName = typeof record.name === "string" ? record.name : record.keyName;
  if (typeof keyName !== "string" || typeof record.privateKey !== "string") throw new Error("The JSON file needs name and privateKey fields.");
  return { keyName: keyName.trim(), privateKey: record.privateKey.replace(/\\n/g, "\n").trim() };
}
export function validateCredentialDraft(draft: CredentialDraft, requirePortfolio = true): string | null {
  if (!/^organizations\/[\w-]+\/apiKeys\/[\w-]+$/.test(draft.keyName.trim())) return "Enter the full organizations/…/apiKeys/… identifier.";
  if (draft.privateKey.length < 100 || draft.privateKey.length > 12000 || !/-----BEGIN (EC )?PRIVATE KEY-----/.test(draft.privateKey)) return "Upload or paste the complete ECDSA P-256 PEM private key.";
  if (requirePortfolio && !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(draft.portfolioId.trim())) return "Select a portfolio or enter its UUID.";
  return null;
}
