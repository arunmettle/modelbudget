import fs from "node:fs";

const requiredFiles = [
  "README.md",
  "ROADMAP.md",
  "FEEDBACK.md",
  "LAUNCH_CHECKLIST.md",
  "LICENSE",
  "modelbudget-mvp/README.md",
  "modelbudget-mvp/config.json",
  "modelbudget-mvp/server.mjs",
  "validation/modelbudget/README.md",
  "validation/modelbudget/index.html"
];

const requiredReadme = [
  "ModelBudget",
  "AI agent spend control",
  "Live Demo",
  "Provider mode: `mock`",
  "Cloud forwarding: disabled",
  "Prompt storage: disabled",
  "Continue Criteria"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing public package file: ${file}`);
  }
}

const readme = fs.readFileSync("README.md", "utf8");
const missing = requiredReadme.filter((text) => !readme.includes(text));
if (missing.length) {
  throw new Error(`Public README missing required text: ${missing.join(", ")}`);
}

console.log("ModelBudget public package validation passed");
