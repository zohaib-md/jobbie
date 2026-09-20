import { mkdir, writeFile } from 'node:fs/promises';
import { extractFactsFromResume } from './facts.mjs';
import { getFactsPath, getStateRoot } from './paths.mjs';
import { importResume, readResumeText } from './resume.mjs';
import { migrateProfile, validateProfile } from './profile.mjs';

export async function onboardResume(resumePath, extras = {}) {
  const imported = await importResume(resumePath);
  if (imported.ok === false) {
    return imported;
  }

  const resumeText = await readResumeText();
  if (imported.format && imported.format !== 'text' && resumeText.startsWith('[binary resume')) {
    return {
      ok: false,
      needsUserInput: true,
      message:
        'Binary résumé stored locally. Extract text into a .txt or .md file before onboarding facts.',
      imported,
    };
  }

  const extracted = extractFactsFromResume(resumeText, resumePath);
  await mkdir(getStateRoot(), { recursive: true, mode: 0o700 });
  await writeFile(
    getFactsPath(),
    `${JSON.stringify({ facts: extracted.facts, source: resumePath }, null, 2)}\n`,
    { mode: 0o600 },
  );

  const factValue = (type) => extracted.facts.find((fact) => fact.type === type)?.value;
  const skills = extracted.facts.filter((fact) => fact.type === 'skill').map((fact) => fact.value);
  const profileDraft = migrateProfile({
    fullName: factValue('fullName'),
    email: factValue('email'),
    location: factValue('location'),
    skills,
    targetRoles: extras.targetRoles ?? [],
    targetSeniority: extras.targetSeniority,
    workAuthorization: extras.workAuthorization,
    submissionMode: extras.submissionMode ?? 'review-each',
  });
  const validation = validateProfile(profileDraft);

  return {
    ok: true,
    imported,
    factCount: extracted.facts.length,
    facts: extracted.facts,
    profileDraft,
    validation,
    missing: validation.missing,
    note: validation.valid
      ? 'Profile draft is complete. Review facts, then run profile set.'
      : 'Ask the candidate for missing profile fields. Never guess work authorization or other absent facts.',
  };
}
