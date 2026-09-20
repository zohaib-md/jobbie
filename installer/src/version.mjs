import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function readPackageVersion() {
  const packagePath = join(__dirname, '..', '..', 'package.json');
  const raw = await readFile(packagePath, 'utf8');
  const pkg = JSON.parse(raw);
  return pkg.version;
}

export function getPackageRoot() {
  return join(__dirname, '..', '..');
}

export function getBundledSkillPath() {
  return join(getPackageRoot(), 'jobbie');
}
