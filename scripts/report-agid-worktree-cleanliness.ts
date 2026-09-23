import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

type StatusEntry = {
  status: string;
  path: string;
  topLevel: string;
  extension: string;
  category: string;
  cleanupClass: string;
};

type CleanupFinding = {
  id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  count: number;
  recommendation: string;
  examples: string[];
};

const ROOT_ALLOWLIST = new Set([
  '.env.example',
  '.gitignore',
  '.npmrc',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'DATA_LICENSES.md',
  'GOVERNANCE.md',
  'LICENSE',
  'LICENSE_POLICY.md',
  'README.md',
  'README_AGID_MODEL.md',
  'ROADMAP.md',
  'SECURITY.md',
  'SUPPORT.md',
  'embed.html',
  'foundry.toml',
  'index.html',
  'package-lock.json',
  'package.json',
  'server.ts',
  'tsconfig.json',
  'vite.config.ts',
]);

const GENERATED_TOP_LEVEL = new Set([
  'artifacts',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'output',
  'outputs',
  'test-results',
  'tmp',
]);

const DOC_BUCKETS = [
  { id: 'docs/specs', pattern: /\b(spec|standard|protocol|api|schema|conformance|resolver)\b/i },
  { id: 'docs/research', pattern: /\b(theory|paper|research|model|zk|morphism|translation|postal)\b/i },
  { id: 'docs/product', pattern: /\b(product|ux|ui|screen|app|portal|dashboard|pos|hotel|locker|drone)\b/i },
  { id: 'docs/ops', pattern: /\b(ops|operation|security|privacy|release|load|governance|audit|policy)\b/i },
  { id: 'docs/archive', pattern: /\b(resume|unused|draft|old|legacy|archive)\b/i },
];

export const AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT = {
  schema: 'agid-main-repository-cleanliness-contract-v1',
  sourceRootsForNewCode: [
    'src/address',
    'src/agid',
    'src/grid',
    'src/postal',
    'src/zk',
    'src/web3',
    'src/pos',
    'src/integrations',
    'src/server',
    'src/developer',
  ],
  forbiddenNewSourceRoot: 'src/lib',
  documentBuckets: DOC_BUCKETS.map(bucket => bucket.id),
  heavyDataPolicy: {
    forbiddenMainBundleExtensions: ['.zip'],
    preferredTargets: ['country-pack', 'region-pack', 'external-storage', 'compact-manifest'],
  },
  privacyBoundary: {
    rawPersonalAddress: false,
    recipientIdentity: false,
    witnessMaterial: false,
    privateKeys: false,
    connectorSecrets: false,
  },
};

function hasArg(name: string) {
  return process.argv.includes(name);
}

