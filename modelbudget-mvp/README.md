# ModelBudget MVP

ModelBudget is an experimental AI agent spend-control proxy.

This MVP is intentionally local and dependency-free:
- OpenAI-compatible `/v1/chat/completions` endpoint.
- Mock response mode by default.
- Explicit provider modes: `mock`, `ollama`, or `openai-compatible`.
- Request logging.
- Cost estimation.
- Privacy/path warnings.
- Daily budget cap check.
- `/dashboard` JSON endpoint.

It does not send prompts to external providers unless future provider forwarding is explicitly implemented and enabled.
Fresh installs use `mock` mode and cannot call paid cloud APIs by accident.

## Run

```powershell
node modelbudget-mvp/server.mjs
```

Default URL:

```text
http://127.0.0.1:8787
```

## Test

```powershell
node modelbudget-mvp/sample_request.mjs
node modelbudget-mvp/summarize_logs.mjs
node modelbudget-mvp/dashboard_summary.mjs
node modelbudget-mvp/demo_flow.mjs
```

## Dashboard

JSON:

```text
http://127.0.0.1:8787/dashboard
```

Browser UI:

```text
http://127.0.0.1:8787/ui
```

## Safety And Provider Status

```text
http://127.0.0.1:8787/config/status
http://127.0.0.1:8787/providers/ollama/status
```

`/config/status` confirms whether config is valid and whether cloud forwarding is enabled.

`/providers/ollama/status` checks whether the configured Ollama/OpenAI-compatible local endpoint is reachable. It does not enable forwarding by itself.

## Use With OpenAI-Compatible Clients

Point a client at:

```text
OPENAI_BASE_URL=http://127.0.0.1:8787/v1
OPENAI_API_KEY=local-modelbudget-key
```

## MVP Limits

- Local Ollama forwarding is available only when `providers.mode` is set to `ollama`.
- Cloud forwarding requires `providers.mode` set to `openai-compatible`, `allowCloudForwarding` set to `true`, and an API key environment variable.
- Token counts are approximate.
- Pricing is estimated from local config.
- Prompt content is not stored by default.
- This is a validation prototype, not a production gateway.
