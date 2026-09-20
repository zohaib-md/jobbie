# Applykit

Privacy-first Agent Skill and CLI for evidence-based job discovery, application completion, and outcome tracking.

**Discover better roles · Apply with verified facts · Keep private data local · Learn from outcomes**

## Quick start

Requires Node.js 20+.

```bash
npx applykit@latest install
```

Then, in a coding agent chat:

```text
Use applykit to onboard my resume and search for senior engineer roles.
```

Other installer commands:

```bash
npx applykit@latest status
npx applykit@latest update
npx applykit@latest updates disable
npx applykit@latest updates enable
```

The installer places the skill at `~/.agents/skills/applykit` and copies it to `~/.cursor/skills/applykit` when that directory exists.

After install, local commands also run from the package:

```bash
npx applykit onboard --resume ./resume.txt
npx applykit discover search --stdin < listings.json
```

### Onboard your profile

```text
Use applykit to onboard my resume and job-search preferences.
```

Submission modes:

- `review-each` — inspect every application before submission (default)
- `routine-auto` — prepare an authorized batch; **each actual submission still requires explicit confirmation**

### Natural commands

```text
search jobs
apply https://company.example/jobs/123
run a round of 10
ats analyze this posting
draft a cover letter for this role
prep me for this interview
record outcome Company — Senior Engineer — interview
```

## What it does

| Discover | Qualify | Apply |
| --- | --- | --- |
| Ranks listings you (or your agent) collected from public employer pages | Scores seniority, skills, location, eligibility, work mode, and compensation | Fills forms using only verified profile and résumé facts |
| Stops at CAPTCHA, login walls, and bot checks instead of scraping around them | Skips closed, duplicated, ineligible, and weak-fit opportunities | Uploads one canonical résumé and drafts truthful short answers |

| Protect | Track | Improve |
| --- | --- | --- |
| Keeps profile data in OS-backed storage and browser auth in the browser | Records prepared packets separately from visibly confirmed submissions | Reviews results every ten submissions and proposes targeting changes |
| Stops at sensitive or judgment-heavy steps | Captures outcomes plus optional interview quality and failure points | Never changes preferences without your approval |

## Extra features

- **ATS keyword-gap reports** via `ats analyze`
- **Cover-letter drafts** from verified facts via `cover-letter draft` (unverified highlights are rejected)
- **Interview prep packs** via `prep generate`
- **Telemetry disabled by default**

## Safety by design

The skill pauses for:

- passwords, SSO, MFA, and CAPTCHA
- demographic and voluntary self-identification questions
- legal attestations and government identifiers
- unclear work authorization, sponsorship, location, or compensation
- claims that cannot be verified from your profile or résumé

It never reads browser cookies or session files, never solves CAPTCHA or MFA, and never fabricates résumé facts.

## Privacy

| Data | Storage |
| --- | --- |
| Candidate profile | macOS Keychain or encrypted local file (`~/.applykit/profile.enc`) |
| Canonical résumé and verified facts | `~/.applykit/` (`resume.txt`, `facts.json`) |
| Application ledger | `~/.applykit/applications.ndjson` and `outcomes.ndjson` |
| Browser authentication | Existing browser session only |

Override the local directory with `APPLYKIT_HOME` (used by tests). Nothing is written outside that directory except the installed skill copies under `~/.agents/skills/applykit` and, when present, `~/.cursor/skills/applykit`.

### Telemetry

Telemetry is **off by default**. Enabling it does **not** send data anywhere; there is no relay configured. If you run `telemetry enable` and then `telemetry record`, Applykit may preview **only** these fields locally:

| Field | Meaning |
| --- | --- |
| `event` | Workflow event name (for example `submitted`) |
| `stage` | Pipeline stage (`discover`, `apply`, `outcome`) |
| `atsPlatform` | ATS family name if already known (`greenhouse`, `lever`, …) |
| `seniority` | Role seniority used in scoring |
| `fitScore` | Numeric fit score |
| `outcome` | Outcome label (`submitted`, `interview`, `rejected`, …) |

Résumé text, email, phone, names, and answers are stripped. Disable again with `telemetry disable`.

## Local commands

```bash
node ~/.agents/skills/applykit/scripts/applykit.mjs onboard --resume ./resume.txt
node ~/.agents/skills/applykit/scripts/applykit.mjs profile check
node ~/.agents/skills/applykit/scripts/applykit.mjs discover search --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs score --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs ats analyze --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs cover-letter draft --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs prep generate --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs safety classify --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs ledger review
```

## Validate locally

```bash
npm test
npm run check
```

## Limitations

- Applykit does **not** guarantee interviews, offers, eligibility, or that a form was filled correctly.
- It does **not** auto-submit applications. `autoEligible` only means a posting passed local gates; you still confirm each submission.
- It does **not** solve CAPTCHA, complete MFA, or evade bot detection. Those are hard stops.
- It does **not** invent résumé facts, dates, compensation, or attestation answers. Missing facts return `needs-user-input`.
- Job search ranks listings **you supply**. It is not a full job-board scraper, and it will not walk around login walls.
- PDF/DOCX résumés are stored locally; extract text to `.txt` or `.md` before fact onboarding.
- Platform terms of use still apply. You are responsible for reviewing claims and deciding when to submit.
- This is an MIT-licensed side project, not a company or a placement service.

## Responsible use

This project assists a person with their own job search. You are responsible for reviewing factual claims, complying with applicable laws and platform terms, and deciding when an application should be submitted.

## License

MIT. See [LICENSE](LICENSE). Original published implementation: [manthan-jsharma/apply-kit-npm](https://github.com/manthan-jsharma/apply-kit-npm).
