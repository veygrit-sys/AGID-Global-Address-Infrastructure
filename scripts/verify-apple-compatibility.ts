import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildAppleCompatibilityReport,
  type AppleCompatibilityFile,
} from '../src/lib/appleCompatibility';

const sourceRoots = ['src'];
const ignoredDirectories = new Set(['node_modules', 'dist', '.git', 'coverage', 'output', 'artifacts']);

async function collectSourceFiles(root: string): Promise<AppleCompatibilityFile[]> {
  const files: AppleCompatibilityFile[] = [];

  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) await walk(entryPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const extension = path.extname(entry.name).toLowerCase();
      if (!['.ts', '.tsx', '.js', '.jsx'].includes(extension)) continue;
      files.push({
        path: path.relative(root, entryPath).replace(/\\/g, '/'),
        content: await readFile(entryPath, 'utf8'),
      });
    }
  }

  for (const sourceRoot of sourceRoots) {
    await walk(path.join(root, sourceRoot));
  }
  return files;
}

export async function verifyAppleCompatibility(root = process.cwd()) {
  const [indexHtml, embedHtml, indexCss, viteConfigSource, sourceFiles] = await Promise.all([
    readFile(path.join(root, 'index.html'), 'utf8'),
    readFile(path.join(root, 'embed.html'), 'utf8'),
    readFile(path.join(root, 'src', 'index.css'), 'utf8'),
    readFile(path.join(root, 'vite.config.ts'), 'utf8'),
    collectSourceFiles(root),
  ]);

  return buildAppleCompatibilityReport({
    htmlFiles: [
      { path: 'index.html', content: indexHtml },
      { path: 'embed.html', content: embedHtml },
    ],
    cssFiles: [{ path: 'src/index.css', content: indexCss }],
    sourceFiles,
    viteConfigSource,
  });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const report = await verifyAppleCompatibility(root);

  console.log(`Apple compatibility: ${report.status}`);
  console.log(`Checks: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail`);

  for (const check of report.checks) {
    const label = check.severity === 'pass' ? 'PASS' : check.severity === 'warn' ? 'WARN' : 'FAIL';
    console.log(`[${label}] ${check.label}: ${check.message}`);
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
