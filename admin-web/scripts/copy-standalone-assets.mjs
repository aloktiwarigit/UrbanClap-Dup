import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');

async function copyIfExists(source, destination) {
  try {
    await stat(source);
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

await copyIfExists(
  path.join(projectRoot, '.next', 'static'),
  path.join(standaloneDir, '.next', 'static'),
);

await copyIfExists(
  path.join(projectRoot, 'public'),
  path.join(standaloneDir, 'public'),
);
