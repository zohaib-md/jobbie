# Good first issues

Create these as GitHub issues when the repository is published. Each item is sized for a first-time contributor.

## 1. Parse more résumé section headings

`extractFactsFromResume` recognizes Skills, Experience, Education, Summary, and Projects. Add aliases such as "Core competencies", "Professional history", and "Academic background", with fixture coverage and no inferred facts.

## 2. Expand ATS skill synonyms

`ats analyze` tokenizes job descriptions and matches a small skill list. Add a synonym map (for example `k8s` → `kubernetes`, `postgres` → `postgresql`) in `applykit/scripts/lib/ats.mjs` and tests that still refuse to invent unmatched skills.

## 3. Ledger outcome labels helper

`ledger outcome` accepts free-text outcomes. Add a documented enum (`submitted`, `rejected`, `interview`, `offer`, `withdrawn`, `no-response`) and a `--help` example, while still storing the candidate's original note separately.

## 4. Windows encrypted-profile docs

Document how the encrypted-file fallback works on Windows and add a test that `getProfileStorageInfo()` does not mention Keychain there.

## 5. Discover input validation

`discover search` currently ranks whatever JSON listings it is given. Validate required fields (`company`, `role`, `url`) and return a clear `needs-user-input` error when they are missing, without fetching pages.

## 6. Cover-letter length option

Allow `cover-letter draft` to accept `maxWords` (default 180) and trim verified highlights rather than inventing filler.
