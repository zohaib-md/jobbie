import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractFactsFromResume, highlightIsVerified } from '../scripts/lib/facts.mjs';
import { analyzeAtsMatch } from '../scripts/lib/ats.mjs';
import { draftCoverLetter } from '../scripts/lib/cover-letter.mjs';
import { generateInterviewPrep } from '../scripts/lib/interview-prep.mjs';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'resumes');

const JOB =
  'Senior Engineer role requiring TypeScript, AWS, PostgreSQL, and GraphQL. Lead APIs and mentor engineers.';

async function loadResume(name) {
  return readFile(join(fixtures, name), 'utf8');
}

function fakeProfile(facts) {
  return {
    fullName: facts.find((fact) => fact.type === 'fullName')?.value ?? 'Jordan Blake',
    email: facts.find((fact) => fact.type === 'email')?.value ?? 'jordan.blake@example.test',
    targetRoles: ['Software Engineer'],
    targetSeniority: 'senior',
    workAuthorization: 'authorized',
    submissionMode: 'review-each',
    skills: facts.filter((fact) => fact.type === 'skill').map((fact) => fact.value),
  };
}

for (const file of ['plain.txt', 'markdown-table.md', 'multicolumn.txt']) {
  test(`parses verified facts from ${file}`, async () => {
    const resumeText = await loadResume(file);
    const { facts } = extractFactsFromResume(resumeText, file);
    const skills = facts.filter((fact) => fact.type === 'skill').map((fact) => fact.value.toLowerCase());
    assert.ok(facts.find((fact) => fact.type === 'fullName')?.value.includes('Jordan Blake'));
    assert.equal(facts.find((fact) => fact.type === 'email')?.value, 'jordan.blake@example.test');
    assert.ok(skills.some((skill) => skill.includes('typescript')));
    assert.ok(facts.every((fact) => fact.source?.section));
  });

  test(`ATS, cover letter, and prep work on ${file}`, async () => {
    const resumeText = await loadResume(file);
    const { facts } = extractFactsFromResume(resumeText, file);
    const profile = fakeProfile(facts);
    const ats = analyzeAtsMatch({
      jobDescription: JOB,
      resumeText,
      profileSkills: profile.skills,
    });
    assert.ok(ats.matched.some((word) => word.includes('typescript')));
    assert.ok(ats.coverage > 0);

    const highlights = facts
      .filter((fact) => fact.type === 'highlight')
      .map((fact) => fact.value)
      .slice(0, 2);
    const letter = draftCoverLetter({
      profile,
      company: 'Example Cloud Co',
      role: 'Senior Engineer',
      highlights: [...highlights, 'Invented a quantum compiler'],
      resumeText,
      facts,
    });
    assert.equal(letter.rejectedHighlights.includes('Invented a quantum compiler'), true);
    assert.doesNotMatch(letter.body, /quantum compiler/i);
    if (highlights[0]) {
      assert.match(letter.body, new RegExp(highlights[0].slice(0, 20), 'i'));
    }

    const prep = generateInterviewPrep({
      profile,
      company: 'Example Cloud Co',
      role: 'Senior Engineer',
      jobDescription: JOB,
      resumeText,
    });
    assert.ok(prep.behavioralQuestions.length > 0);
    assert.ok(prep.technicalQuestions.length > 0);
    assert.ok(prep.talkingPoints.length > 0);
  });
}

test('does not treat fabricated highlights as verified', () => {
  assert.equal(
    highlightIsVerified('Invented a quantum compiler', 'Skills: TypeScript'),
    false,
  );
});
