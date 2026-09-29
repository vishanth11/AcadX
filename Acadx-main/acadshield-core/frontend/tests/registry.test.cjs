const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");
// Next Link schedules browser idle callbacks; this renderer has no DOM.
global.self = globalThis;

function compile(relative) {
  const filename = path.resolve(__dirname, "../src", relative);
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  instance._compile(compiled, filename);
  return instance.exports;
}
require.extensions[".tsx"] = (instance, filename) => {
  instance._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
};
const { default: RegistryPage, loadRegistry } = compile("components/RegistryPage.tsx");
const originalFetch = global.fetch;
const mounted = [];
afterEach(async () => {
  await act(async () => { mounted.splice(0).forEach((view) => view.unmount()); });
  global.fetch = originalFetch;
});
async function render(props = {}) {
  let view;
  await act(async () => { view = create(React.createElement(RegistryPage, { title: "Registry", endpoint: "/registry/documents", ...props })); });
  mounted.push(view);
  return view;
}
const text = (view) => JSON.stringify(view.toJSON());
test("renders loading while the registry request is pending", async () => {
  global.fetch = () => new Promise(() => {});
  const view = await render();
  assert.match(text(view), /Loading registry records/);
  assert.doesNotMatch(text(view), /No records found/);
});
test("renders an empty state without fallback sample records", async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ records: [] }) });
  assert.match(text(await render()), /No records found/);
});

test("loads the next registry page using the server cursor", async () => {
  const urls = [];
  global.fetch = async url => { urls.push(url); return { ok: true, json: async () => ({ records: [{ id: "one" }], nextCursor: urls.length === 1 ? "cursor-2" : null }) }; };
  const view = await render();
  await act(async () => { view.root.findAllByType("button").find(button => button.props.children === "Next page").props.onClick(); });
  assert.match(urls[1], /cursor=cursor-2/);
  assert.match(text(view), /First page/);
});

test("does not label a pending blockchain revocation as saved", async () => {
  global.fetch = async (_url, options) => options.method === "POST" ? { ok: true, status: 202, json: async () => ({ operationId: "op-1", status: "PENDING" }) } : { ok: true, json: async () => ({ records: [{ id: "credential", status: "ACTIVE" }] }) };
  const view = await render({ credentialActions: true });
  await act(async () => { view.root.findByType("textarea").props.onChange({ target: { value: "Issuer correction" } }); });
  await act(async () => { await view.root.findAllByType("button").find(button => button.props.children === "Revoke credential").props.onClick(); });
  assert.match(text(view), /not yet confirmed/); assert.doesNotMatch(text(view), /Change saved/);
});

