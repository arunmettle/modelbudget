import fs from "node:fs";

const logFile = "modelbudget-mvp/logs/requests.jsonl";

if (!fs.existsSync(logFile)) {
  console.log("No ModelBudget request logs yet.");
  process.exit(0);
}

const logs = fs
  .readFileSync(logFile, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const byRoute = {};
for (const log of logs) {
  byRoute[log.route] ||= { requests: 0, estimatedCostUsd: 0 };
  byRoute[log.route].requests += 1;
  byRoute[log.route].estimatedCostUsd += Number(log.estimatedCostUsd || 0);
}

console.log("ModelBudget log summary");
console.log("=======================");
console.log(`Requests: ${logs.length}`);
console.log(`Private signals: ${logs.filter((log) => log.privateSignal).length}`);
console.log("");
for (const [route, data] of Object.entries(byRoute)) {
  console.log(`- ${route}: ${data.requests} requests, $${data.estimatedCostUsd.toFixed(8)}`);
}
