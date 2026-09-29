const { spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run this script with npm run setup:node, npm test, or npm run check.");
function run(args, cwd = root) {
  return spawnSync(process.execPath, [npm, ...args], { cwd, stdio: "inherit", env: { ...process.env, CI: "true", NEXT_TELEMETRY_DISABLED: "1" } }).status === 0;
}
const packages = ["acadshield-core/backend", "acadshield-core/frontend", "acadshield-core/contracts", "acadshield-trust/backend", "acadshield-trust/frontend"];
if (process.argv[2] === "install") {
  for (const folder of packages) {
    if (!run(["ci", "--workspaces=false"], path.join(root, folder))) process.exit(1);
    if (folder.endsWith("/backend") && !run(["run", "prisma:generate"], path.join(root, folder))) process.exit(1);
  }
} else {
  const jobs = process.argv[2] === "check"
    ? ["check:core", "check:trust", "check:frontend", "check:trust-frontend", "test:contracts", "test:ai", "test:workflow"]
    : ["test:core", "test:trust", "test:frontend", "test:contracts", "test:ai", "test:workflow"];
  const results = jobs.map((name) => ({ name, ok: run(["run", name]) }));
  console.log("\n" + results.map(({ name, ok }) => `${ok ? "PASS" : "FAIL"} ${name}`).join("\n"));
  process.exitCode = results.every(({ ok }) => ok) ? 0 : 1;
}
