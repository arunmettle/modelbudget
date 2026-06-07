import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const config = JSON.parse(fs.readFileSync("modelbudget-mvp/config.json", "utf8"));
fs.mkdirSync(path.dirname(config.logging.logFile), { recursive: true });

function validateConfig() {
  const errors = [];
  const warnings = [];
  const validModes = ["mock", "ollama", "openai-compatible"];

  if (!validModes.includes(config.providers.mode)) {
    errors.push(`providers.mode must be one of: ${validModes.join(", ")}`);
  }
  if (config.providers.mode === "mock" && config.providers.allowCloudForwarding) {
    warnings.push("allowCloudForwarding is true while mode is mock; cloud calls are still disabled in mock mode");
  }
  if (config.providers.mode === "openai-compatible" && !config.providers.allowCloudForwarding) {
    errors.push("openai-compatible mode requires allowCloudForwarding=true");
  }
  if (config.providers.mode === "openai-compatible" && !config.providers.openaiCompatible.baseUrl) {
    errors.push("openai-compatible mode requires providers.openaiCompatible.baseUrl");
  }
  if (config.providers.mode === "ollama" && !config.providers.ollama.baseUrl) {
    errors.push("ollama mode requires providers.ollama.baseUrl");
  }
  if (!Number.isFinite(Number(config.budget.dailyUsd)) || Number(config.budget.dailyUsd) <= 0) {
    errors.push("budget.dailyUsd must be a positive number");
  }
  if (config.logging.storePrompts) {
    warnings.push("storePrompts=true will store prompt previews in local logs");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    providerMode: config.providers.mode,
    cloudForwardingAllowed: Boolean(config.providers.allowCloudForwarding),
    storesPrompts: Boolean(config.logging.storePrompts)
  };
}

const configStatus = validateConfig();
if (!configStatus.ok) {
  console.error("ModelBudget config errors:");
  for (const error of configStatus.errors) console.error(`- ${error}`);
  process.exit(1);
}
for (const warning of configStatus.warnings) {
  console.warn(`ModelBudget config warning: ${warning}`);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) reject(new Error("Request body too large"));
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function send(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload, null, 2));
}

