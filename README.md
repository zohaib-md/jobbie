# jobbie

Privacy-first Agent Skill and CLI for onboarding a résumé, checking keyword gaps against a job description, drafting truthful application materials, and tracking outcomes.

**Apply with verified facts · Keep private data local · Rank listings you already have · Learn from outcomes**

## Quick start

Requires Node.js 20+.

```bash
npx jobbie@latest install
```

Then, in a coding agent chat, with a local résumé and a pasted job description:

```text
Use jobbie to onboard my resume and run a keyword-gap check against this job description.
```

Other installer commands:

```bash
npx jobbie@latest status
npx jobbie@latest update
npx jobbie@latest updates disable
npx jobbie@latest updates enable
```

The installer places the skill at `~/.agents/skills/jobbie` and copies it to `~/.cursor/skills/jobbie` when that directory exists.

After install, local commands also run from the package:

```bash
npx jobbie onboard --resume ./resume.txt
npx jobbie ats analyze --stdin
npx jobbie discover search --stdin < listings.json
```

`discover search` ranks JSON listings **you or your agent supply**. Each listing needs `company`, `role`, and `url`. jobbie does not search a built-in job board.

### Onboard your profile

```text
Use jobbie to onboard my resume and job-search preferences.
```

Submission modes:

- `review-each` — inspect every application before submission (default)
- `routine-auto` — prepare an authorized batch; **each actual submission still requires explicit confirmation**

### Natural commands

```text
onboard this resume
ats analyze this posting
rank these job listings
apply https://company.example/jobs/123
draft a cover letter for this role
prep me for this interview
record outcome Company — Senior Engineer — interview
```

## What it does

| Collect | Qualify | Apply |
| --- | --- | --- |
| Onboards a local résumé into sourced facts | Scores seniority, skills, location, eligibility, work mode, and compensation | Fills forms using only verified profile and résumé facts |
| Ranks listings you already collected from public pages | Skips closed, duplicated, ineligible, and weak-fit opportunities | Uploads one canonical résumé and drafts truthful short answers |

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
| Candidate profile | macOS Keychain or encrypted local file (`~/.jobbie/profile.enc`) |
| Canonical résumé and verified facts | `~/.jobbie/` (`resume.txt`, `facts.json`) |
| Application ledger | `~/.jobbie/applications.ndjson` and `outcomes.ndjson` |
| Browser authentication | Existing browser session only |

Override the local directory with `JOBBIE_HOME` (used by tests). Nothing is written outside that directory except the installed skill copies under `~/.agents/skills/jobbie` and, when present, `~/.cursor/skills/jobbie`.

### Telemetry

Telemetry is **off by default**. Enabling it does **not** send data anywhere; there is no relay configured. If you run `telemetry enable` and then `telemetry record`, jobbie may preview **only** these fields locally:

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
node ~/.agents/skills/jobbie/scripts/jobbie.mjs onboard --resume ./resume.txt
node ~/.agents/skills/jobbie/scripts/jobbie.mjs profile check
node ~/.agents/skills/jobbie/scripts/jobbie.mjs ats analyze --stdin
node ~/.agents/skills/jobbie/scripts/jobbie.mjs discover search --stdin
node ~/.agents/skills/jobbie/scripts/jobbie.mjs score --stdin
node ~/.agents/skills/jobbie/scripts/jobbie.mjs cover-letter draft --stdin
node ~/.agents/skills/jobbie/scripts/jobbie.mjs prep generate --stdin
node ~/.agents/skills/jobbie/scripts/jobbie.mjs safety classify --stdin
node ~/.agents/skills/jobbie/scripts/jobbie.mjs ledger review
```

## Validate locally

```bash
npm test
npm run check
```

## Limitations

- jobbie does **not** guarantee interviews, offers, eligibility, or that a form was filled correctly.
- It does **not** auto-submit applications. `autoEligible` only means a posting passed local gates; you still confirm each submission.
- It does **not** solve CAPTCHA, complete MFA, or evade bot detection. Those are hard stops.
- It does **not** invent résumé facts, dates, compensation, or attestation answers. Missing facts return `needs-user-input`.
- It does **not** search job boards. Discovery ranks listings you supply (`company`, `role`, and `url` required) and will not walk around login walls.
- PDF import is **text-based only**. Uncompressed PDFs and DOCX files can be extracted locally. Scanned or image-only PDFs need a local `.txt` or `.md` extract. jobbie will not OCR or invent text.
- Platform terms of use still apply. You are responsible for reviewing claims and deciding when to submit.
- This is an MIT-licensed side project, not a company or a placement service.

## Acknowledgements

jobbie is derived from [Applykit](https://github.com/manthan-jsharma/apply-kit-npm) 1.0.0 by Manthan Sharma (`manthan.jsharma@gmail.com`). The original skill, installer, scoring, and local-store design are that work.

This repository adds, on top of that base:

- local DOCX and simple PDF text import (no OCR)
- tested safety pauses for MFA, CAPTCHA, legal attestations, and unverifiable answers
- sourced résumé facts that refuse to guess missing fields
- a ledger that records `submitted` only after visible confirmation

Do not treat jobbie as a from-scratch rewrite of Applykit.

## Responsible use

This project assists a person with their own job search. You are responsible for reviewing factual claims, complying with applicable laws and platform terms, and deciding when an application should be submitted.

## License

MIT. See [LICENSE](LICENSE). Original Applykit implementation: [manthan-jsharma/apply-kit-npm](https://github.com/manthan-jsharma/apply-kit-npm).
