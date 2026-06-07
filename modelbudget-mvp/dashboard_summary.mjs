const response = await fetch("http://127.0.0.1:8787/dashboard");

if (!response.ok) {
  console.error(`Dashboard request failed: ${response.status}`);
  process.exit(1);
}

const data = await response.json();

console.log("ModelBudget dashboard");
console.log("=====================");
console.log(`Requests: ${data.requests}`);
console.log(`Estimated cost: $${Number(data.estimatedCostUsd || 0).toFixed(8)}`);
console.log(`Daily budget: $${Number(data.dailyBudgetUsd || 0).toFixed(2)}`);
console.log(`Provider mode: ${data.providerMode}`);
console.log(`Cloud forwarding allowed: ${data.cloudForwardingAllowed}`);
console.log(`Private signals: ${data.privateSignals}`);
console.log("");
console.log("By route:");
for (const [route, item] of Object.entries(data.byRoute || {})) {
  console.log(`- ${route}: ${item.requests} requests, $${Number(item.estimatedCostUsd || 0).toFixed(8)}`);
}
