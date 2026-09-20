import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { importResume, readResumeText } from '../scripts/lib/resume.mjs';
import { onboardResume } from '../scripts/lib/onboard.mjs';

const execFileAsync = promisify(execFile);

async function withTempHome(fn) {
  const previous = process.env.APPLYKIT_HOME;
  const tempHome = await mkdtemp(join(tmpdir(), 'applykit-resume-'));
  process.env.APPLYKIT_HOME = tempHome;
  try {
    await fn(tempHome);
  } finally {
    if (previous === undefined) {
      delete process.env.APPLYKIT_HOME;
    } else {
      process.env.APPLYKIT_HOME = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
  }
}

async function writeDocx(path, paragraphs) {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs
      .map(
        (text) =>
          `<w:p><w:r><w:t>${text.replaceAll('&', '&amp;')}</w:t></w:r></w:p>`,
      )
      .join('\n')}
  </w:body>
</w:document>`;
  const staging = await mkdtemp(join(tmpdir(), 'applykit-docx-'));
  await mkdir(join(staging, 'word'), { recursive: true });
  await writeFile(join(staging, 'word/document.xml'), xml);
  await execFileAsync('zip', ['-q', '-r', path, 'word'], { cwd: staging });
  await rm(staging, { recursive: true, force: true });
}

function fakePdf(text) {
  const payload = `BT /F1 12 Tf 72 700 Td (${text}) Tj ET`;
  const stream = Buffer.from(payload, 'utf8');
  return `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length ${stream.length} >>stream
${payload}
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
trailer<< /Root 1 0 obj >>
%%EOF
`;
}

test('imports DOCX text locally without inventing facts', async () => {
  await withTempHome(async (home) => {
    const docx = join(home, 'jordan.docx');
    await writeDocx(docx, [
      'Jordan Blake',
      'jordan.blake@example.test',
      'SKILLS',
      'TypeScript, React',
    ]);
    const imported = await importResume(docx);
    assert.equal(imported.ok, true);
    assert.equal(imported.format, 'docx');
    const text = await readResumeText();
    assert.match(text, /Jordan Blake/);
    assert.match(text, /TypeScript/);
    assert.doesNotMatch(text, /quantum compiler/i);
  });
});

test('imports uncompressed PDF text locally', async () => {
  await withTempHome(async (home) => {
    const pdf = join(home, 'jordan.pdf');
    await writeFile(pdf, fakePdf('Jordan Blake TypeScript'));
    const imported = await importResume(pdf);
    assert.equal(imported.ok, true);
    const text = await readResumeText();
    assert.match(text, /Jordan Blake TypeScript/);
  });
});

test('onboard does not guess target role or work authorization', async () => {
  await withTempHome(async (home) => {
    const resume = join(home, 'resume.txt');
    await writeFile(
      resume,
      'Jordan Blake\njordan.blake@example.test\nSKILLS\nTypeScript\n',
    );
    const result = await onboardResume(resume);
    assert.equal(result.ok, true);
    assert.ok(result.missing.includes('workAuthorization'));
    assert.ok(result.missing.includes('targetRoles'));
    assert.ok(result.missing.includes('targetSeniority'));
    assert.deepEqual(result.profileDraft.targetRoles, []);
    assert.equal(result.profileDraft.targetSeniority, undefined);
  });
});