function runGitStatus() {
  const result = spawnSync('git', ['status', '--porcelain=v1'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || 'git status failed');
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function normalizeStatusPath(rawPath: string) {
  const renameArrow = ' -> ';
  const visiblePath = rawPath.includes(renameArrow) ? rawPath.split(renameArrow).at(-1) ?? rawPath : rawPath;
  return visiblePath.replace(/^"|"$/g, '').replaceAll('\\', '/');
}

function classifyPath(filePath: string) {
  const topLevel = filePath.split('/')[0] || filePath;
  const ext = path.extname(filePath).toLowerCase();

  if (GENERATED_TOP_LEVEL.has(topLevel) || ext === '.log') return 'generated-or-runtime';
  if (topLevel === 'src') return 'source';
  if (topLevel === 'docs') return 'documentation';
  if (topLevel === 'data') return 'data';
  if (topLevel === 'sdk') return 'sdk';
  if (topLevel === 'scripts') return 'tooling';
  if (topLevel === 'public') return 'public-assets';
  if (topLevel === 'server.ts' || topLevel === 'db') return 'backend';
  if (topLevel === 'circuits' || topLevel === 'contracts' || topLevel === 'formal' || topLevel === 'native') {
    return 'specialized-runtime';
  }
  if (!filePath.includes('/')) return ROOT_ALLOWLIST.has(filePath) ? 'root-allowed' : 'root-needs-triage';
  return 'uncategorized';
}

function cleanupClass(entry: Pick<StatusEntry, 'path' | 'category' | 'status' | 'extension'>) {
  if (entry.category === 'generated-or-runtime') return 'ignore-or-delete-generated';
  if (entry.category === 'root-needs-triage') return 'move-out-of-root';
  if (entry.path.startsWith('docs/') && entry.path.split('/').length === 2 && entry.extension === '.md') {
    return 'bucket-docs';
  }
  if (entry.path.startsWith('src/lib/') && entry.status === '??') return 'avoid-new-src-lib-root';
  if (entry.extension === '.zip') return 'externalize-heavy-data';
  return 'review-in-place';
}

export function parseEntries(lines: string[]): StatusEntry[] {
  return lines.map(line => {
    const status = line.slice(0, 2).trim() || 'changed';
    const filePath = normalizeStatusPath(line.slice(3));
    const category = classifyPath(filePath);
    const entry = {
      status,
      path: filePath,
      topLevel: filePath.split('/')[0] || filePath,
      extension: path.extname(filePath).toLowerCase() || '(none)',
      category,
      cleanupClass: '',
    };
    entry.cleanupClass = cleanupClass(entry);
    return entry;
  });
}

function countBy(entries: StatusEntry[], selector: (entry: StatusEntry) => string) {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    const key = selector(entry);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function examples(entries: StatusEntry[], predicate: (entry: StatusEntry) => boolean, limit = 8) {
  return entries.filter(predicate).slice(0, limit).map(entry => entry.path);
}

function createFindings(entries: StatusEntry[]): CleanupFinding[] {
  const rootNeedsTriage = entries.filter(entry => entry.cleanupClass === 'move-out-of-root');
  const directDocs = entries.filter(entry => entry.cleanupClass === 'bucket-docs');
  const newSrcLibRoot = entries.filter(entry => entry.cleanupClass === 'avoid-new-src-lib-root');
  const generated = entries.filter(entry => entry.cleanupClass === 'ignore-or-delete-generated');
  const zips = entries.filter(entry => entry.cleanupClass === 'externalize-heavy-data');
  const deletedPostalZips = entries.filter(entry => entry.status === 'D' && entry.path.startsWith('data/postal_codes/') && entry.extension === '.zip');

  return [
    {
      id: 'root-needs-triage',
      severity: rootNeedsTriage.length > 0 ? 'medium' : 'info',
      title: 'Root-level files should be allowlisted or moved',
      count: rootNeedsTriage.length,
      recommendation: 'Move ad-hoc root files into docs/ops, docs/research, reports, scripts, public, or data. Keep root for package/build/license entrypoints only.',
      examples: rootNeedsTriage.slice(0, 8).map(entry => entry.path),
    },
    {
      id: 'direct-doc-bucketing',
      severity: directDocs.length > 50 ? 'high' : directDocs.length > 0 ? 'medium' : 'info',
      title: 'Direct docs/*.md files need category buckets',
      count: directDocs.length,
      recommendation: 'Bucket docs into docs/specs, docs/research, docs/product, docs/ops, or docs/archive. Move in small PRs grouped by topic.',
      examples: directDocs.slice(0, 8).map(entry => {
        const bucket = DOC_BUCKETS.find(candidate => candidate.pattern.test(entry.path))?.id ?? 'docs/archive';
        return `${entry.path} -> ${bucket}/`;
      }),
    },
    {
      id: 'new-src-lib-root',
      severity: newSrcLibRoot.length > 0 ? 'high' : 'info',
      title: 'New files directly under src/lib break the current organization policy',
      count: newSrcLibRoot.length,
      recommendation: 'Place new code under src/address, src/agid, src/grid, src/postal, src/zk, src/web3, src/pos, or src/integrations before adding more src/lib root files.',
      examples: newSrcLibRoot.slice(0, 8).map(entry => entry.path),
    },
    {
      id: 'generated-runtime-files',
      severity: generated.length > 0 ? 'low' : 'info',
      title: 'Generated/runtime files should stay ignored or be removed after use',
      count: generated.length,
      recommendation: 'Keep logs, dist, outputs, tmp, test-results, and runtime artifacts out of commits. If a generated report is useful, export a compact report under reports/.',
      examples: generated.slice(0, 8).map(entry => entry.path),
    },
    {
      id: 'heavy-data-externalization',
      severity: zips.length > 0 ? 'medium' : 'info',
      title: 'Heavy zip datasets should be externalized',
      count: zips.length,
      recommendation: 'Do not keep postal ZIPs or third-party extracts in the app bundle. Prefer country packs, external storage, or generated manifests.',
      examples: zips.slice(0, 8).map(entry => entry.path),
    },
    {
      id: 'deleted-postal-zips',
      severity: deletedPostalZips.length > 0 ? 'low' : 'info',
      title: 'Postal ZIP deletions should be recorded as an intentional data slimming decision',
      count: deletedPostalZips.length,
      recommendation: 'If these deletions are intended, document the replacement source or country-pack path before merging.',
      examples: deletedPostalZips.slice(0, 8).map(entry => entry.path),
    },
  ];
}

function toMarkdown(report: ReturnType<typeof createReport>) {
  const lines = [
    '# AGID Worktree Cleanliness Report',
    '',
    `Generated at: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total changed entries: ${report.totalChangedEntries}`,
    `- Modified: ${report.statusCounts.M ?? 0}`,
    `- Deleted: ${report.statusCounts.D ?? 0}`,
    `- Untracked: ${report.statusCounts['??'] ?? 0}`,
    '',
    '## Counts By Category',
    '',
    '| Category | Count |',
    '| --- | ---: |',
    ...Object.entries(report.categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `| ${name} | ${count} |`),
    '',
    '## Cleanup Findings',
    '',
  ];

  for (const finding of report.findings) {
    lines.push(`### ${finding.title}`);
    lines.push('');
    lines.push(`- ID: \`${finding.id}\``);
    lines.push(`- Severity: \`${finding.severity}\``);
    lines.push(`- Count: ${finding.count}`);
    lines.push(`- Recommendation: ${finding.recommendation}`);
    if (finding.examples.length) {
      lines.push('- Examples:');
      for (const example of finding.examples) lines.push(`  - \`${example}\``);
    }
    lines.push('');
  }

  lines.push('## Policy');
  lines.push('');
  lines.push('- Do not delete or revert unrelated user changes during cleanup.');
  lines.push('- Do not add new files directly under `src/lib`; use domain directories.');
  lines.push('- Keep generated outputs, postal ZIPs, and runtime logs out of the app bundle.');
  lines.push('- Move documents in small topic PRs so review stays possible.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export function createReport(entries: StatusEntry[]) {
  const findings = createFindings(entries);
  return {
    schema: 'agid-worktree-cleanliness-report-v1',
    generatedAt: new Date().toISOString(),
    policyContract: AGID_MAIN_REPOSITORY_CLEANLINESS_CONTRACT,
    totalChangedEntries: entries.length,
    statusCounts: countBy(entries, entry => entry.status),
    categoryCounts: countBy(entries, entry => entry.category),
    extensionCounts: countBy(entries, entry => entry.extension),
    cleanupClassCounts: countBy(entries, entry => entry.cleanupClass),
    findings,
    strictStatus: findings.some(finding => finding.severity === 'critical') ? 'fail' : 'pass',
  };
}

function main() {
  const entries = parseEntries(runGitStatus());
  const report = createReport(entries);

  if (hasArg('--write')) {
    mkdirSync('reports', { recursive: true });
    writeFileSync('reports/agid-worktree-cleanliness.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    writeFileSync('reports/agid-worktree-cleanliness.md', toMarkdown(report), 'utf8');
  }

  console.log(JSON.stringify(report, null, 2));

  if (hasArg('--fail-on-critical') && report.strictStatus !== 'pass') {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) main();
