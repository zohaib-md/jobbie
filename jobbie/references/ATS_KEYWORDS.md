# ATS keyword analysis

jobbie's `ats analyze` command compares job-description keywords against the canonical résumé and verified profile skills.

## How to use it

1. Extract the full job description from the direct employer page.
2. Ensure the canonical résumé text is available locally.
3. Run `ats analyze --stdin`.
4. Treat `missing` keywords as hypotheses, not facts to invent.

## Interpreting coverage

| Coverage | Meaning |
| --- | --- |
| `>= 0.70` | Strong alignment; proceed if fit gates pass |
| `0.50 - 0.69` | Moderate alignment; tighten narrative to verified strengths |
| `< 0.50` | Weak alignment; reassess fit before applying |

## Rules

- Never add unverified tools, employers, or metrics to the résumé based on this report.
- Use the report to decide whether to apply, not to fabricate experience.
- Pair ATS analysis with `score --stdin` and eligibility checks.
