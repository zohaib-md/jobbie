import { homedir } from 'node:os';
import { join } from 'node:path';

export const PROFILE_KEY = 'jobbie.profile';

export const ALLOWED_PROFILE_FIELDS = [
  'fullName',
  'email',
  'phone',
  'location',
  'linkedinUrl',
  'portfolioUrl',
  'workAuthorization',
  'requiresSponsorship',
  'targetRoles',
  'targetSeniority',
  'targetLocations',
  'workModes',
  'excludedCompanies',
  'targetCompensation',
  'compensationFloor',
  'submissionMode',
  'skills',
  'yearsExperience',
];

export function getStateRoot() {
  return process.env.JOBBIE_HOME || join(homedir(), '.jobbie');
}

export function getResumePath() {
  return join(getStateRoot(), 'resume.txt');
}

export function getFactsPath() {
  return join(getStateRoot(), 'facts.json');
}

export function getApplicationsLedger() {
  return join(getStateRoot(), 'applications.ndjson');
}

export function getOutcomesLedger() {
  return join(getStateRoot(), 'outcomes.ndjson');
}

export function getTelemetryConfigPath() {
  return join(getStateRoot(), 'telemetry.json');
}

export function getReviewStatePath() {
  return join(getStateRoot(), 'review-state.json');
}

/** @deprecated Use getStateRoot() so JOBBIE_HOME is honored. */
export const STATE_ROOT = getStateRoot();
export const RESUME_PATH = getResumePath();
export const APPLICATIONS_LEDGER = getApplicationsLedger();
export const OUTCOMES_LEDGER = getOutcomesLedger();
export const TELEMETRY_CONFIG = getTelemetryConfigPath();
export const REVIEW_STATE = getReviewStatePath();
