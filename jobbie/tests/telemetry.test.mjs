import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  TELEMETRY_FIELDS,
  getTelemetryStatus,
  recordTelemetryEvent,
  setTelemetryEnabled,
} from '../scripts/lib/telemetry.mjs';

async function withTempHome(fn) {
  const previous = process.env.JOBBIE_HOME;
  const tempHome = await mkdtemp(join(tmpdir(), 'jobbie-tel-'));
  process.env.JOBBIE_HOME = tempHome;
  try {
    await fn(tempHome);
  } finally {
    if (previous === undefined) {
      delete process.env.JOBBIE_HOME;
    } else {
      process.env.JOBBIE_HOME = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
  }
}

test('telemetry is off by default', async () => {
  await withTempHome(async () => {
    const status = await getTelemetryStatus();
    assert.equal(status.enabled, false);
    assert.deepEqual(status.fields, TELEMETRY_FIELDS);
  });
});

test('disabled telemetry never records events or resume data', async () => {
  await withTempHome(async () => {
    const result = await recordTelemetryEvent({
      event: 'submitted',
      stage: 'apply',
      resumeText: 'Jordan Blake, 555-0100, jordan@example.test',
      email: 'jordan@example.test',
    });
    assert.equal(result.recorded, false);
    assert.equal(result.reason, 'telemetry-disabled');
    assert.equal(result.preview, undefined);
  });
});

test('enabled telemetry only previews the documented fields', async () => {
  await withTempHome(async () => {
    await setTelemetryEnabled(true);
    const result = await recordTelemetryEvent({
      event: 'submitted',
      stage: 'apply',
      atsPlatform: 'greenhouse',
      seniority: 'senior',
      fitScore: 82,
      outcome: 'submitted',
      email: 'jordan@example.test',
      resumeText: 'secret',
    });
    assert.equal(result.recorded, false);
    assert.equal(result.reason, 'no-relay-configured');
    assert.deepEqual(result.preview, {
      event: 'submitted',
      stage: 'apply',
      atsPlatform: 'greenhouse',
      seniority: 'senior',
      fitScore: 82,
      outcome: 'submitted',
    });
    assert.equal(result.preview.email, undefined);
    assert.equal(result.preview.resumeText, undefined);
  });
});
