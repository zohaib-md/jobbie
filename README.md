# Applykit

Privacy-first Agent Skill and CLI for evidence-based job discovery, application completion, and outcome tracking.

**Discover better roles · Apply with verified facts · Keep private data local · Learn from outcomes**

## Install

```bash
npx applykit@latest install
```

Requires Node.js 20+.

```bash
npx applykit@latest status
npx applykit@latest update
npx applykit@latest updates disable
npx applykit@latest updates enable
```

The installer places the skill at `~/.agents/skills/applykit` and copies it to `~/.cursor/skills/applykit` when that directory exists.

## Quick start

### 1. Install the skill

```bash
npx applykit@latest install
```

### 2. Onboard your profile

In a coding agent chat:

```text
Use applykit to onboard my resume and job-search preferences.
```

Submission modes:

- `review-each` — inspect every application before submission
- `routine-auto` — allow routine submissions within an authorized destination or batch

### 3. Use natural commands

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
| Finds active roles on direct career pages and major ATS platforms | Scores seniority, skills, location, eligibility, work mode, and compensation | Fills forms using only verified profile and résumé facts |
| Resolves aggregator leads to direct employer pages | Skips closed, duplicated, ineligible, and weak-fit opportunities | Uploads one canonical résumé and drafts truthful short answers |

| Protect | Track | Improve |
| --- | --- | --- |
| Keeps profile data in OS-backed storage and browser auth in the browser | Records only visibly confirmed submissions in a private local ledger | Reviews results every ten applications and proposes targeting changes |
| Stops at sensitive or judgment-heavy steps | Captures outcomes plus optional interview quality and failure points | Never changes preferences without your approval |

## Extra features

Compared with basic job-search skills, Applykit also includes:

- **ATS keyword-gap reports** via `ats analyze`
- **Cover-letter drafts** from verified facts via `cover-letter draft`
- **Interview prep packs** via `prep generate`
- **Telemetry disabled by default** for stricter privacy

## Safety by design

The skill pauses for:

- passwords, SSO, MFA, and CAPTCHA
- demographic and voluntary self-identification questions
- legal attestations and government identifiers
- unclear work authorization, sponsorship, location, or compensation
- claims that cannot be verified from your profile or résumé

It never reads browser cookies or session files.

## Privacy model

| Data | Storage |
| --- | --- |
| Candidate profile | macOS Keychain or encrypted local file |
| Canonical résumé | `~/.applykit/` |
| Application ledger | `~/.applykit/` |
| Browser authentication | Existing browser session only |

Telemetry is **off by default**.

## Local commands

```bash
node ~/.agents/skills/applykit/scripts/applykit.mjs profile check
node ~/.agents/skills/applykit/scripts/applykit.mjs score --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs ats analyze --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs cover-letter draft --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs prep generate --stdin
node ~/.agents/skills/applykit/scripts/applykit.mjs ledger review
```

## Validate locally

```bash
npm test
```

## Responsible use

This project assists a person with their own job search. It does not guarantee interviews, offers, eligibility, or application accuracy. You are responsible for reviewing factual claims, complying with applicable laws and platform terms, and deciding when an application should be submitted.

## License

MIT
