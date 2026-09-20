import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getResumePath, getStateRoot } from './paths.mjs';

const execFileAsync = promisify(execFile);

async function ensureState() {
  await mkdir(getStateRoot(), { recursive: true, mode: 0o700 });
}

function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function extractDocxXmlText(xml) {
  return decodeXmlEntities(
    String(xml)
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:br[^/]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n'),
  ).trim();
}

export function extractPdfLiteralText(buffer) {
  const raw = Buffer.isBuffer(buffer) ? buffer.toString('latin1') : String(buffer);
  const matches = [...raw.matchAll(/\((?:\\.|[^\\)])*\)/g)];
  const parts = [];
  for (const match of matches) {
    const inner = match[0]
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
    if (inner.trim() && !inner.startsWith('/')) {
      parts.push(inner.trim());
    }
  }
  return parts.join('\n').trim();
}

async function extractDocx(source) {
  try {
    const { stdout } = await execFileAsync('unzip', ['-p', source, 'word/document.xml'], {
      maxBuffer: 8 * 1024 * 1024,
    });
    return extractDocxXmlText(stdout);
  } catch {
    return '';
  }
}

async function extractPdf(source) {
  try {
    const { stdout } = await execFileAsync('pdftotext', ['-layout', source, '-'], {
      maxBuffer: 8 * 1024 * 1024,
    });
    if (stdout.trim()) {
      return stdout.trim();
    }
  } catch {
    // Optional local helper; fall back to literal strings.
  }
  const buffer = await readFile(source);
  return extractPdfLiteralText(buffer);
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

  let extracted = '';
  if (ext === 'docx') {
    extracted = await extractDocx(source);
  } else if (ext === 'pdf') {
    extracted = await extractPdf(source);
  }

  if (extracted) {
    await writeFile(getResumePath(), extracted, { mode: 0o600 });
    return {
      ok: true,
      path: getResumePath(),
      format: ext,
      extracted: true,
    };
  }

  await writeFile(
    getResumePath(),
    `[binary resume stored at ${getStateRoot()}/resume.${ext}; extract text in agent context before scoring]`,
    { mode: 0o600 },
  );
  return {
    ok: true,
    path: getResumePath(),
    format: ext,
    extracted: false,
    needsUserInput: true,
    note: 'Could not extract text from this file. Save a local .txt or .md extract. Do not invent résumé facts.',
  };
}

export async function readResumeText() {
  if (!existsSync(getResumePath())) {
    return '';
  }
  return readFile(getResumePath(), 'utf8');
}
