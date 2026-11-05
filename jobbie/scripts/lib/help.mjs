const COMMAND_USAGE = {
  onboard: ['onboard --resume <local-path> [--stdin]'],
  profile: ['profile set --stdin', 'profile migrate --stdin', 'profile check', 'profile field <field>'],
  resume: ['resume import <local-path>'],
  discover: ['discover search --stdin'],
  score: ['score --stdin'],
  ats: ['ats analyze --stdin'],
  'cover-letter': ['cover-letter draft --stdin'],
  prep: ['prep generate --stdin'],
  ledger: ['ledger check|add|outcome --stdin', 'ledger review', 'ledger review-ack --stdin'],
  safety: ['safety classify|answer|can-submit --stdin'],
  facts: ['facts extract --stdin'],
  telemetry: ['telemetry status|enable|disable', 'telemetry record --stdin'],
};

export function printLocalHelp(domain) {
  const commands = Object.hasOwn(COMMAND_USAGE, domain)
    ? COMMAND_USAGE[domain]
    : Object.values(COMMAND_USAGE).flat();
  process.stdout.write(`jobbie local commands\n\nUsage:\n${commands.map((command) => `  jobbie ${command}`).join('\n')}\n
Commands marked --stdin read a JSON object from standard input.
Example:
  printf '%s' '{"jobDescription":"...","resumeText":"..."}' | jobbie ats analyze --stdin

Use jobbie <command> --help for command usage (for example, jobbie onboard --help).
`);
}
