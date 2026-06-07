import { spawn } from "node:child_process";
import fs from "node:fs";

const logFile = "modelbudget-mvp/logs/requests.jsonl";
fs.rmSync(logFile, { force: true });

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
  throw new Error("ModelBudget MVP server did not start");
}

async function chat(content) {
  const response = await fetch("http://127.0.0.1:8787/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "auto",
      messages: [{ role: "user", content }]
    })
  });
  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

try {
  await waitForHealth();
  const routine = await chat("Summarize this repo and explain the test error.");
  const privatePath = await chat("Review this .env file and secrets before deployment.");
  const hard = await chat("Create a multi-file architecture refactor plan.");
  const dashboard = await (await fetch("http://127.0.0.1:8787/dashboard")).json();
  const configStatus = await (await fetch("http://127.0.0.1:8787/config/status")).json();
  const ollamaStatus = await (await fetch("http://127.0.0.1:8787/providers/ollama/status")).json();
  const ui = await (await fetch("http://127.0.0.1:8787/ui")).text();

  const routes = [
    routine.modelbudget?.route,
    privatePath.modelbudget?.route,
    hard.modelbudget?.route
  ];

  if (routes[0] !== "cheap") throw new Error(`Expected routine route cheap, got ${routes[0]}`);
  if (routes[1] !== "local") throw new Error(`Expected private route local, got ${routes[1]}`);
  if (routes[2] !== "premium") throw new Error(`Expected hard route premium, got ${routes[2]}`);
  if (dashboard.requests !== 3) throw new Error(`Expected 3 dashboard requests, got ${dashboard.requests}`);
  if (dashboard.privateSignals !== 1) throw new Error(`Expected 1 private signal, got ${dashboard.privateSignals}`);
  if (dashboard.providerMode !== "mock") throw new Error(`Expected provider mode mock, got ${dashboard.providerMode}`);
  if (!configStatus.ok) throw new Error(`Expected config status ok: ${JSON.stringify(configStatus)}`);
  if (configStatus.cloudForwardingAllowed) throw new Error("Cloud forwarding should be disabled by default");
  if (ollamaStatus.activeForLocalRoute) throw new Error("Ollama should not be active in mock mode");
  if (!ui.includes("ModelBudget Dashboard")) throw new Error("Dashboard UI missing title");

  console.log("ModelBudget MVP validation passed");
  console.log(`Routes: ${routes.join(", ")}`);
  console.log(`Estimated cost: $${dashboard.estimatedCostUsd}`);
} finally {
  stopServer();
}
