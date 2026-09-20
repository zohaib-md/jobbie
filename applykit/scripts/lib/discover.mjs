import { scorePosting } from './scoring.mjs';

export function searchJobs({ query = '', listings = [], profile = null } = {}) {
  const results = listings.map((job) => {
    const scoring = profile
      ? scorePosting(
          {
            company: job.company,
            role: job.role,
            seniority: job.seniority,
            postingStatus: job.postingStatus ?? 'active',
            eligibility: job.eligibility ?? 'unclear',
            workMode: job.workMode,
            mustHaveRequirements: job.mustHaveRequirements,
          },
          profile,
        )
      : { gate: 'ask', score: null, reasons: ['Profile not loaded; ranking by keyword only'], autoEligible: false };

    return {
      company: job.company,
      role: job.role,
      url: job.url,
      jobId: job.jobId,
      seniority: job.seniority,
      workMode: job.workMode,
      postingStatus: job.postingStatus ?? 'unclear',
      gate: scoring.gate,
      score: scoring.score,
      autoEligible: scoring.autoEligible === true,
      reasons: scoring.reasons,
    };
  });

  results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return {
    query,
    resultCount: results.length,
    results,
    guidance: [
      'Rank only listings the candidate or agent already collected from public pages.',
      'Do not scrape behind CAPTCHA, login, or bot detection.',
      'Do not auto-submit. Use prepare-and-review and pause for MFA, CAPTCHA, and attestations.',
    ],
  };
}
