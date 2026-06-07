import fs from "node:fs";

function parseCsv(text) {
  const rows = [];
  let cell = "";
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...records] = rows.filter((line) => line.some((value) => value.trim()));
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] || "").trim()]))
  );
}

const rows = parseCsv(fs.readFileSync("validation/modelbudget/validation-metrics.csv", "utf8"));
const totals = rows.reduce(
  (acc, row) => {
    acc.visitors += Number(row.visitors || 0);
    acc.calculatorRuns += Number(row.calculator_runs || 0);
    acc.repoStars += Number(row.repo_stars || 0);
    acc.comments += Number(row.comments || 0);
    acc.waitlist += Number(row.waitlist_or_contact || 0);
    acc.proxyRequests += Number(row.proxy_trial_requests || 0);
    return acc;
  },
  { visitors: 0, calculatorRuns: 0, repoStars: 0, comments: 0, waitlist: 0, proxyRequests: 0 }
);

const continueSignals = [
  totals.visitors >= 300,
  totals.calculatorRuns >= 50,
  totals.repoStars >= 25,
  totals.comments >= 10,
  totals.proxyRequests >= 5,
  totals.waitlist >= 2,
].filter(Boolean).length;

console.log("ModelBudget validation summary");
console.log("==============================");
console.log(`Visitors: ${totals.visitors}`);
console.log(`Calculator runs: ${totals.calculatorRuns}`);
console.log(`Repo stars/saves: ${totals.repoStars}`);
console.log(`Meaningful comments: ${totals.comments}`);
console.log(`Waitlist/contact: ${totals.waitlist}`);
console.log(`Proxy trial requests: ${totals.proxyRequests}`);
console.log(`Continue signals met: ${continueSignals}/6`);
console.log("");

if (continueSignals >= 2) {
  console.log("Decision: continue to proxy MVP");
} else if (totals.visitors === 0) {
  console.log("Decision: not launched yet");
} else {
  console.log("Decision: keep validating or pivot if qualitative feedback is weak");
}
