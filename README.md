# ModelBudget

AI agent spend control for developers.

ModelBudget is a local-first OpenAI-compatible proxy that helps developers see where AI coding-agent runs cost money, route routine tasks to cheaper/local models, and block private paths from cloud fallback.

## Why This Exists

AI coding agents are useful, but cost visibility is poor.

Agent runs often spend tokens on routine work:
- Repo summaries.
- Test-error explanations.
- Dependency summaries.
- README drafts.
- Repeated planning loops.

Frontier models are valuable for hard reasoning, but not every step needs them.

## What The Current MVP Does

- Exposes `/v1/chat/completions`.
- Runs in `mock` mode by default.
- Logs approximate request cost.
- Routes routine tasks to `cheap`.
- Routes private/secrets-like requests to `local`.
- Routes hard architecture/refactor tasks to `premium`.
- Shows a JSON dashboard at `/dashboard`.
- Shows a browser dashboard at `/ui`.
- Keeps prompt storage disabled by default.
- Keeps cloud forwarding disabled by default.

## Live Demo

Temporary demo:

```text
https://c9491bd1fdf9ae.lhr.life/ui
```

The demo is temporary and may go offline when the local tunnel stops.

Safety state:
- Provider mode: `mock`.
- Cloud forwarding: disabled.
- Prompt storage: disabled.
- No paid AI API calls.

## Local Run

```powershell
node modelbudget-mvp/server.mjs
```

Then open:

```text
http://127.0.0.1:8787/ui
```

## OpenAI-Compatible Client Setup

```text
OPENAI_BASE_URL=http://127.0.0.1:8787/v1
OPENAI_API_KEY=local-modelbudget-key
```

## Validation Question

If you use Cursor, Claude Code, Codex, OpenClaw, Hermes, Continue, Open WebUI, OpenRouter, Ollama, or OpenAI-compatible agents:

- Do you care about per-run AI agent cost?
- Do you need budget caps per repo/project?
- Would privacy rules for `.env`, secrets, and client files matter?
- Which agent/tool should be supported first?
- Would you install a local proxy if it showed clear spend and privacy signals?

## Continue Criteria

This moves from validation to a real proxy product if at least two happen:
- 300+ visitors.
- 50+ calculator/demo runs.
- 25+ stars/saves.
- 10+ meaningful developer comments.
- 5+ people ask for a working proxy.
- 2+ people ask about team dashboards, privacy rules, or budget enforcement.

## License

MIT for the validation prototype.