function sendHtml(response, status, html) {
  response.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

function approxTokens(text) {
  return Math.max(1, Math.ceil(String(text || "").length / 4));
}

function extractPrompt(payload) {
  if (!Array.isArray(payload.messages)) return "";
  return payload.messages.map((message) => `${message.role || "user"}: ${message.content || ""}`).join("\n");
}

function hasPrivatePath(text) {
  const lower = String(text || "").toLowerCase();
  return config.privacy.privatePathPatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function chooseRoute(prompt) {
  const lower = prompt.toLowerCase();
  if (hasPrivatePath(prompt)) return { route: "local", reason: "private path or secret-like text detected" };
  if (config.routing.hardTaskKeywords.some((keyword) => lower.includes(keyword))) {
    return { route: "premium", reason: "hard task keyword detected" };
  }
  if (config.routing.simpleTaskKeywords.some((keyword) => lower.includes(keyword))) {
    return { route: "cheap", reason: "routine task keyword detected" };
  }
  return { route: "cheap", reason: "default cheap route for unspecified routine task" };
}

function estimateCost(modelKey, inputTokens, outputTokens) {
  const model = config.models[modelKey] || config.models.cheap;
  return (inputTokens / 1_000_000) * model.inputPerMillion + (outputTokens / 1_000_000) * model.outputPerMillion;
}

function todayPrefix() {
  return new Date().toISOString().slice(0, 10);
}

function readLogs() {
  if (!fs.existsSync(config.logging.logFile)) return [];
  return fs.readFileSync(config.logging.logFile, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function dailySpend() {
  return readLogs().filter((log) => String(log.timestamp || "").startsWith(todayPrefix())).reduce((sum, log) => sum + Number(log.estimatedCostUsd || 0), 0);
}

function writeLog(entry) {
  fs.appendFileSync(config.logging.logFile, `${JSON.stringify(entry)}\n`, "utf8");
}

function mockCompletion(payload, routeInfo, inputTokens, estimatedCostUsd) {
  return {
    id: `chatcmpl-modelbudget-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: config.models[routeInfo.route]?.name || routeInfo.route,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: `ModelBudget mock response. Route: ${routeInfo.route}. Reason: ${routeInfo.reason}. Estimated input tokens: ${inputTokens}. Estimated cost: $${estimatedCostUsd.toFixed(6)}.`
      },
      finish_reason: "stop"
    }],
    usage: { prompt_tokens: inputTokens, completion_tokens: 40, total_tokens: inputTokens + 40 },
    modelbudget: {
      route: routeInfo.route,
      reason: routeInfo.reason,
      estimated_cost_usd: Number(estimatedCostUsd.toFixed(8)),
      daily_spend_usd: Number(dailySpend().toFixed(8)),
      stores_prompts: config.logging.storePrompts
    }
  };
}

function providerTarget(route) {
  if (config.providers.mode === "mock") return null;
  if (route === "local" && config.providers.mode === "ollama") {
    return { baseUrl: config.providers.ollama.baseUrl, apiKey: config.providers.ollama.apiKey };
  }
  if (config.providers.mode === "openai-compatible") {
    if (!config.providers.allowCloudForwarding) throw new Error("Cloud forwarding is disabled by config.providers.allowCloudForwarding");
    const apiKey = process.env[config.providers.openaiCompatible.apiKeyEnv];
    if (!config.providers.openaiCompatible.baseUrl || !apiKey) throw new Error("OpenAI-compatible provider baseUrl or API key is not configured");
    return { baseUrl: config.providers.openaiCompatible.baseUrl, apiKey };
  }
  return null;
}

async function forwardCompletion(payload, routeInfo) {
  const target = providerTarget(routeInfo.route);
  if (!target) return null;
  const upstream = await fetch(`${target.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${target.apiKey}` },
    body: JSON.stringify({ ...payload, model: config.models[routeInfo.route]?.name || payload.model })
  });
  const text = await upstream.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!upstream.ok) throw new Error(`Provider request failed: ${upstream.status} ${JSON.stringify(body).slice(0, 500)}`);
  return body;
}

async function handleChat(request, response) {
  let payload;
  try { payload = JSON.parse(await readBody(request)); } catch { send(response, 400, { error: "Invalid JSON body" }); return; }
  const prompt = extractPrompt(payload);
  const inputTokens = approxTokens(prompt);
  const routeInfo = chooseRoute(prompt);
  const outputTokens = 40;
  const estimatedCostUsd = estimateCost(routeInfo.route, inputTokens, outputTokens);
  const currentSpend = dailySpend();
  if (currentSpend + estimatedCostUsd > config.budget.dailyUsd) {
    send(response, 402, { error: "Daily ModelBudget cap exceeded", current_spend_usd: Number(currentSpend.toFixed(8)), attempted_cost_usd: Number(estimatedCostUsd.toFixed(8)), daily_budget_usd: config.budget.dailyUsd });
    return;
  }
  writeLog({ timestamp: new Date().toISOString(), requestedModel: payload.model || "", route: routeInfo.route, reason: routeInfo.reason, inputTokens, outputTokens, estimatedCostUsd: Number(estimatedCostUsd.toFixed(8)), privateSignal: hasPrivatePath(prompt), promptPreview: config.logging.storePrompts ? prompt.slice(0, 500) : "" });
  try {
    const forwarded = await forwardCompletion(payload, routeInfo);
    if (forwarded) {
      forwarded.modelbudget = { route: routeInfo.route, reason: routeInfo.reason, estimated_cost_usd: Number(estimatedCostUsd.toFixed(8)), daily_spend_usd: Number(dailySpend().toFixed(8)), stores_prompts: config.logging.storePrompts, provider_mode: config.providers.mode };
      send(response, 200, forwarded);
      return;
    }
    const mocked = mockCompletion(payload, routeInfo, inputTokens, estimatedCostUsd);
    mocked.modelbudget.provider_mode = config.providers.mode;
    send(response, 200, mocked);
  } catch (error) {
    send(response, 502, { error: "ModelBudget provider forwarding failed", message: error.message, route: routeInfo.route, provider_mode: config.providers.mode });
  }
}

function dashboardData() {
  const logs = readLogs();
  const totalCost = logs.reduce((sum, log) => sum + Number(log.estimatedCostUsd || 0), 0);
  const byRoute = {};
  for (const log of logs) {
    byRoute[log.route] ||= { requests: 0, estimatedCostUsd: 0 };
    byRoute[log.route].requests += 1;
    byRoute[log.route].estimatedCostUsd += Number(log.estimatedCostUsd || 0);
  }
  return { requests: logs.length, estimatedCostUsd: Number(totalCost.toFixed(8)), dailyBudgetUsd: config.budget.dailyUsd, providerMode: config.providers.mode, cloudForwardingAllowed: config.providers.allowCloudForwarding, byRoute, privateSignals: logs.filter((log) => log.privateSignal).length, storesPrompts: config.logging.storePrompts };
}

async function handleOllamaStatus(response) {
  const baseUrl = config.providers.ollama.baseUrl.replace(/\/$/, "");
  try {
    const upstream = await fetch(`${baseUrl}/models`);
    const body = await upstream.json().catch(() => ({}));
    send(response, 200, { reachable: upstream.ok, status: upstream.status, baseUrl, providerMode: config.providers.mode, activeForLocalRoute: config.providers.mode === "ollama", models: Array.isArray(body.data) ? body.data.map((model) => model.id || model.name).filter(Boolean) : [] });
  } catch (error) {
    send(response, 200, { reachable: false, baseUrl, providerMode: config.providers.mode, activeForLocalRoute: config.providers.mode === "ollama", error: error.message });
  }
}

function dashboardHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ModelBudget Dashboard</title><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f6f7f4;color:#17211b}.wrap{width:min(1080px,calc(100% - 32px));margin:0 auto;padding:28px 0 46px}h1{margin:0 0 8px;font-size:34px;letter-spacing:0}.muted{color:#5d6a62;margin:0 0 22px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{background:#fff;border:1px solid #dce1dc;border-radius:8px;padding:16px}.label{color:#5d6a62;font-size:13px;margin-bottom:6px}.value{font-size:26px;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:18px;background:#fff;border:1px solid #dce1dc;border-radius:8px;overflow:hidden}th,td{text-align:left;padding:11px 10px;border-top:1px solid #e3e7e2}th{color:#5d6a62;font-size:13px}@media(max-width:780px){.grid{grid-template-columns:1fr}}</style></head><body><main class="wrap"><h1>ModelBudget Dashboard</h1><p class="muted">Local request summary. Prompts are not stored unless enabled in config.</p><section class="grid" id="metrics"></section><table><thead><tr><th>Route</th><th>Requests</th><th>Estimated cost</th></tr></thead><tbody id="routes"></tbody></table></main><script>const money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:6});async function load(){const data=await(await fetch("/dashboard")).json();document.getElementById("metrics").innerHTML=[["Requests",data.requests],["Estimated cost",money.format(data.estimatedCostUsd)],["Private signals",data.privateSignals],["Provider mode",data.providerMode]].map(([label,value])=>'<div class="card"><div class="label">'+label+'</div><div class="value">'+value+'</div></div>').join("");document.getElementById("routes").innerHTML=Object.entries(data.byRoute||{}).map(([route,item])=>'<tr><td>'+route+'</td><td>'+item.requests+'</td><td>'+money.format(item.estimatedCostUsd)+'</td></tr>').join("")}load();</script></body></html>`;
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") { send(response, 200, { status: "ok", service: "modelbudget" }); return; }
  if (request.method === "GET" && request.url === "/config/status") { send(response, 200, validateConfig()); return; }
  if (request.method === "GET" && request.url === "/providers/ollama/status") { await handleOllamaStatus(response); return; }
  if (request.method === "GET" && request.url === "/dashboard") { send(response, 200, dashboardData()); return; }
  if (request.method === "GET" && request.url === "/ui") { sendHtml(response, 200, dashboardHtml()); return; }
  if (request.method === "POST" && request.url === "/v1/chat/completions") { await handleChat(request, response); return; }
  send(response, 404, { error: "Not found" });
});

server.listen(config.server.port, config.server.host, () => {
  console.log(`ModelBudget MVP listening on http://${config.server.host}:${config.server.port}`);
});
