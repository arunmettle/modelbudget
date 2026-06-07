# ModelBudget Validation Package

ModelBudget is a proposed AI agent spend firewall for developers and small teams.

Promise:
See where AI coding agents burn money, estimate savings from cheaper/local routing, and identify privacy-sensitive calls that should not leave the machine.

## Validation Goal

Do not build the full paid product yet. Validate whether developers care about:
- AI agent spend visibility.
- Budget caps per repo/project.
- Local/cheap model routing for routine tasks.
- Privacy rules before cloud model fallback.

## Assets

- `index.html` - static calculator/demo page.
- `sample-agent-log.csv` - fake agent-call log for demo calculations.
- `validation-metrics.csv` - manual tracking sheet for launch signals.
- `launch-copy.md` - public post drafts.
- `decision-gates.md` - continue/pivot criteria.

## Local Use

Open `index.html` in a browser or serve it statically.

No user data is collected. No external calls are made. The calculator runs in the browser.
