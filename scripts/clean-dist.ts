import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type CleanDistOptions = {
  cwd?: string;
  dryRun?: boolean;
};

export async function cleanDist(options: CleanDistOptions = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const distPath = path.resolve(cwd, 'dist');
  const relative = path.relative(cwd, distPath);

  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative) || path.basename(distPath) !== 'dist') {
    throw new Error(`Refusing to clean unsafe dist path: ${distPath}`);
  }

  if (!existsSync(distPath)) {
    return {
      distPath,
      removed: false,
      dryRun: Boolean(options.dryRun),
    };
  }

  if (!options.dryRun) {
    await rm(distPath, { recursive: true, force: true });
  }

  return {
    distPath,
    removed: true,
    dryRun: Boolean(options.dryRun),
  };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const dryRun = process.argv.includes('--dry-run');
  const result = await cleanDist({ dryRun });
  const verb = result.dryRun ? 'Would remove' : 'Removed';
  console.log(result.removed ? `${verb} ${result.distPath}` : `No dist directory at ${result.distPath}`);
}
