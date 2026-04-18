export type BuildInfo = { version: string; sha: string };

export function getBuildInfo(): BuildInfo {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
  const fullSha = process.env.NEXT_PUBLIC_GIT_SHA ?? '';
  const sha = fullSha.length >= 8 ? fullSha.slice(0, 8) : 'dev';
  return { version, sha };
}
