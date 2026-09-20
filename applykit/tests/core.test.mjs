import test from 'node:test';
import assert from 'node:assert/strict';
import { scorePosting } from '../scripts/lib/scoring.mjs';
import { analyzeAtsMatch } from '../scripts/lib/ats.mjs';
import { draftCoverLetter } from '../scripts/lib/cover-letter.mjs';
import { generateInterviewPrep } from '../scripts/lib/interview-prep.mjs';
import { validateProfile, migrateProfile } from '../scripts/lib/profile.mjs';

const profile = {
  fullName: 'Alex Candidate',
  email: 'alex@example.com',
  targetRoles: ['Software Engineer'],
  targetSeniority: 'senior',
  workAuthorization: 'authorized',
  submissionMode: 'review-each',
  skills: ['typescript', 'react', 'aws'],
  workModes: ['remote'],
  excludedCompanies: ['Blocked Inc'],
};

test('score excludes closed postings', () => {
  const result = scorePosting({ postingStatus: 'closed' }, profile);
  assert.equal(result.gate, 'exclude');
});

test('score excludes blocked companies', () => {
  const result = scorePosting(
    {
      company: 'Blocked Inc',
      postingStatus: 'active',
      eligibility: 'eligible',
      seniority: 'senior',
      mustHaveRequirements: [{ name: 'TypeScript', status: 'met' }],
    },
    profile,
  );
  assert.equal(result.gate, 'exclude');
});

test('score marks strong fit as auto eligible', () => {
  const result = scorePosting(
    {
      company: 'Good Co',
      postingStatus: 'active',
      eligibility: 'eligible',
      seniority: 'senior',
      workMode: 'remote',
      mustHaveRequirements: [
        { name: 'TypeScript', status: 'met' },
        { name: 'React', status: 'met' },
        { name: 'AWS', status: 'partial' },
      ],
    },
    profile,
  );
  assert.equal(result.gate, 'review');
  assert.ok(result.score >= 80);
  assert.equal(result.autoEligible, true);
});

test('ats analysis finds matched and missing keywords', () => {
  const result = analyzeAtsMatch({
    jobDescription: 'Need TypeScript, React, GraphQL, and Kubernetes experience.',
    resumeText: 'Built products with TypeScript and React on AWS.',
    profileSkills: ['aws'],
  });
  assert.ok(result.matched.includes('typescript'));
  assert.ok(result.missing.includes('kubernetes') || result.missing.includes('graphql'));
});

test('cover letter uses verified highlights only', () => {
  const letter = draftCoverLetter({
    profile,
    company: 'Good Co',
    role: 'Senior Engineer',
    highlights: ['Led API migration to TypeScript'],
  });
  assert.match(letter.body, /Led API migration to TypeScript/);
  assert.match(letter.body, /Good Co/);
});

test('interview prep returns behavioral and technical prompts', () => {
  const prep = generateInterviewPrep({
    profile,
    company: 'Good Co',
    role: 'Senior Engineer',
    jobDescription: 'Lead cross-functional teams and design distributed systems with TypeScript.',
    resumeText: 'Senior engineer with TypeScript and AWS experience.',
  });
  assert.ok(prep.behavioralQuestions.length > 0);
  assert.ok(prep.technicalQuestions.length > 0);
});

test('profile migration maps legacy salary preference', () => {
  const migrated = migrateProfile({
    salaryPreference: { amount: 180000, currency: 'USD', basis: 'annual' },
  });
  assert.deepEqual(migrated.targetCompensation, {
    amount: 180000,
    currency: 'USD',
    basis: 'annual',
  });
});

test('profile validation reports missing required fields', () => {
  const result = validateProfile({ fullName: 'Alex' });
  assert.equal(result.valid, false);
  assert.ok(result.missing.includes('email'));
});
