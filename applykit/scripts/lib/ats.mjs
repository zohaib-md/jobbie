const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with', 'at',
  'by', 'from', 'as', 'is', 'are', 'be', 'this', 'that', 'will', 'you', 'your',
  'our', 'we', 'us', 'ability', 'experience', 'work', 'team', 'role', 'including',
]);

function tokenize(text = '') {
  return [...new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  )];
}

function extractKeywords(text) {
  const tokens = tokenize(text);
  const phrases = [];
  const skillPattern = /\b(?:typescript|javascript|python|react|node\.?js|aws|gcp|kubernetes|sql|postgres|redis|graphql|docker|java|go|rust)\b/gi;
  for (const match of text.matchAll(skillPattern)) {
    phrases.push(match[0].toLowerCase());
  }
  return [...new Set([...tokens, ...phrases])];
}

export function analyzeAtsMatch({ jobDescription, resumeText, profileSkills = [] }) {
  const jdKeywords = extractKeywords(jobDescription);
  const resumeKeywords = new Set([
    ...extractKeywords(resumeText),
    ...profileSkills.map((skill) => String(skill).toLowerCase()),
  ]);

  const matched = [];
  const missing = [];
  for (const keyword of jdKeywords) {
    if (resumeKeywords.has(keyword)) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const coverage = jdKeywords.length ? matched.length / jdKeywords.length : 0;
  const priorityMissing = missing
    .filter((word) => word.length > 4)
    .slice(0, 15);

  return {
    coverage: Number(coverage.toFixed(2)),
    matchedCount: matched.length,
    totalKeywords: jdKeywords.length,
    matched: matched.slice(0, 25),
    missing: priorityMissing,
    recommendation:
      coverage >= 0.7
        ? 'Strong keyword alignment. Proceed with truthful narrative answers.'
        : coverage >= 0.5
          ? 'Moderate alignment. Address top missing terms only when supported by verified experience.'
          : 'Weak alignment. Reassess fit before applying; do not invent skills.',
  };
}
