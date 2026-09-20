import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { getTelemetryConfigPath, getStateRoot } from './paths.mjs';

const DEFAULT_CONFIG = { enabled: false };

export const TELEMETRY_FIELDS = [
  'event',
  'stage',
  'atsPlatform',
  'seniority',
  'fitScore',
  'outcome',
];

async function readConfig() {
  if (!existsSync(getTelemetryConfigPath())) {
    return { ...DEFAULT_CONFIG };
  }
  return JSON.parse(await readFile(getTelemetryConfigPath(), 'utf8'));
}

async function writeConfig(config) {
  await mkdir(getStateRoot(), { recursive: true, mode: 0o700 });
  await writeFile(getTelemetryConfigPath(), `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
}

export async function getTelemetryStatus() {
  const config = await readConfig();
  return {
    enabled: config.enabled === true,
    fields: TELEMETRY_FIELDS,
    note: 'Applykit ships with telemetry disabled by default. No personal data is collected.',
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
  const preview = {};
  for (const key of TELEMETRY_FIELDS) {
    if (event[key] !== undefined) {
      preview[key] = event[key];
    }
  }
  return preview;
}
