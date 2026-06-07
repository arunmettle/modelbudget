# ModelBudget MVP Next Steps

## Current MVP Status

Implemented:
- OpenAI-compatible `/v1/chat/completions` endpoint.
- Mock response mode.
- Route decision: local, cheap, premium.
- Privacy/private-path detection.
- Cost estimation.
- Request logging.
- Daily budget cap.
- `/dashboard` JSON summary.
- `/ui` browser dashboard.
- Explicit provider modes with mock as the safe default.
- Optional Ollama forwarding configuration.
- Automated MVP validation.

Not implemented:
- Provider API key management.
- Streaming responses.
- Persistent dashboard UI.
- Per-project config.
- Secret redaction beyond simple pattern detection.
- GitHub repository packaging.

## Next Build Step

Improve provider support:
- Add streaming support.
- Add per-route provider selection.
- Add config validation for Ollama model availability.
- Add OpenAI-compatible hosted forwarding only behind explicit opt-in.

Keep `mock` as default to avoid accidental charges.

## Market Validation Step

Share the validation demo and launch copy only after user approval.

Ask developers:
- Do they care about per-run AI agent cost?
- Do they need budget caps?
- Would they route simple tasks to local/cheap models?
- Which tools should be supported first: Cursor, Claude Code, Codex, OpenClaw, Hermes, Continue, Open WebUI?

## Continue Gate

Build real forwarding only if:
- 5 developers ask for a working proxy, or
- 2 developers ask about team dashboards, privacy rules, or budget enforcement.
