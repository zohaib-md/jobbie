#!/usr/bin/env node
/**
 * Creates starter GitHub issues from GOOD_FIRST_ISSUES.md.
 * Requires `gh` authenticated against the current repository.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const markdown = await readFile(join(root, 'GOOD_FIRST_ISSUES.md'), 'utf8');
const blocks = [...markdown.matchAll(/^## \d+\. (.+)\n\n([\s\S]*?)(?=^## |\z)/gm)];

if (blocks.length === 0) {
  throw new Error('No issues found in GOOD_FIRST_ISSUES.md');
}

const auth = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' });
if (auth.status !== 0) {
  process.stderr.write(
    'GitHub CLI is not authenticated. Run `gh auth login` or `gh auth refresh -h github.com`, then retry.\n',
  );
  process.stderr.write(auth.stderr || auth.stdout || '');
  process.exit(1);
}

const labels = spawnSync('gh', ['label', 'create', 'good first issue', '--description', 'Friendly starter task', '--force'], {
  encoding: 'utf8',
});
if (labels.status !== 0) {
  process.stderr.write(labels.stderr || 'Could not ensure good first issue label.\n');
}

for (const match of blocks) {
  const title = match[1].trim();
  const body = match[2].trim();
  const created = spawnSync(
    'gh',
    ['issue', 'create', '--title', title, '--body', body, '--label', 'good first issue'],
    { encoding: 'utf8' },
  );
  if (created.status !== 0) {
    process.stderr.write(`Failed to create "${title}":\n${created.stderr || created.stdout}\n`);
    process.exit(created.status ?? 1);
  }
  process.stdout.write(created.stdout);
}
