import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import {
  APPLICATIONS_LEDGER,
  OUTCOMES_LEDGER,
  REVIEW_STATE,
  STATE_ROOT,
} from './paths.mjs';

async function ensureState() {
  await mkdir(STATE_ROOT, { recursive: true, mode: 0o700 });
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
  const rows = await readNdjson(APPLICATIONS_LEDGER);
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
  const row = {
    id: randomUUID(),
    fingerprint: duplicate.fingerprint ?? fingerprint(entry),
    recordedAt: new Date().toISOString(),
    status: entry.status ?? 'submitted',
    ...entry,
  };
  await appendNdjson(APPLICATIONS_LEDGER, row);
  return { ok: true, application: row };
}

export async function addOutcome(entry) {
  const rows = await readNdjson(OUTCOMES_LEDGER);
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
  await appendNdjson(OUTCOMES_LEDGER, row);
  return { ok: true, outcome: row, idempotent: false };
}

export async function reviewLedger() {
  const applications = await readNdjson(APPLICATIONS_LEDGER);
  const outcomes = await readNdjson(OUTCOMES_LEDGER);
  const unique = new Map();
  const duplicates = [];

  for (const row of applications) {
    if (unique.has(row.fingerprint)) {
      duplicates.push(row);
    } else {
      unique.set(row.fingerprint, row);
    }
  }

  const submitted = [...unique.values()].filter((row) => row.status === 'submitted');
  const outcomeCounts = {};
  for (const outcome of outcomes) {
    outcomeCounts[outcome.outcome] = (outcomeCounts[outcome.outcome] ?? 0) + 1;
  }

  const reviewState = existsSync(REVIEW_STATE)
    ? JSON.parse(await readFile(REVIEW_STATE, 'utf8'))
    : { acknowledgedSubmissions: 0 };

  const pendingSubmissionReview =
    submitted.length - (reviewState.acknowledgedSubmissions ?? 0) >= 10;

  return {
    uniqueSubmissions: submitted.length,
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
    writeFile(REVIEW_STATE, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 }),
  );
  return { ok: true, ...next };
}
