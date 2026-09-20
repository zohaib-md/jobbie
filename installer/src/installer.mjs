import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  getSkillInstallPath,
  getStateRoot,
  getUpdateConfigPath,
  getVendorSkillPaths,
  getInstalledVersionPath,
} from './paths.mjs';
import { getBundledSkillPath, readPackageVersion } from './version.mjs';

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function copySkillTree(source, destination) {
  await ensureDir(dirname(destination));
  if (existsSync(destination)) {
    await rm(destination, { recursive: true, force: true });
  }
  await cp(source, destination, { recursive: true, force: true });
}

async function readUpdateConfig() {
  const path = getUpdateConfigPath();
  if (!existsSync(path)) {
    return { autoUpdate: true };
  }
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function writeUpdateConfig(config) {
  await ensureDir(getStateRoot());
  await writeFile(getUpdateConfigPath(), `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
}

export async function getInstallStatus() {
  const installPath = getSkillInstallPath();
  const installed = existsSync(installPath);
  const version = installed && existsSync(getInstalledVersionPath())
    ? (await readFile(getInstalledVersionPath(), 'utf8')).trim()
    : null;
  const updateConfig = await readUpdateConfig();
  return {
    installed,
    installPath,
    version,
    packageVersion: await readPackageVersion(),
    autoUpdate: updateConfig.autoUpdate !== false,
  };
}

export async function installSkill() {
  const bundled = getBundledSkillPath();
  const version = await readPackageVersion();
  const installPath = getSkillInstallPath();
  const stagingPath = `${installPath}.staging`;

  await ensureDir(getStateRoot());
  await copySkillTree(bundled, stagingPath);
  await writeFile(`${stagingPath}/VERSION`, `${version}\n`, { mode: 0o644 });

  if (existsSync(installPath)) {
    const backupPath = `${installPath}.backup`;
    if (existsSync(backupPath)) {
      await rm(backupPath, { recursive: true, force: true });
    }
    await cp(installPath, backupPath, { recursive: true, force: true });
  }

  if (existsSync(installPath)) {
    await rm(installPath, { recursive: true, force: true });
  }
  await cp(stagingPath, installPath, { recursive: true, force: true });
  await rm(stagingPath, { recursive: true, force: true });

  for (const vendorPath of getVendorSkillPaths()) {
    const parent = dirname(vendorPath);
    if (existsSync(parent)) {
      await copySkillTree(installPath, vendorPath);
    }
  }

  const updateConfig = await readUpdateConfig();
  if (updateConfig.autoUpdate === undefined) {
    await writeUpdateConfig({ autoUpdate: true });
  }

  return { installPath, version };
}

export async function setAutoUpdate(enabled) {
  const current = await readUpdateConfig();
  await writeUpdateConfig({ ...current, autoUpdate: enabled });
}
