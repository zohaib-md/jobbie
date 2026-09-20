import { homedir } from 'node:os';
import { join } from 'node:path';

export const STATE_ROOT = join(homedir(), '.applykit');
export const PROFILE_KEY = 'applykit.profile';
export const RESUME_PATH = join(STATE_ROOT, 'resume.txt');
export const APPLICATIONS_LEDGER = join(STATE_ROOT, 'applications.ndjson');
export const OUTCOMES_LEDGER = join(STATE_ROOT, 'outcomes.ndjson');
export const TELEMETRY_CONFIG = join(STATE_ROOT, 'telemetry.json');
export const REVIEW_STATE = join(STATE_ROOT, 'review-state.json');

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
