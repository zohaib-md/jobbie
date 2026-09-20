import { ALLOWED_PROFILE_FIELDS } from './paths.mjs';

const REQUIRED_FIELDS = [
  'fullName',
  'email',
  'targetRoles',
  'targetSeniority',
  'workAuthorization',
  'submissionMode',
];

export function validateProfile(profile) {
  const missing = REQUIRED_FIELDS.filter((field) => !profile[field]);
  const unknown = Object.keys(profile).filter(
    (field) => !ALLOWED_PROFILE_FIELDS.includes(field),
  );
  return {
    valid: missing.length === 0 && unknown.length === 0,
    missing,
    unknown,
  };
}

export function migrateProfile(legacy) {
  const profile = { ...legacy };
  if (legacy.salaryPreference && !profile.targetCompensation) {
    profile.targetCompensation = legacy.salaryPreference;
    delete profile.salaryPreference;
  }
  if (!profile.submissionMode) {
    profile.submissionMode = 'review-each';
  }
  if (!Array.isArray(profile.targetRoles)) {
    profile.targetRoles = profile.targetRoles ? [profile.targetRoles] : [];
  }
  if (!Array.isArray(profile.skills)) {
    profile.skills = profile.skills ? [profile.skills] : [];
  }
  return profile;
}

export function getProfileField(profile, field) {
  if (!ALLOWED_PROFILE_FIELDS.includes(field)) {
    throw new Error(`Unknown profile field: ${field}`);
  }
  return profile[field] ?? null;
}
