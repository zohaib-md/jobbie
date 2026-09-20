import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { onboardResume } from '../scripts/lib/onboard.mjs';
import { searchJobs } from '../scripts/lib/discover.mjs';
import { readFile } from 'node:fs/promises';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function withTempHome(fn) {
  const previous = process.env.APPLYKIT_HOME;
  const tempHome = await mkdtemp(join(tmpdir(), 'applykit-onboard-'));
  process.env.APPLYKIT_HOME = tempHome;
  try {
    await fn(tempHome);
  } finally {
    if (previous === undefined) {
      delete process.env.APPLYKIT_HOME;
    } else {
      process.env.APPLYKIT_HOME = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
  }
}

test('onboard extracts facts and does not invent work authorization', async () => {
  await withTempHome(async () => {
    const result = await onboardResume(join(root, 'fixtures/resumes/plain.txt'));
    assert.equal(result.ok, true);
    assert.ok(result.facts.some((fact) => fact.type === 'skill' && /typescript/i.test(fact.value)));
    assert.ok(result.missing.includes('workAuthorization'));
    assert.equal(result.profileDraft.workAuthorization, undefined);
  });
});

test('discover ranks supplied listings and never marks auto-submit', async () => {
  const listings = JSON.parse(
    await readFile(join(root, 'fixtures/jobs/senior-engineer.json'), 'utf8'),
  );
  const profile = {
    fullName: 'Jordan Blake',
    email: 'jordan.blake@example.test',
    targetRoles: ['Software Engineer'],
    targetSeniority: 'senior',
    workAuthorization: 'authorized',
    submissionMode: 'review-each',
    workModes: ['remote'],
    excludedCompanies: ['Blocked Inc'],
    skills: ['TypeScript', 'AWS', 'PostgreSQL'],
  };
  const result = searchJobs({
    query: 'senior engineer',
    listings,
    profile,
  });
  assert.ok(result.results.length >= 1);
  assert.equal(result.results.every((job) => job.autoEligible === true ? job.gate === 'review' : true), true);
  assert.ok(result.guidance.some((line) => /do not auto-submit/i.test(line)));
  const blocked = result.results.find((job) => job.company === 'Blocked Inc');
  assert.equal(blocked.gate, 'exclude');
});
