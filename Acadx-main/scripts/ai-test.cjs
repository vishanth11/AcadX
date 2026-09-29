const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");
const cwd = path.resolve(__dirname, "../acadshield-trust/ai-service");
const python = process.env.ACADSHIELD_PYTHON || path.join(cwd, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
if (!existsSync(python)) {
  console.error("AI Python environment missing. Create acadshield-trust/ai-service/.venv and install requirements.txt, or set ACADSHIELD_PYTHON to an absolute Python executable. See PHASE1.md.");
  process.exit(1);
}
const result = spawnSync(python, ["-m", "pytest", "-q", "tests"], { cwd, stdio: "inherit" });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
