import { installSkill, getInstallStatus, setAutoUpdate } from './installer.mjs';
import { readPackageVersion } from './version.mjs';

function printHelp() {
  process.stdout.write(`Applykit — privacy-first job application Agent Skill

Usage:
  npx applykit install          Install or refresh the skill locally
  npx applykit status           Show installed version and update mode
  npx applykit update           Reinstall from the current package
  npx applykit updates enable   Enable automatic update checks
  npx applykit updates disable  Disable automatic update checks

Requires Node.js 20+. After install, local commands (onboard, discover, ledger, …) are forwarded to the bundled skill CLI.
`);
}

export async function main(argv = process.argv.slice(2)) {
  const [command, subcommand] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'install') {
    const result = await installSkill();
    process.stdout.write(
      `Installed applykit ${result.version} to ${result.installPath}\n`,
    );
    process.stdout.write(
      'Invoke the skill from your coding agent: applykit\n',
    );
    return;
  }

  if (command === 'status') {
    const status = await getInstallStatus();
    const current = await readPackageVersion();
    process.stdout.write(`Package version: ${current}\n`);
    if (status.installed) {
      process.stdout.write(`Installed version: ${status.version ?? 'unknown'}\n`);
      process.stdout.write(`Install path: ${status.installPath}\n`);
      process.stdout.write(
        `Automatic updates: ${status.autoUpdate ? 'enabled' : 'disabled'}\n`,
      );
    } else {
      process.stdout.write('Skill not installed. Run: npx applykit install\n');
    }
    return;
  }

  if (command === 'update') {
    const result = await installSkill();
    process.stdout.write(`Updated applykit to ${result.version}\n`);
    return;
  }

  if (command === 'updates') {
    if (subcommand === 'enable') {
      await setAutoUpdate(true);
      process.stdout.write('Automatic updates enabled.\n');
      return;
    }
    if (subcommand === 'disable') {
      await setAutoUpdate(false);
      process.stdout.write('Automatic updates disabled.\n');
      return;
    }
    throw new Error('Usage: applykit updates <enable|disable>');
  }

  throw new Error(`Unknown command: ${command}`);
}
