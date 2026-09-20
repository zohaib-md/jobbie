import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addApplication, addOutcome, reviewLedger } from '../scripts/lib/ledger.mjs';

async function withTempHome(fn) {
  const previous = process.env.APPLYKIT_HOME;
  const tempHome = await mkdtemp(join(tmpdir(), 'applykit-ledger-'));
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

test('does not record submitted applications without visible confirmation', async () => {
  await withTempHome(async () => {
    const result = await addApplication({
      company: 'Example Cloud Co',
      role: 'Senior Engineer',
      url: 'https://jobs.example-cloud.test/senior-engineer',
      jobId: 'EC-100',
      status: 'submitted',
    });
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'missing-visible-confirmation');
  });
});

test('records prepared packets separately from submitted applications', async () => {
  await withTempHome(async (home) => {
    const prepared = await addApplication({
      company: 'Example Cloud Co',
      role: 'Senior Engineer',
      url: 'https://jobs.example-cloud.test/senior-engineer',
      jobId: 'EC-100',
    });
    assert.equal(prepared.ok, true);
    assert.equal(prepared.application.status, 'prepared');

    const submitted = await addApplication({
      company: 'Harbor Analytics',
      role: 'Staff Engineer',
      url: 'https://jobs.harbor-analytics.test/staff-engineer',
      jobId: 'HA-101',
      status: 'submitted',
      visibleConfirmation: true,
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.application.status, 'submitted');

    const review = await reviewLedger();
    assert.equal(review.uniqueSubmissions, 1);
    assert.equal(review.preparedCount, 1);

    const outcome = await addOutcome({
      applicationId: submitted.application.id,
      outcome: 'interview',
    });
    assert.equal(outcome.ok, true);
    const second = await addOutcome({
      applicationId: submitted.application.id,
      outcome: 'interview',
    });
    assert.equal(second.idempotent, true);

    const raw = await readFile(join(home, 'applications.ndjson'), 'utf8');
    assert.doesNotMatch(raw, /jordan\.blake@example\.test/);
  });
});
