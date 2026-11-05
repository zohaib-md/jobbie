import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageCli = fileURLToPath(new URL('../../bin/jobbie.mjs', import.meta.url));
const skillCli = fileURLToPath(new URL('../scripts/jobbie.mjs', import.meta.url));

async function withHome(run) {
  const home = await mkdtemp(join(tmpdir(), 'jobbie-help-'));
  try {
    await run(home);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
}

function invoke(cli, args, home) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HOME: home, JOBBIE_HOME: join(home, 'data') },
    timeout: 5000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return result.stdout;
}

test('package help makes the main local flows discoverable', async () => {
  await withHome(async (home) => {
    for (const args of [[], ['help'], ['--help'], ['-h']]) {
      const output = invoke(packageCli, args, home);
      for (const usage of ['jobbie install', 'onboard --resume <local-path>',
        'discover search --stdin', 'ats analyze --stdin', 'ledger review']) {
        assert.ok(output.includes(usage), `Missing ${usage}`);
      }
      assert.match(output, /jobbie onboard --help/);
    }
    assert.deepEqual(await readdir(home), []);
  });
});

for (const cli of [packageCli, skillCli]) {
  test(`${cli === packageCli ? 'package' : 'skill'} command help exits without reading stdin or writing state`, async () => {
    await withHome(async (home) => {
      for (const args of [
        ['onboard', '--help'], ['onboard', '-h'], ['resume', 'import', '--help'],
        ['profile', 'set', '--help'], ['discover', 'search', '--help'],
        ['ledger', 'add', '--help'], ['safety', 'answer', '--help'],
        ['telemetry', 'enable', '--help'], ['telemetry', 'disable', '-h'],
      ]) {
        const output = invoke(cli, args, home);
        assert.match(output, new RegExp(`jobbie ${args[0]} `));
        assert.match(output, /Usage:/);
      }
      assert.deepEqual(await readdir(home), []);
    });
  });
}

test('installer help does not install or change update settings', async () => {
  await withHome(async (home) => {
    for (const args of [['install', '--help'], ['update', '-h'], ['updates', 'enable', '--help']]) {
      assert.match(invoke(packageCli, args, home), /Usage:/);
    }
    assert.deepEqual(await readdir(home), []);
  });
});
