import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import { RESUME_PATH, STATE_ROOT } from './paths.mjs';

async function ensureState() {
  await mkdir(STATE_ROOT, { recursive: true, mode: 0o700 });
}

export async function importResume(source) {
  await ensureState();
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return {
      ok: false,
      message:
        'Remote résumé URLs must be fetched by the agent and saved locally before import.',
      source,
    };
  }
  if (!existsSync(source)) {
    throw new Error(`Resume file not found: ${source}`);
  }
  const ext = basename(source).split('.').pop()?.toLowerCase();
  if (ext === 'txt' || ext === 'md') {
    const text = await readFile(source, 'utf8');
    await writeFile(RESUME_PATH, text, { mode: 0o600 });
    return { ok: true, path: RESUME_PATH, format: 'text' };
  }
  await copyFile(source, `${STATE_ROOT}/resume.${ext}`);
  await writeFile(
    RESUME_PATH,
    `[binary resume stored at ${STATE_ROOT}/resume.${ext}; extract text in agent context before scoring]`,
    { mode: 0o600 },
  );
  return {
    ok: true,
    path: RESUME_PATH,
    format: ext,
    note: 'Binary résumé copied locally. Extract text before ATS or prep commands.',
  };
}

export async function readResumeText() {
  if (!existsSync(RESUME_PATH)) {
    return '';
  }
  return readFile(RESUME_PATH, 'utf8');
}