test("sharing sends explicit consent and puts the returned capability only in a fragment", async () => {
  const ShareManager = compile("components/ShareManager.tsx").default;
  const previousWindow = global.window; global.window = { location: { origin: "https://app.test" } };
  let sent;
  global.fetch = async (_url, options) => options.method === "POST" ? (sent = JSON.parse(options.body), { ok: true, json: async () => ({ id: "share", token: "private-token" }) }) : { ok: true, json: async () => ({ records: [] }) };
  try {
    let view; await act(async () => { view = create(React.createElement(ShareManager)); }); mounted.push(view);
    await act(async () => {
      const inputs = view.root.findAllByType("input");
      inputs[0].props.onChange({ target: { value: "credential-id" } }); inputs[1].props.onChange({ target: { value: "Job application" } }); inputs[2].props.onChange({ target: { checked: true } });
    });
    await act(async () => { view.root.findAllByType("form")[0].props.onSubmit({ preventDefault() {} }); });
    assert.equal(sent.consent, true); assert.deepEqual(sent.credentialIds, ["credential-id"]);
    assert.match(text(view), /https:\/\/app.test\/p\/view#private-token/);
  } finally { global.window = previousWindow; }
});

test("public share resolution removes the fragment and displays revoked-link errors", async () => {
  const SharedSummary = compile("components/SharedSummary.tsx").default;
  const previousWindow = global.window; let replaced, sent;
  global.window = { location: { hash: "#private-token", pathname: "/p/view" }, history: { replaceState: (...args) => { replaced = args; } } };
  global.fetch = async (url, options) => { sent = { url, options }; return { ok: false, status: 404 }; };
  try {
    let view; await act(async () => { view = create(React.createElement(SharedSummary)); }); mounted.push(view);
    assert.equal(replaced[2], "/p/view"); assert.equal(sent.options.credentials, "omit"); assert.equal(sent.options.referrerPolicy, "no-referrer");
    assert.doesNotMatch(sent.url, /private-token/); assert.equal(JSON.parse(sent.options.body).token, "private-token");
    assert.match(text(view), /expired, was revoked/);
  } finally { global.window = previousWindow; }
});

test("employer report export errors remain visible", async () => {
  const Reports = compile("components/EmployerReports.tsx").default;
  global.fetch = async url => url.endsWith("/company/reports") ? { ok: true, json: async () => ({ records: [] }) } : { ok: false, status: 404 };
  let view; await act(async () => { view = create(React.createElement(Reports)); }); mounted.push(view);
  await act(async () => { view.root.findByType("input").props.onChange({ target: { value: "unknown" } }); });
  await act(async () => { await view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.match(text(view), /Report not found/);
});
test("renders only returned records and sends session credentials", async () => {
  let options;
  global.fetch = async (_url, opts) => { options = opts; return { ok: true, json: async () => ({ records: [{ id: "actual-id", originalFileName: "actual.pdf", status: "REVIEW_REQUIRED" }] }) }; };
  const view = await render();
  assert.match(text(view), /actual.pdf/);
  assert.equal(options.credentials, "include");
  assert.equal(options.cache, "no-store");
});
test("shows revoked-session errors and allows retry", async () => {
  global.fetch = async () => ({ ok: false, status: 401 });
  const view = await render();
  assert.match(text(view), /access was revoked/);
  global.fetch = async () => ({ ok: true, json: async () => ({ records: [] }) });
  await act(async () => { view.root.findByType("button").props.onClick(); });
  assert.match(text(view), /No records found/);
});
test("handles unavailable features and unknown IDs explicitly", async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ records: [], unavailable: "Sharing is not available." }) });
  assert.match(text(await render()), /Sharing is not available/);
  global.fetch = async () => ({ ok: false, status: 404 });
  await assert.rejects(loadRegistry("/documents/unknown"), /not found/);
});
test("does not report revocation success when the API rejects the action", async () => {
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return options.method === "POST" ? { ok: false, json: async () => ({ error: "SESSION_REVOKED" }) }
      : { ok: true, json: async () => ({ records: [{ id: "credential-id", status: "ACTIVE" }] }) };
  };
  const view = await render({ credentialActions: true });
  await act(async () => { view.root.findByType("textarea").props.onChange({ target: { value: "Administrative correction" } }); });
  await act(async () => { await view.root.findByType("button").props.onClick(); });
  assert.match(calls[1].url, /credentials\/credential-id\/revoke$/);
  assert.equal(JSON.parse(calls[1].options.body).reason, "Administrative correction");
  assert.match(text(view), /SESSION_REVOKED/);
  assert.doesNotMatch(text(view), /Change saved/);
});
test("production routes cannot import seeded stores or use localStorage", () => {
  const root = path.resolve(__dirname, "../src/app");
  function walk(folder) {
    for (const file of fs.readdirSync(folder, { withFileTypes: true })) {
      const name = path.join(folder, file.name);
      if (file.isDirectory()) walk(name);
      else if (/\.tsx?$/.test(name)) assert.doesNotMatch(fs.readFileSync(name, "utf8"), /platform-state|mock-platform-data|credentials-data|localStorage/, name);
    }
  }
  walk(root);
});
test("the demo flag can never enable fixtures in production", () => {
  const previousMode = process.env.NODE_ENV, previousFlag = process.env.NEXT_PUBLIC_ENABLE_DEMO;
  try {
    process.env.NODE_ENV = "production"; process.env.NEXT_PUBLIC_ENABLE_DEMO = "true";
    assert.throws(() => compile("lib/demo-mode.ts").requireDemoMode(), /disabled/);
    process.env.NODE_ENV = "development"; delete process.env.NEXT_PUBLIC_ENABLE_DEMO;
    assert.throws(() => compile("lib/demo-mode.ts").requireDemoMode(), /disabled/);
    process.env.NEXT_PUBLIC_ENABLE_DEMO = "true";
    assert.doesNotThrow(() => compile("lib/demo-mode.ts").requireDemoMode());
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousMode;
    if (previousFlag === undefined) delete process.env.NEXT_PUBLIC_ENABLE_DEMO; else process.env.NEXT_PUBLIC_ENABLE_DEMO = previousFlag;
  }
});
