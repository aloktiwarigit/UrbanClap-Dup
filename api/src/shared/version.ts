import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface PackageJson {
  version: string;
}

const pkgPath = fileURLToPath(new URL('../../package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;

export interface VersionInfo {
  version: string;
  commit: string;
}

export function getVersionInfo(): VersionInfo {
  const sha = process.env.GIT_SHA;
  return {
    version: pkg.version,
    commit: sha ? sha.slice(0, 8) : 'dev',
  };
}
