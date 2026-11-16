import test from "node:test";
import assert from "node:assert/strict";
import { signature, verifyToken, MAX_AGE } from "../src/lib/operator-token.ts";
const secret = "test-only-operator-secret-with-32-characters";
test("operator session rejects expired, tampered and overlong sessions", async () => {
  const now = 1000,
    expires = String(now + MAX_AGE);
  const token = `${expires}.${await signature(expires, secret)}`;
  assert.equal(await verifyToken(token, secret, now), true);
  assert.equal(await verifyToken(token, secret, now + MAX_AGE), false);
  assert.equal(await verifyToken(token, secret + "rotated", now), false);
  assert.equal(await verifyToken(token + ".extra", secret, now), false);
  assert.equal(await verifyToken(token, "short", now), false);
  const future = String(now + MAX_AGE + 1);
  assert.equal(
    await verifyToken(
      `${future}.${await signature(future, secret)}`,
      secret,
      now,
    ),
    false,
  );
});
