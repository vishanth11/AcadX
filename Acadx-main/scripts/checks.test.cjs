const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

test("the root runner continues other suites after a failure and exits nonzero", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "acadshield-runner-"));
  try {
    const fakeNpm = path.join(folder, "npm.cjs");
    fs.writeFileSync(fakeNpm, 'console.log("RAN " + process.argv[3]); process.exit(process.argv[3] === "test:core" ? 1 : 0);');
    const result = spawnSync(process.execPath, [path.join(__dirname, "checks.cjs"), "test"], {
      env: { ...process.env, npm_execpath: fakeNpm }, encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /FAIL test:core/);
    assert.match(result.stdout, /PASS test:trust/);
    assert.match(result.stdout, /PASS test:contracts/);
    assert.match(result.stdout, /PASS test:ai/);
  } finally { fs.rmSync(folder, { recursive: true }); }
});
test("missing AI setup produces an actionable error", () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, "ai-test.cjs")], {
    env: { ...process.env, ACADSHIELD_PYTHON: path.join(__dirname, "nonexistent-python") }, encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /AI Python environment missing/);
  assert.match(result.stderr, /PHASE1.md/);
});
