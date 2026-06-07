import { spawn } from "node:child_process";
import fs from "node:fs";

fs.rmSync("modelbudget-mvp/logs/requests.jsonl", { force: true });

const server = spawn("node", ["modelbudget-mvp/server.mjs"], {
  stdio: ["ignore", "pipe", "pipe"]
});

function stopServer() {
  if (!server.killed) server.kill();
}

async function waitForHealth() {
  const started = Date.now();
  while (Date.now() - started < 5000) {
    try {
      const response = await fetch("http://127.0.0.1:8787/health");
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("ModelBudget server did not start");
}

async function getJson(path) {
  const response = await fetch(`http://127.0.0.1:8787${path}`);
  return response.json();
}

async function chat(label, content) {
  const response = await fetch("http://127.0.0.1:8787/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      messages: [{ role: "user", content }]
    })
  });
  const body = await response.json();
  console.log(`${label}: ${body.modelbudget.route} - ${body.modelbudget.reason}`);
}

try {
  await waitForHealth();
  const configStatus = await getJson("/config/status");
  console.log("Config status");
  console.log("=============");
  console.log(`Mode: ${configStatus.providerMode}`);
  console.log(`Cloud forwarding allowed: ${configStatus.cloudForwardingAllowed}`);
  console.log(`Stores prompts: ${configStatus.storesPrompts}`);
  console.log("");

  await chat("Routine task", "Summarize this repo and explain the test error.");
  await chat("Private task", "Review this .env file and secrets before deployment.");
  await chat("Hard task", "Create a multi-file architecture refactor plan.");
  console.log("");

  const dashboard = await getJson("/dashboard");
  console.log("Dashboard");
  console.log("=========");
  console.log(`Requests: ${dashboard.requests}`);
  console.log(`Estimated cost: $${dashboard.estimatedCostUsd}`);
  console.log(`Private signals: ${dashboard.privateSignals}`);
  console.log("Open UI: http://127.0.0.1:8787/ui");
} finally {
  stopServer();
}
