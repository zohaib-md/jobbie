#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main as installerMain } from '../installer/src/cli.mjs';

const INSTALLER_COMMANDS = new Set([
  'install',
  'status',
  'update',
  'updates',
  'help',
  '--help',
  '-h',
]);

const argv = process.argv.slice(2);
const command = argv[0];

if (!command || INSTALLER_COMMANDS.has(command)) {
  installerMain(argv).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
} else {
  const script = join(dirname(fileURLToPath(import.meta.url)), '../applykit/scripts/applykit.mjs');
  const child = spawn(process.execPath, [script, ...argv], { stdio: 'inherit' });
  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}
