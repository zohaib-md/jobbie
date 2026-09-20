#!/usr/bin/env node
import { readProfile, writeProfile, getProfileStorageInfo } from './secret-store.mjs';
import {
  getProfileField,
  migrateProfile,
  validateProfile,
} from './lib/profile.mjs';
import { scorePosting } from './lib/scoring.mjs';
import {
  addApplication,
  addOutcome,
  acknowledgeReview,
  checkDuplicate,
  reviewLedger,
} from './lib/ledger.mjs';
import { analyzeAtsMatch } from './lib/ats.mjs';
import { draftCoverLetter } from './lib/cover-letter.mjs';
import { generateInterviewPrep } from './lib/interview-prep.mjs';
import { importResume, readResumeText } from './lib/resume.mjs';
import {
  getTelemetryStatus,
  recordTelemetryEvent,
  setTelemetryEnabled,
} from './lib/telemetry.mjs';
import { classifySafetyPause, proposeAnswer, canSubmit } from './lib/safety.mjs';
import { extractFactsFromResume } from './lib/facts.mjs';
import { onboardResume } from './lib/onboard.mjs';
import { searchJobs } from './lib/discover.mjs';
import { getFactsPath } from './lib/paths.mjs';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { readStdinJson, writeJson, fail } from './lib/stdio.mjs';

async function main(argv = process.argv.slice(2)) {
  const [domain, action, ...rest] = argv;

  if (!domain || domain === 'help' || domain === '--help') {
    printHelp();
    return;
  }

  switch (domain) {
    case 'profile':
      return handleProfile(action, rest);
    case 'resume':
      return handleResume(action, rest);
    case 'score':
      return handleScore();
    case 'ledger':
      return handleLedger(action);
    case 'ats':
      return handleAts(action);
    case 'cover-letter':
      return handleCoverLetter(action);
    case 'prep':
      return handlePrep(action);
    case 'telemetry':
      return handleTelemetry(action);
    case 'onboard':
      return handleOnboard(action, rest);
    case 'discover':
      return handleDiscover(action);
    case 'safety':
      return handleSafety(action);
    case 'facts':
      return handleFacts(action);
    default:
      fail(`Unknown command domain: ${domain}`);
  }
}

function printHelp() {
  process.stdout.write(`jobbie local commands

profile set --stdin
profile migrate --stdin
profile check
profile field <field>

resume import <local-path>

score --stdin
ledger check|add|outcome|review|review-ack --stdin
ats analyze --stdin
cover-letter draft --stdin
prep generate --stdin
onboard --resume <local-path>
discover search --stdin
safety classify|answer|can-submit --stdin
telemetry status|enable|disable|record --stdin
`);
}

async function handleProfile(action, rest) {
  if (action === 'set' && rest[0] === '--stdin') {
    const profile = migrateProfile(await readStdinJson());
    const validation = validateProfile(profile);
    if (!validation.valid) {
      writeJson({ ok: false, validation });
      return;
    }
    const storage = await writeProfile(profile);
    writeJson({ ok: true, storage });
    return;
  }

  if (action === 'migrate' && rest[0] === '--stdin') {
    const profile = migrateProfile(await readStdinJson());
    const storage = await writeProfile(profile);
    writeJson({ ok: true, storage, profile });
    return;
  }

  if (action === 'check') {
    const profile = await readProfile();
    if (!profile) {
      writeJson({ ok: false, message: 'Profile not found', storage: getProfileStorageInfo() });
      return;
    }
    writeJson({
      ok: true,
      validation: validateProfile(profile),
      storage: getProfileStorageInfo(),
      submissionMode: profile.submissionMode,
    });
    return;
  }

  if (action === 'field' && rest[0]) {
    const profile = await readProfile();
    if (!profile) {
      fail('Profile not found');
    }
    writeJson({ field: rest[0], value: getProfileField(profile, rest[0]) });
    return;
  }

  fail('Usage: jobbie profile <set|migrate|check|field>');
}

async function readStoredFacts() {
  if (!existsSync(getFactsPath())) {
    return [];
  }
  const parsed = JSON.parse(await readFile(getFactsPath(), 'utf8'));
  return parsed.facts ?? [];
}

async function handleOnboard(action, rest) {
  const resumePath = action === '--resume' ? rest[0] : action;
  if (!resumePath || resumePath === '--stdin') {
    fail('Usage: jobbie onboard --resume <path>');
  }
  const extras = rest.includes('--stdin') || action === '--stdin' ? await readStdinJson() : {};
  writeJson(await onboardResume(resumePath, extras));
}

