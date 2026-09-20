import { highlightIsVerified } from './facts.mjs';

export function draftCoverLetter({
  profile,
  company,
  role,
  highlights = [],
  resumeText = '',
  facts = [],
}) {
  const verifiedHighlights = highlights
    .filter((item) => highlightIsVerified(item, resumeText, facts))
    .slice(0, 3);
  const rejectedHighlights = highlights.filter(
    (item) => item && !highlightIsVerified(item, resumeText, facts),
  );
  const intro = `Dear Hiring Team at ${company},`;
  const focus = profile.targetRoles?.join(', ') || 'my target domain';
  const body = [
    `I am writing to express interest in the ${role} role.`,
  ];
  if (profile.yearsExperience) {
    body.push(
      `My background includes ${profile.yearsExperience} years of experience focused on ${focus}.`,
    );
  } else {
    body.push(`My verified experience is focused on ${focus}.`);
  }

  if (verifiedHighlights.length) {
    body.push(
      'Relevant experience from my verified résumé includes:',
      ...verifiedHighlights.map((item) => `- ${item}`),
    );
  } else if (profile.skills?.length) {
    body.push(
      `Core skills aligned to this search include ${profile.skills.slice(0, 6).join(', ')}.`,
    );
  }

  body.push(
    'I would welcome the opportunity to discuss how my verified experience can support your team.',
    'Thank you for your consideration.',
    profile.fullName ?? 'Candidate',
    profile.email ?? '',
  );

  return {
    subject: `Application — ${role} — ${profile.fullName ?? 'Candidate'}`,
    body: [intro, '', ...body].join('\n'),
    guidance: [
      'Use only facts present in the canonical résumé or profile.',
      'Do not claim metrics, tools, or employers that are not verified.',
      'Ask the candidate to review before pasting into any application form.',
    ],
    rejectedHighlights,
  };
}
