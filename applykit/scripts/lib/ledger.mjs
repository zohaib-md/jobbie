import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import {
  getApplicationsLedger,
  getOutcomesLedger,
  getReviewStatePath,
  getStateRoot,
} from './paths.mjs';

async function ensureState() {
  await mkdir(getStateRoot(), { recursive: true, mode: 0o700 });
}

async function readNdjson(path) {
  if (!existsSync(path)) {
    return [];
  }
  const raw = await readFile(path, 'utf8');
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function appendNdjson(path, row) {
  await ensureState();
  await appendFile(path, `${JSON.stringify(row)}\n`, { mode: 0o600 });
}

function normalizeUrl(url = '') {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return url.trim().toLowerCase();
  }
}

function fingerprint(entry) {
  return createHash('sha256')
    .update(
      [
        entry.company ?? '',
        entry.role ?? '',
        entry.jobId ?? '',
        normalizeUrl(entry.url ?? ''),
      ].join('|'),
    )
    .digest('hex')
    .slice(0, 16);
}

export async function checkDuplicate(entry) {
  const rows = await readNdjson(getApplicationsLedger());
  const fp = fingerprint(entry);
  const exact = rows.find((row) => row.fingerprint === fp);
  if (exact) {
    return { duplicate: true, kind: 'exact', existingId: exact.id };
  }
  const sameCompanyRole = rows.find(
    (row) =>
      row.company === entry.company &&
      row.role === entry.role &&
      row.jobId !== entry.jobId,
  );
  if (sameCompanyRole) {
    return {
      duplicate: true,
      kind: 'possible',
      existingId: sameCompanyRole.id,
      message: 'Same company and role without shared job ID',
    };
  }
  return { duplicate: false, fingerprint: fp };
}

export async function addApplication(entry) {
  const duplicate = await checkDuplicate(entry);
  if (duplicate.duplicate && !entry.duplicateOverride) {
    return { ok: false, ...duplicate };
  }
  const requestedStatus = entry.status ?? 'prepared';
  if (requestedStatus === 'submitted' && entry.visibleConfirmation !== true) {
    return {
      ok: false,
      reason: 'missing-visible-confirmation',
      message: 'Record submitted only after a visible success confirmation from the candidate or the site.',
    };
  }
  const {
    duplicateOverride: _duplicateOverride,
    ...rest
  } = entry;
  const row = {
    ...rest,
    id: randomUUID(),
    fingerprint: duplicate.fingerprint ?? fingerprint(entry),
    recordedAt: new Date().toISOString(),
    status: requestedStatus,
    visibleConfirmation: requestedStatus === 'submitted',
  };
  await appendNdjson(getApplicationsLedger(), row);
  return { ok: true, application: row };
}

export async function addOutcome(entry) {
  const rows = await readNdjson(getOutcomesLedger());
  const existing = rows.find(
    (row) =>
      row.applicationId === entry.applicationId &&
      row.outcome === entry.outcome &&
      row.recordedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10),
  );
  if (existing) {
    return { ok: true, outcome: existing, idempotent: true };
  }
  const row = {
    id: randomUUID(),
    recordedAt: new Date().toISOString(),
    ...entry,
  };
  await appendNdjson(getOutcomesLedger(), row);
  return { ok: true, outcome: row, idempotent: false };
}

export async function reviewLedger() {
  const applications = await readNdjson(getApplicationsLedger());
  const outcomes = await readNdjson(getOutcomesLedger());
  const unique = new Map();
  const duplicates = [];

  for (const row of applications) {
    if (unique.has(row.fingerprint)) {
      duplicates.push(row);
    } else {
      unique.set(row.fingerprint, row);
    }
  }

  const uniqueRows = [...unique.values()];
  const submitted = uniqueRows.filter((row) => row.status === 'submitted');
  const prepared = uniqueRows.filter((row) => row.status === 'prepared');
  const outcomeCounts = {};
  for (const outcome of outcomes) {
    outcomeCounts[outcome.outcome] = (outcomeCounts[outcome.outcome] ?? 0) + 1;
  }

  const reviewState = existsSync(getReviewStatePath())
    ? JSON.parse(await readFile(getReviewStatePath(), 'utf8'))
    : { acknowledgedSubmissions: 0 };

  const pendingSubmissionReview =
    submitted.length - (reviewState.acknowledgedSubmissions ?? 0) >= 10;

  return {
    uniqueSubmissions: submitted.length,
    preparedCount: prepared.length,
    duplicateRows: duplicates.length,
    outcomes: outcomeCounts,
    pendingSubmissionReview,
    recommendations: buildRecommendations(submitted, outcomes),
  };
}

function buildRecommendations(applications, outcomes) {
  const proposals = [];
  const rejected = outcomes.filter((row) => row.outcome === 'rejected').length;
  const interviewed = outcomes.filter((row) => row.outcome === 'interview').length;
  if (applications.length >= 10 && interviewed === 0) {
    proposals.push('Consider tightening seniority or must-have evidence before the next batch.');
  }
  if (rejected >= 5) {
    proposals.push('Review ATS keyword coverage and compensation floor with applykit ats analyze.');
  }
  return proposals;
}

export async function acknowledgeReview(input) {
  await ensureState();
  const next = {
    acknowledgedSubmissions: input.acknowledgedSubmissions,
    acknowledgedAt: new Date().toISOString(),
  };
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(getReviewStatePath(), `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 }),
  );
  return { ok: true, ...next };
}
