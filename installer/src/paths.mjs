import { homedir, platform } from 'node:os';
import { join } from 'node:path';

export const PACKAGE_NAME = 'applykit';
export const SKILL_DIR_NAME = 'applykit';

export function getAgentsRoot() {
  return join(homedir(), '.agents');
}

export function getSkillInstallPath() {
  return join(getAgentsRoot(), 'skills', SKILL_DIR_NAME);
}

export function getStateRoot() {
  return join(homedir(), '.applykit');
}

export function getVendorSkillPaths() {
  const paths = [];
  const cursorSkills = join(homedir(), '.cursor', 'skills', SKILL_DIR_NAME);
  const codexSkills = join(homedir(), '.codex', 'skills', SKILL_DIR_NAME);
  if (platform() !== 'win32') {
    paths.push(cursorSkills, codexSkills);
  } else {
    paths.push(cursorSkills);
  }
  return paths;
}

export function getUpdateConfigPath() {
  return join(getStateRoot(), 'update.json');
}

export function getInstalledVersionPath() {
  return join(getSkillInstallPath(), 'VERSION');
}
