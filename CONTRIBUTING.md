# Contributing

Thanks for helping improve jobbie. This is an MIT-licensed side project. Keep it small, honest, and safe.

## Setup

```bash
git clone <this-repo>
cd jobbie
npm test
npm run check
```

Node.js 20+ is required. There are no runtime npm dependencies.

## How to work

1. Prefer tests first for anything that touches safety, privacy, verified facts, or the ledger.
2. Keep commits small and explain why the change exists.
3. Do not rewrite working modules unless they violate the principles below.

## Non-negotiable rules

- **Verified facts only.** Application answers must trace to the résumé or profile. If they cannot, return `needs-user-input`. Never invent dates, titles, skills, or compensation.
- **Privacy by default.** Candidate data stays in `JOBBIE_HOME` or `~/.jobbie/`. Do not log résumés, emails, or phone numbers. Telemetry stays off unless the user enables it, and then only the documented fields may be previewed.
- **Safety pauses.** Stop for MFA, CAPTCHA, legal attestations, demographics, government IDs, and unverifiable answers. Never add code that solves or bypasses those checks.
- **Real ledger.** Record `submitted` only with `visibleConfirmation: true`. Use `prepared` for packets that were not actually sent.

## Tests and fixtures

- Put fake résumés in `jobbie/fixtures/resumes/`.
- Never commit real personal data, live application records, screenshots of real forms, or `.env` files.
- Run `npm test` before opening a pull request.

## Suggested first contributions

See [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md). After the GitHub remote exists and `gh` is authenticated:

```bash
npm run issues
```

## Security reports

Follow [SECURITY.md](SECURITY.md). Do not file public issues that contain candidate data.