async function handleDiscover(action) {
  if (action !== 'search') {
    fail('Usage: jobbie discover search --stdin');
  }
  const input = await readStdinJson();
  const profile = await readProfile();
  writeJson(
    searchJobs({
      query: input.query ?? '',
      listings: input.listings ?? [],
      profile,
    }),
  );
}

async function handleSafety(action) {
  const input = action === 'status' ? {} : await readStdinJson();
  if (action === 'classify') {
    writeJson(classifySafetyPause(input));
    return;
  }
  if (action === 'answer') {
    const facts = input.facts ?? (await readStoredFacts());
    const resumeText = input.resumeText ?? (await readResumeText());
    writeJson(proposeAnswer({ ...input, facts, resumeText }));
    return;
  }
  if (action === 'can-submit') {
    writeJson(canSubmit(input));
    return;
  }
  fail('Usage: jobbie safety <classify|answer|can-submit> --stdin');
}

async function handleFacts(action) {
  if (action === 'extract') {
    const input = await readStdinJson();
    const resumeText = input.resumeText ?? (await readResumeText());
    writeJson(extractFactsFromResume(resumeText, input.sourcePath ?? 'resume.txt'));
    return;
  }
  fail('Usage: jobbie facts extract --stdin');
}

async function handleResume(action, rest) {
  if (action === 'import' && rest[0]) {
    writeJson(await importResume(rest[0]));
    return;
  }
  fail('Usage: jobbie resume import <path>');
}

async function handleScore() {
  const input = await readStdinJson();
  const profile = await readProfile();
  if (!profile) {
    fail('Profile not found');
  }
  writeJson(scorePosting(input, profile));
}

async function handleLedger(action) {
  if (action === 'check') {
    writeJson(await checkDuplicate(await readStdinJson()));
    return;
  }
  if (action === 'add') {
    writeJson(await addApplication(await readStdinJson()));
    return;
  }
  if (action === 'outcome') {
    writeJson(await addOutcome(await readStdinJson()));
    return;
  }
  if (action === 'review') {
    writeJson(await reviewLedger());
    return;
  }
  if (action === 'review-ack') {
    writeJson(await acknowledgeReview(await readStdinJson()));
    return;
  }
  fail('Usage: jobbie ledger <check|add|outcome|review|review-ack>');
}

async function handleAts(action) {
  if (action === 'analyze') {
    const input = await readStdinJson();
    const profile = await readProfile();
    const resumeText = input.resumeText ?? (await readResumeText());
    writeJson(
      analyzeAtsMatch({
        jobDescription: input.jobDescription,
        resumeText,
        profileSkills: profile?.skills ?? [],
      }),
    );
    return;
  }
  fail('Usage: jobbie ats analyze --stdin');
}

async function handleCoverLetter(action) {
  if (action === 'draft') {
    const input = await readStdinJson();
    const profile = await readProfile();
    if (!profile) {
      fail('Profile not found');
    }
    const facts = input.facts ?? (await readStoredFacts());
    const resumeText = input.resumeText ?? (await readResumeText());
    writeJson(
      draftCoverLetter({
        profile,
        company: input.company,
        role: input.role,
        highlights: input.highlights ?? [],
        resumeText,
        facts,
      }),
    );
    return;
  }
  fail('Usage: jobbie cover-letter draft --stdin');
}

async function handlePrep(action) {
  if (action === 'generate') {
    const input = await readStdinJson();
    const profile = await readProfile();
    if (!profile) {
      fail('Profile not found');
    }
    const resumeText = input.resumeText ?? (await readResumeText());
    writeJson(
      generateInterviewPrep({
        jobDescription: input.jobDescription,
        resumeText,
        profile,
        company: input.company,
        role: input.role,
      }),
    );
    return;
  }
  fail('Usage: jobbie prep generate --stdin');
}

async function handleTelemetry(action) {
  if (action === 'status') {
    writeJson(await getTelemetryStatus());
    return;
  }
  if (action === 'enable') {
    writeJson(await setTelemetryEnabled(true));
    return;
  }
  if (action === 'disable') {
    writeJson(await setTelemetryEnabled(false));
    return;
  }
  if (action === 'record') {
    writeJson(await recordTelemetryEvent(await readStdinJson()));
    return;
  }
  fail('Usage: jobbie telemetry <status|enable|disable|record>');
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(error.exitCode ?? 1);
});
