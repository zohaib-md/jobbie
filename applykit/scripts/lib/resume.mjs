import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import { getResumePath, getStateRoot } from './paths.mjs';

async function ensureState() {
  await mkdir(getStateRoot(), { recursive: true, mode: 0o700 });
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
    await writeFile(getResumePath(), text, { mode: 0o600 });
    return { ok: true, path: getResumePath(), format: 'text' };
  }
  await copyFile(source, `${getStateRoot()}/resume.${ext}`);
  await writeFile(
    getResumePath(),
    `[binary resume stored at ${getStateRoot()}/resume.${ext}; extract text in agent context before scoring]`,
    { mode: 0o600 },
  );
  return {
    ok: true,
    path: getResumePath(),
    format: ext,
    note: 'Binary résumé copied locally. Extract text before ATS or prep commands.',
  };
}

export async function readResumeText() {
  if (!existsSync(getResumePath())) {
    return '';
  }
  return readFile(getResumePath(), 'utf8');
}
