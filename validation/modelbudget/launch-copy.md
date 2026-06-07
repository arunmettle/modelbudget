# ModelBudget Launch Copy

## Short Positioning

ModelBudget is a proposed local-first spend firewall for AI coding agents.

It shows what an agent run costs, which tasks could be cheaper, and where private files should stay local.

## Hacker News / Reddit Draft

Title:
I built a small calculator to estimate hidden AI coding-agent spend

Post:

I have been looking at the cost side of coding agents. The more agentic the workflow gets, the easier it is to burn requests on routine steps: repo summaries, test-error explanations, dependency summaries, README drafts, and repeated planning loops.

I made a small browser-only calculator/demo for a possible tool called ModelBudget.

The idea is not another coding agent. It is a spend/privacy layer in front of coding agents:
- show estimated cost per agent task
- flag private paths that should stay local
- estimate savings if routine tasks move to local/cheaper models
- reserve frontier models for hard refactors/reasoning

I am trying to validate whether this is a real pain before building the proxy.

Question:
If you use Cursor, Claude Code, Codex, OpenClaw, Hermes, Continue, or OpenAI-compatible agents, do you actually care about per-run cost visibility and budget caps?

What would make this useful enough to install?

## GitHub README Hook

# ModelBudget

Experimental AI agent spend firewall.

See what coding-agent runs cost, estimate local/cheap-model savings, and flag private files before cloud fallback.

This repo starts with a calculator/demo. A local OpenAI-compatible proxy comes next if validation shows real demand.

## X / LinkedIn Short Draft

AI coding agents are getting useful, but the cost visibility is poor.

I am testing an idea: a local spend/privacy layer that shows what each agent run costs, flags private paths, and estimates savings from local/cheap routing.

Would you install this in front of Cursor/Claude Code/Codex/OpenClaw/Hermes?
