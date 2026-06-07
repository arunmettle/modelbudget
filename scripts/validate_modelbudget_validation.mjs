import fs from "node:fs";

const requiredFiles = [
  "validation/modelbudget/README.md",
  "validation/modelbudget/index.html",
  "validation/modelbudget/sample-agent-log.csv",
  "validation/modelbudget/validation-metrics.csv",
  "validation/modelbudget/launch-copy.md",
  "validation/modelbudget/decision-gates.md",
];

const requiredHtml = [
  "ModelBudget",
  "Find the hidden cost inside AI coding-agent runs.",
  "Cost Scenario",
  "Estimated Monthly Impact",
  "Budget caps",
  "Local fallback",
  "Cost reports",
  "Privacy rule example",
];

const requiredLaunch = [
  "Hacker News / Reddit Draft",
  "GitHub README Hook",
  "X / LinkedIn Short Draft",
  "What would make this useful enough to install?",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const html = fs.readFileSync("validation/modelbudget/index.html", "utf8");
const missingHtml = requiredHtml.filter((text) => !html.includes(text));
if (missingHtml.length) {
  throw new Error(`Validation demo missing required text: ${missingHtml.join(", ")}`);
}

const launch = fs.readFileSync("validation/modelbudget/launch-copy.md", "utf8");
const missingLaunch = requiredLaunch.filter((text) => !launch.includes(text));
if (missingLaunch.length) {
  throw new Error(`Launch copy missing required text: ${missingLaunch.join(", ")}`);
}

const metrics = fs.readFileSync("validation/modelbudget/validation-metrics.csv", "utf8");
if (!metrics.startsWith("date,channel,asset,visitors,calculator_runs")) {
  throw new Error("validation-metrics.csv does not have the expected header");
}

console.log("ModelBudget validation package passed");
