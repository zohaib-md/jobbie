import { execFile } from 'node:child_process';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { PROFILE_KEY, STATE_ROOT } from './lib/paths.mjs';

const execFileAsync = promisify(execFile);

const FALLBACK_PATH = join(STATE_ROOT, 'profile.enc');

function getFallbackKey() {
  const salt = 'applykit-profile-v1';
  return scryptSync(`${homedir()}:applykit`, salt, 32);
}

function encryptJson(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getFallbackKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptJson(encoded) {
  const buffer = Buffer.from(encoded, 'base64');
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', getFallbackKey(), iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

async function readMacProfile() {
  const { stdout } = await execFileAsync('security', [
    'find-generic-password',
    '-s',
    PROFILE_KEY,
    '-w',
  ]);
  return JSON.parse(stdout.trim());
}

async function writeMacProfile(profile) {
  const payload = JSON.stringify(profile);
  try {
    await execFileAsync('security', [
      'delete-generic-password',
      '-s',
      PROFILE_KEY,
    ]);
  } catch {
    // first write
  }
  await execFileAsync('security', [
    'add-generic-password',
    '-s',
    PROFILE_KEY,
    '-a',
    homedir(),
    '-w',
    payload,
  ]);
}

async function readFallbackProfile() {
  if (!existsSync(FALLBACK_PATH)) {
    return null;
  }
  const encoded = await readFile(FALLBACK_PATH, 'utf8');
  return decryptJson(encoded.trim());
}

async function writeFallbackProfile(profile) {
  await mkdir(STATE_ROOT, { recursive: true, mode: 0o700 });
  await writeFile(FALLBACK_PATH, encryptJson(profile), { mode: 0o600 });
  await chmod(FALLBACK_PATH, 0o600);
}

export async function readProfile() {
  if (platform() === 'darwin') {
    try {
      return await readMacProfile();
    } catch {
      return readFallbackProfile();
    }
  }
  return readFallbackProfile();
}

export async function writeProfile(profile) {
  if (platform() === 'darwin') {
    try {
      await writeMacProfile(profile);
      return { storage: 'macos-keychain' };
    } catch {
      await writeFallbackProfile(profile);
      return { storage: 'encrypted-file' };
    }
  }
  await writeFallbackProfile(profile);
  return { storage: 'encrypted-file' };
}

export function getProfileStorageInfo() {
  if (platform() === 'darwin') {
    return 'macOS Keychain with encrypted-file fallback';
  }
  return 'Owner-only encrypted local file';
}
