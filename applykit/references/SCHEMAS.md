# Schemas

## Profile

Required fields:

- `fullName`
- `email`
- `targetRoles` (string array)
- `targetSeniority` (`intern` | `junior` | `mid` | `senior` | `staff` | `principal`)
- `workAuthorization`
- `submissionMode` (`review-each` | `routine-auto`)

Optional fields include `phone`, `location`, `linkedinUrl`, `portfolioUrl`, `requiresSponsorship`, `targetLocations`, `workModes`, `excludedCompanies`, `targetCompensation`, `compensationFloor`, `skills`, and `yearsExperience`.

## Score input

```json
{
  "company": "Example Corp",
  "role": "Senior Engineer",
  "seniority": "senior",
  "postingStatus": "active",
  "eligibility": "eligible",
  "workMode": "remote",
  "compensationBelowFloor": false,
  "mustHaveRequirements": [
    { "name": "TypeScript", "status": "met" },
    { "name": "Distributed systems", "status": "partial" }
  ]
}
```

## Ledger application

```json
{
  "company": "Example Corp",
  "role": "Senior Engineer",
  "url": "https://jobs.example.com/123",
  "jobId": "123",
  "status": "submitted",
  "fitScore": 84
}
```

## ATS analyze input

```json
{
  "jobDescription": "We need TypeScript, React, and AWS experience...",
  "resumeText": "optional override; otherwise canonical résumé is used"
}
```

## Cover letter input

```json
{
  "company": "Example Corp",
  "role": "Senior Engineer",
  "highlights": [
    "Led migration of billing service to TypeScript",
    "Owned on-call rotation for payments API"
  ]
}
```

## Interview prep input

```json
{
  "company": "Example Corp",
  "role": "Senior Engineer",
  "jobDescription": "Full posting text"
}
```
