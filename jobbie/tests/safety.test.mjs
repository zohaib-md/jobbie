import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifySafetyPause,
  proposeAnswer,
  canSubmit,
} from '../scripts/lib/safety.mjs';

test('pauses for MFA and never returns a code', () => {
  const result = classifySafetyPause({
    text: 'Enter the 2FA authenticator code from your MFA app',
  });
  assert.equal(result.pause, true);
  assert.equal(result.kind, 'mfa');
  assert.equal(result.action, 'hand-control-to-user');
  assert.equal(result.solution, undefined);
  assert.doesNotMatch(JSON.stringify(result), /\b\d{6}\b/);
});

test('pauses for CAPTCHA and never solves it', () => {
  const result = classifySafetyPause({
    text: 'Please complete the reCAPTCHA to prove you are human',
  });
  assert.equal(result.pause, true);
  assert.equal(result.kind, 'captcha');
  assert.equal(result.action, 'hand-control-to-user');
  assert.equal(result.bypass, undefined);
  assert.equal(result.solved, undefined);
});

test('pauses for legal attestations', () => {
  const result = classifySafetyPause({
    text: 'I certify that all information is true and complete under penalty of perjury',
  });
  assert.equal(result.pause, true);
  assert.equal(result.kind, 'legal-attestation');
  assert.equal(result.action, 'hand-control-to-user');
});

test('unverified answers return needs-user-input instead of a guess', () => {
  const result = proposeAnswer({
    question: 'What is your current salary?',
    facts: [
      {
        id: 'f1',
        type: 'skill',
        value: 'TypeScript',
        source: { section: 'Skills', excerpt: 'TypeScript, React' },
      },
    ],
    resumeText: 'Jordan Blake\nSkills: TypeScript, React',
  });
  assert.equal(result.status, 'needs-user-input');
  assert.equal(result.answer, undefined);
  assert.equal(result.pause, true);
  assert.equal(result.kind, 'unverified-answer');
});

test('verified skill questions cite the résumé source', () => {
  const result = proposeAnswer({
    question: 'Do you have TypeScript experience?',
    facts: [
      {
        id: 'f1',
        type: 'skill',
        value: 'TypeScript',
        source: { section: 'Skills', excerpt: 'TypeScript, React' },
      },
    ],
    resumeText: 'Skills: TypeScript, React',
  });
  assert.equal(result.status, 'verified');
  assert.match(String(result.answer), /TypeScript/i);
  assert.equal(result.source.section, 'Skills');
});

test('submission always requires explicit per-submission confirmation', () => {
  const blocked = canSubmit({
    userConfirmation: false,
    autoEligible: true,
    submissionMode: 'routine-auto',
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, 'explicit-confirmation-required');

  const prepared = canSubmit({
    userConfirmation: true,
    platformAllowsAutomation: false,
    submissionMode: 'review-each',
  });
  assert.equal(prepared.allowed, true);
  assert.equal(prepared.mode, 'prepare-and-review');
});
