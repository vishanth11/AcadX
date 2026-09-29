"use client";

import React, { useState } from "react";
import {
  Code2,
  KeyRound,
  Copy,
  CheckCircle2,
  RefreshCw,
  Terminal,
  ShieldCheck,
  ExternalLink,
  Lock,
  Layers,
  Webhook
} from "lucide-react";

export default function CompanyApiPortalPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"CURL" | "NODE" | "PYTHON">("CURL");
  const [apiKey, setApiKey] = useState("ax_live_9f8b2c1d3e5a6f7b8c9d0e1f2a3b4c5d");
  const [webhookUrl, setWebhookUrl] = useState("https://api.anthropic.com/webhooks/acadshield");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const regenerateKey = () => {
    const newKey = "ax_live_" + Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, "0")).join("");
    setApiKey(newKey);
  };

  const snippets = {
    CURL: `curl -X POST https://api.acadshield.network/v1/verify/hash \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "documentSha256": "0x4f8b2c1d3e5a6f7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    "candidateDid": "did:acadshield:student:STU-001"
  }'`,
    NODE: `import { AcadShieldClient } from "@acadshield/sdk";

const client = new AcadShieldClient({
  apiKey: "${apiKey}",
  network: "polygon-amoy"
});

// Verify raw PDF buffer without uploading private file
const result = await client.verifyDocument({
  fileBuffer: fs.readFileSync("Candidate_Degree.pdf"),
  candidateDid: "did:acadshield:student:STU-001"
});

console.log(result.isMatch); // true
console.log(result.blockchainTx); // 0x89ab...`,
    PYTHON: `from acadshield import AcadShieldClient

client = AcadShieldClient(
    api_key="${apiKey}",
    environment="production"
)

# Automated background check endpoint
verification = client.verify_document_hash(
    sha256_hash="0x4f8b2c1d3e5a6f7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
    candidate_id="cand_01"
)

if verification.status == "VERIFIED":
    print(f"Verified by {verification.institution_name}")
`
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-forest/15 text-xs font-semibold text-forest mb-2">
          <Code2 className="w-3.5 h-3.5 text-ochre" />
          Enterprise REST & Webhook Gateway
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight headline-shadow font-serif text-forest">
          Developer API & Integration
        </h1>
        <p className="text-forest/70 text-sm mt-1 max-w-2xl">
          Automate candidate background verification directly inside your ATS (Workday, Greenhouse, Lever) via high-throughput cryptographic APIs.
        </p>
      </div>

      {/* API Key Management */}
      <div className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest/10">
          <div>
            <h3 className="text-base font-extrabold text-forest">Production Secret Key</h3>
            <p className="text-xs text-forest/70">
              Pass this token in the <code className="font-mono bg-forest/5 px-2 py-0.5 rounded">Authorization: Bearer</code> header of all requests.
            </p>
          </div>
          <button
            onClick={regenerateKey}
            className="px-3.5 py-1.5 rounded-xl border border-forest/20 text-xs font-bold text-forest hover:bg-forest/5 flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-ochre" />
            Rotate API Key
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 font-mono text-xs bg-forest/5 p-3.5 rounded-xl border border-forest/10 text-forest break-all">
            {apiKey}
          </div>
          <button
            onClick={() => copyToClipboard(apiKey, "key")}
            className="px-4 py-3 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 transition flex items-center gap-1.5"
          >
            {copiedKey === "key" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* Interactive Code Snippets */}
      <div className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-forest" />
            <h3 className="text-base font-extrabold text-forest">Quickstart Integration Snippets</h3>
          </div>

          <div className="flex gap-2">
            {(["CURL", "NODE", "PYTHON"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === tab
                    ? "bg-forest text-white"
                    : "bg-forest/5 text-forest/70 hover:bg-forest/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <pre className="p-5 rounded-2xl bg-forest/95 text-emerald-300 font-mono text-xs overflow-x-auto border border-forest/20 leading-relaxed">
            {snippets[activeTab]}
          </pre>
          <button
            onClick={() => copyToClipboard(snippets[activeTab], "snippet")}
            className="absolute right-3 top-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold flex items-center gap-1"
          >
            {copiedKey === "snippet" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="bg-white border border-forest/15 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-forest/10 pb-3">
          <Webhook className="w-5 h-5 text-forest" />
          <h3 className="text-base font-extrabold text-forest">Verification Event Webhooks</h3>
        </div>

        <p className="text-xs text-forest/70">
          AcadShield delivers signed webhook payloads whenever a new document is anchored or an institution revokes a credential.
        </p>

        <div className="flex gap-3">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 text-xs p-3 rounded-xl border border-forest/20 bg-forest/5 font-mono text-forest"
          />
          <button
            onClick={() => alert("Webhook endpoint updated and ping sent!")}
            className="px-4 py-3 rounded-xl bg-forest text-white text-xs font-bold hover:bg-forest/90 transition"
          >
            Save & Test Ping
          </button>
        </div>
      </div>
    </div>
  );
}
