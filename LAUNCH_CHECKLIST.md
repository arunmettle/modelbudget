# Launch Checklist

## Before Posting

- Confirm demo URL is live.
- Confirm `/config/status` shows `mock`.
- Confirm cloud forwarding is disabled.
- Confirm prompt storage is disabled.
- Confirm dashboard loads on desktop and mobile.
- Confirm launch copy includes a clear validation question.

## Launch Channels

Manual posting only. Do not bypass sign-ins, CAPTCHAs, or platform rules.

Recommended:
- GitHub repo.
- Hacker News "Show HN".
- Reddit: r/LocalLLaMA.
- Reddit: r/programming.
- Reddit: r/OpenAI.
- Reddit: r/ClaudeAI.
- Indie Hackers.
- X/LinkedIn developer post.

## Tracking

Update:

```text
validation/modelbudget/validation-metrics.csv
```

Track:
- Visitors.
- Calculator/demo runs.
- Stars/saves.
- Comments.
- Waitlist/contact.
- Proxy trial requests.

## Decision

Run:

```powershell
node scripts/summarize_modelbudget_validation.mjs
```

Continue only if validation signals are real, not just polite praise.
