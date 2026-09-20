import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installSkill } from '../src/installer.mjs';
import { getSkillInstallPath } from '../src/paths.mjs';

test('installSkill copies bundled skill to agents directory', async () => {
  const previousHome = process.env.HOME;
  const tempHome = await mkdtemp(join(tmpdir(), 'applykit-home-'));
  process.env.HOME = tempHome;

  try {
    const result = await installSkill();
    assert.equal(result.version, '1.1.0');
    assert.equal(result.installPath, getSkillInstallPath());

    const { readFile } = await import('node:fs/promises');
    const skill = await readFile(join(result.installPath, 'SKILL.md'), 'utf8');
    assert.match(skill, /name: applykit/);
  } finally {
    process.env.HOME = previousHome;
    await rm(tempHome, { recursive: true, force: true });
  }
});
