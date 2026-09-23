import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

type P2Manifest = {
  packages: Array<{
    repository: string;
    countryCode: string;
    countryName: string;
    kind: string;
    readiness: string;
    coreFiles: { complete: boolean };
  }>;
};

function argValue(name: string, fallback: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find(arg => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function run(command: string, args: string[], cwd?: string) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function repoExists(owner: string, repository: string) {
  try {
    run('gh', ['repo', 'view', `${owner}/${repository}`, '--json', 'nameWithOwner']);
    return true;
  } catch {
    return false;
  }
}

function createRemote(owner: string, repository: string, description: string, visibility: 'public' | 'private') {
  const visibilityFlag = visibility === 'public' ? '--public' : '--private';
  run('gh', [
    'repo',
    'create',
    `${owner}/${repository}`,
    visibilityFlag,
    '--description',
    description,
    '--disable-wiki',
  ]);
}

function publishPackage(owner: string, repository: string, sourceDir: string, tempRoot: string) {
  const publishDir = join(tempRoot, repository);
  mkdirSync(publishDir, { recursive: true });
  cpSync(sourceDir, publishDir, { recursive: true });
  run('git', ['init', '-b', 'main'], publishDir);
  run('git', ['config', 'user.name', 'AGID Bot'], publishDir);
  run('git', ['config', 'user.email', 'agid-bot@users.noreply.github.com'], publishDir);
  run('git', ['add', '.'], publishDir);
  run('git', ['commit', '-m', 'Initialize P2 medium open-geodata package'], publishDir);
  run('git', ['remote', 'add', 'origin', `https://github.com/${owner}/${repository}.git`], publishDir);
  run('git', ['push', '-u', 'origin', 'main'], publishDir);
}

const owner = argValue('--owner', 'dawnportinfo-design');
const wave = Number.parseInt(argValue('--wave', '1'), 10);
const limit = Number.parseInt(argValue('--limit', '3'), 10);
const offset = Number.parseInt(argValue('--offset', '0'), 10);
const visibility = argValue('--visibility', 'public') as 'public' | 'private';
const execute = process.argv.includes('--execute');

if (!Number.isInteger(wave) || wave < 1) throw new Error(`Invalid --wave: ${wave}`);
if (!Number.isInteger(limit) || limit < 1) throw new Error(`Invalid --limit: ${limit}`);
if (!Number.isInteger(offset) || offset < 0) throw new Error(`Invalid --offset: ${offset}`);
if (visibility !== 'public' && visibility !== 'private') throw new Error(`Invalid --visibility: ${visibility}`);

const manifestPath = `data/open_geo_repositories/p2-medium-wave-${wave}-manifest.json`;
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as P2Manifest;
const candidates = manifest.packages
  .filter(pkg => pkg.coreFiles.complete)
  .slice(offset, offset + limit);

const tempRoot = mkdtempSync(join(tmpdir(), `agid-p2-publish-wave-${wave}-`));
const results: Array<Record<string, unknown>> = [];

try {
  for (const pkg of candidates) {
    const sourceDir = `data/open_geo_repositories/${pkg.repository}`;
    const description = `${pkg.countryName} (${pkg.countryCode}) ${pkg.kind} AGID P2 medium open-geodata seed package.`;
    const exists = repoExists(owner, pkg.repository);
    const result: Record<string, unknown> = {
      repository: `${owner}/${pkg.repository}`,
      sourceDir,
      existsBefore: exists,
      action: execute ? 'created-and-pushed' : exists ? 'dry-run-existing-remote-will-skip' : 'dry-run-create-and-push',
    };

    if (!existsSync(sourceDir)) {
      result.action = 'skipped-missing-local-source';
      results.push(result);
      continue;
    }

    if (exists) {
      result.action = 'skipped-existing-remote';
      results.push(result);
      continue;
    }

    if (execute) {
      createRemote(owner, pkg.repository, description, visibility);
      publishPackage(owner, pkg.repository, sourceDir, tempRoot);
    }

    results.push(result);
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log(JSON.stringify({
  mode: execute ? 'execute' : 'dry-run',
  owner,
  wave,
  offset,
  limit,
  visibility,
  selected: candidates.length,
  results,
  nextCommand: execute
    ? `npx tsx scripts/publish-p2-medium-repositories.ts --owner=${owner} --wave=${wave} --offset=${offset + limit} --limit=${limit} --visibility=${visibility} --execute`
    : `npx tsx scripts/publish-p2-medium-repositories.ts --owner=${owner} --wave=${wave} --offset=${offset} --limit=${limit} --visibility=${visibility} --execute`,
}, null, 2));
