import { analyzeAtsMatch } from './ats.mjs';

function extractThemes(jobDescription = '') {
  const themes = [];
  const checks = [
    { label: 'Leadership', pattern: /\b(lead|mentor|coach|manage)\b/i },
    { label: 'System design', pattern: /\b(architecture|scalab|distributed|system design)\b/i },
    { label: 'Ownership', pattern: /\b(own|end-to-end|drive|deliver)\b/i },
    { label: 'Collaboration', pattern: /\b(cross-functional|stakeholder|partner)\b/i },
    { label: 'Customer focus', pattern: /\b(customer|user|client)\b/i },
  ];
  for (const check of checks) {
    if (check.pattern.test(jobDescription)) {
      themes.push(check.label);
    }
  }
  return themes;
}

export function generateInterviewPrep({
  jobDescription,
  resumeText,
  profile,
  company,
  role,
}) {
  const ats = analyzeAtsMatch({
    jobDescription,
    resumeText,
    profileSkills: profile.skills ?? [],
  });
  const themes = extractThemes(jobDescription);

  const behavioralPrompts = themes.map(
    (theme) => `Tell me about a time you demonstrated ${theme.toLowerCase()}. Use STAR and cite verified résumé facts only.`,
  );

  const technicalPrompts = ats.matched.slice(0, 5).map(
    (skill) => `Explain a project where you used ${skill}. Keep the answer grounded in verified experience.`,
  );

  return {
    company,
    role,
    themes,
    atsCoverage: ats.coverage,
    behavioralQuestions: behavioralPrompts.length
      ? behavioralPrompts
      : [
          'Why this company and role?',
          'Describe a challenging project and your specific contribution.',
        ],
    technicalQuestions: technicalPrompts.length
      ? technicalPrompts
      : ['Walk me through a recent project relevant to this role.'],
    talkingPoints: [
      `Target seniority: ${profile.targetSeniority}`,
      `Work authorization: ${profile.workAuthorization}`,
      ...(profile.skills?.slice(0, 5).map((skill) => `Verified skill: ${skill}`) ?? []),
    ],
    guidance: [
      'Prepare STAR stories only from verified résumé bullets.',
      'Pause if a question requires claiming unverified tools or outcomes.',
      'Use jobbie ledger outcome recording after each interview.',
    ],
  };
}
