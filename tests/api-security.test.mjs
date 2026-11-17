import test from "node:test";
import assert from "node:assert/strict";
import { signature, MAX_AGE, COOKIE } from "../src/lib/operator-token.ts";
import { sameOrigin, login } from "../src/lib/operator.ts";
import {
  GET as coinbaseStatus,
  POST as coinbaseAction,
} from "../src/app/api/coinbase/[[...action]]/route.ts";

const secret = "fixture-only-dashboard-operator-key-32-characters";
const base = "https://dashboard.example";
const draft = {
  keyName: "organizations/org/apiKeys/key",
  privateKey:
    "-----BEGIN EC PRIVATE KEY-----\n" +
    "a".repeat(200) +
    "\n-----END EC PRIVATE KEY-----",
  portfolioId: "11111111-1111-4111-8111-111111111111",
};
async function request(
  path,
  { authenticated = true, origin = base, method = "POST", body } = {},
) {
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const headers = new Headers({ origin });
  if (authenticated)
    headers.set(
      "cookie",
      `${COOKIE}=${expires}.${await signature(expires, secret)}`,
    );
  if (body !== undefined) headers.set("content-type", "application/json");
  return new Request(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
// Environment values are fixtures; no requests are sent to live services.
test("operator boundary rejects foreign, missing, malformed and scheme-mismatched origins", () => {
  for (const origin of [
    "https://evil.example",
    "null",
    "https://dashboard.example/path",
    "http://dashboard.example",
  ])
    assert.equal(sameOrigin(new Request(base, { headers: { origin } })), false);
  assert.equal(sameOrigin(new Request(base)), false);
  assert.equal(
    sameOrigin(new Request(base, { headers: { origin: base } })),
    true,
  );
});

test("login bounds the request and sets secure, HttpOnly cookies", async (t) => {
  const old = process.env.DASHBOARD_OPERATOR_KEY;
  process.env.DASHBOARD_OPERATOR_KEY = secret;
  t.after(() => {
    if (old === undefined) delete process.env.DASHBOARD_OPERATOR_KEY;
    else process.env.DASHBOARD_OPERATOR_KEY = old;
  });
  const response = await login(
    await request("/api/session", {
      authenticated: false,
      body: { password: secret },
    }),
  );
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  for (const flag of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/api"])
    assert.ok(cookie.includes(flag));
  assert.equal(
    (
      await login(
        await request("/api/session", { body: { password: "incorrect" } }),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await login(
        await request("/api/session", { body: { password: "x".repeat(5000) } }),
      )
    ).status,
    413,
  );
  assert.equal(
    (
      await login(
        await request("/api/session", {
          body: { password: secret },
          origin: "https://evil.example",
        }),
      )
    ).status,
    403,
  );
});

test("all mutation proxies fail closed without contacting upstream", async (t) => {
  const old = process.env.DASHBOARD_OPERATOR_KEY;
  process.env.DASHBOARD_OPERATOR_KEY = secret;
  t.after(() => {
    if (old === undefined) delete process.env.DASHBOARD_OPERATOR_KEY;
    else process.env.DASHBOARD_OPERATOR_KEY = old;
  });
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    throw new Error("unexpected fetch");
  });
  const modules = [
    "admin/scan",
    "admin/clear-hard-flat",
    "admin/clear-blacklist",
    "ml/train",
    "ml/autonomy/train",
  ];
  for (const path of modules) {
    const { POST } = await import(`../src/app/api/${path}/route.ts`);
    assert.equal(
      (await POST(await request("/api/" + path, { authenticated: false })))
        .status,
      401,
      path,
    );
    assert.equal(
      (
        await POST(
          await request("/api/" + path, { origin: "https://evil.example" }),
        )
      ).status,
      403,
      path,
    );
  }
  const context = { params: Promise.resolve({ action: ["credentials"] }) };
  assert.equal(
    (
      await coinbaseAction(
        await request("/api/coinbase/credentials", { authenticated: false }),
        context,
      )
    ).status,
    401,
  );
  process.env.DASHBOARD_OPERATOR_KEY = "short";
  const { POST } = await import("../src/app/api/admin/scan/route.ts");
  assert.equal((await POST(await request("/api/admin/scan"))).status, 503);
  assert.equal(calls, 0);
});

test("Coinbase proxy validates input, strips credentials from output and preserves upstream failure status", async (t) => {
  const names = ["DASHBOARD_OPERATOR_KEY", "ADMIN_KEY", "CORE_URL"];
  const old = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  Object.assign(process.env, {
    DASHBOARD_OPERATOR_KEY: secret,
    ADMIN_KEY: "fixture-service-key",
    CORE_URL: "https://core.example",
  });
  t.after(() => {
    for (const k of names) {
      if (old[k] === undefined) delete process.env[k];
      else process.env[k] = old[k];
    }
  });
  let calls = 0;
  let upstreamStatus = 200;
  let result = { ok: true, saved: true, privateKey: "DO-NOT-RETURN" };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls++;
    assert.ok(String(url).startsWith("https://core.example/admin/coinbase"));
    assert.equal(
      new Headers(options.headers).get("x-admin-key"),
      "fixture-service-key",
    );
    if (options.body) assert.deepEqual(JSON.parse(options.body), draft);
    return Response.json(result, { status: upstreamStatus });
  });
  const context = { params: Promise.resolve({ action: ["credentials"] }) };
  assert.equal(
    (
      await coinbaseAction(
        await request("/api/coinbase/credentials", {
          body: { ...draft, privateKey: "bad" },
        }),
        context,
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await coinbaseAction(
        await request("/api/coinbase/credentials", {
          body: { ...draft, extra: "x".repeat(17000) },
        }),
        context,
      )
    ).status,
    413,
  );
  assert.equal(calls, 0);
  const saved = await coinbaseAction(
    await request("/api/coinbase/credentials", {
      body: { ...draft, extra: "ignored" },
    }),
    context,
  );
  assert.equal(saved.status, 200);
  assert.deepEqual(await saved.json(), { ok: true, saved: true });
  upstreamStatus = 409;
  result = { error: "DO-NOT-RETURN" };
  const conflict = await coinbaseAction(
    await request("/api/coinbase/credentials", { body: draft }),
    context,
  );
  assert.equal(conflict.status, 409);
  assert.ok(!(await conflict.text()).includes("DO-NOT-RETURN"));
  upstreamStatus = 200;
  result = {
    storageConfigured: true,
    readOnly: true,
    saved: true,
    connected: true,
    privateKey: "DO-NOT-RETURN",
    verification: {
      running: false,
      checks: [
        {
          name: "account",
          ok: true,
          message: "ok",
          privateKey: "DO-NOT-RETURN",
        },
      ],
    },
  };
  const status = await coinbaseStatus(
    await request("/api/coinbase", { method: "GET" }),
    { params: Promise.resolve({}) },
  );
  assert.equal(status.status, 200);
  assert.ok(!(await status.text()).includes("DO-NOT-RETURN"));
  result = {
    storageConfigured: true,
    readOnly: true,
    saved: true,
    connected: true,
    verification: { running: false, checks: [null] },
  };
  assert.equal(
    (
      await coinbaseStatus(await request("/api/coinbase", { method: "GET" }), {
        params: Promise.resolve({}),
      })
    ).status,
    502,
  );
});
