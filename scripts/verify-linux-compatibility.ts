import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildLinuxCompatibilityReport,
  type LinuxCompatibilityFile,
} from '../src/lib/linuxCompatibility';

type PackageJson = {
  scripts?: Record<string, string>;
};

const scannedRoots = ['src', 'scripts'];
const scannedRootFiles = ['package.json', 'server.ts', 'README.md'];
const ignoredDirectories = new Set([
  '.git',
  'dist',
  'node_modules',
  'coverage',
  'output',
  'artifacts',
]);

async function collectFiles(root: string): Promise<LinuxCompatibilityFile[]> {
  const files: LinuxCompatibilityFile[] = [];

  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          await walk(entryPath);
        }
        continue;
      }
      if (!entry.isFile()) continue;

      const relativePath = path.relative(root, entryPath).replace(/\\/g, '/');
      const extension = path.extname(entry.name).toLowerCase();
      const content = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.cjs', '.mjs'].includes(extension)
        ? await readFile(entryPath, 'utf8')
        : undefined;
      files.push({ path: relativePath, content });
    }
  }

  for (const rootEntry of scannedRoots) {
    await walk(path.join(root, rootEntry));
  }

  for (const rootFile of scannedRootFiles) {
    const filePath = path.join(root, rootFile);
    files.push({
      path: rootFile,
      content: await readFile(filePath, 'utf8'),
    });
  }

  return files;
}

async function readPackageScripts(root: string) {
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as PackageJson;
  return packageJson.scripts ?? {};
}

export async function verifyLinuxCompatibility(root = process.cwd()) {
  const [files, packageScripts] = await Promise.all([
    collectFiles(root),
    readPackageScripts(root),
  ]);
  return buildLinuxCompatibilityReport({
    platform: 'linux',
    nodeVersion: process.version,
    packageScripts,
    files,
  });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const report = await verifyLinuxCompatibility(root);

  console.log(`Linux compatibility: ${report.status}`);
  console.log(`Checks: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`);

  for (const check of report.checks) {
    const icon = check.severity === 'pass' ? 'PASS' : check.severity === 'warn' ? 'WARN' : 'FAIL';
    console.log(`[${icon}] ${check.label}: ${check.message}`);
    if (check.evidence.length > 0 && check.severity !== 'pass') {
      for (const evidence of check.evidence.slice(0, 10)) {
        console.log(`  - ${evidence}`);
      }
    }
  }

  if (report.status === 'blocked') {
    process.exitCode = 1;
  }
}
