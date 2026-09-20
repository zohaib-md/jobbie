import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { TELEMETRY_CONFIG, STATE_ROOT } from './paths.mjs';

const DEFAULT_CONFIG = { enabled: false };

async function readConfig() {
  if (!existsSync(TELEMETRY_CONFIG)) {
    return { ...DEFAULT_CONFIG };
  }
  return JSON.parse(await readFile(TELEMETRY_CONFIG, 'utf8'));
}

async function writeConfig(config) {
  await mkdir(STATE_ROOT, { recursive: true, mode: 0o700 });
  await writeFile(TELEMETRY_CONFIG, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
}

export async function getTelemetryStatus() {
  const config = await readConfig();
  return {
    enabled: config.enabled === true,
    note: 'Applykit ships with telemetry disabled by default.',
  };
}

export async function setTelemetryEnabled(enabled) {
  await writeConfig({ enabled });
  return { enabled };
}

export async function recordTelemetryEvent(event) {
  const config = await readConfig();
  if (!config.enabled) {
    return { recorded: false, reason: 'telemetry-disabled' };
  }
  return {
    recorded: false,
    reason: 'no-relay-configured',
    preview: sanitizeEvent(event),
  };
}

function sanitizeEvent(event) {
  const allowed = [
    'event',
    'stage',
    'atsPlatform',
    'seniority',
    'fitScore',
    'outcome',
  ];
  const preview = {};
  for (const key of allowed) {
    if (event[key] !== undefined) {
      preview[key] = event[key];
    }
  }
  return preview;
}
