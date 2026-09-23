const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportPath = path.join(root, 'docs', 'unused-file-material-audit-2026-06-07.md');
const jsonPath = path.join(root, 'tmp', 'unused-file-material-audit-2026-06-07.json');

const SKIP_DIRS = new Set(['.git', 'node_modules']);
const TEXT_EXTS = new Set([
  '.cjs',
  '.css',
  '.csv',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.lean',
  '.md',
  '.mjs',
  '.scss',
  '.tex',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);
const CODE_EXTS = new Set(['.cjs', '.css', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const SRC_CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const MAX_TEXT_BYTES = 700 * 1024;

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function exists(file) {
  try {
    fs.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
      continue;
    }
    if (entry.isFile()) files.push(path.join(dir, entry.name));
  }
  return files;
}

function sizeOf(file) {
  return fs.statSync(file).size;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  for (const unit of units) {
    if (value < 1024) return `${value.toFixed(value < 10 ? 2 : 1)} ${unit}`;
    value /= 1024;
  }
  return `${value.toFixed(2)} TB`;
}

function readMaybeText(file) {
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return null;
  const bytes = sizeOf(file);
  if (bytes > MAX_TEXT_BYTES) return null;
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countSubstring(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function extractImports(text) {
  const imports = new Set();
  const patterns = [
    /import\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      imports.add(match[1]);
    }
  }
  return [...imports];
}

function extractHtmlEntries(text) {
  const entries = new Set();
  const patterns = [
    /<script[^>]+src=["']([^"']+)["']/g,
    /<link[^>]+href=["']([^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const value = match[1];
      if (value.startsWith('/')) entries.add(value.slice(1));
      else entries.add(value);
    }
  }
  return [...entries];
}

function resolveImport(fromFile, specifier) {
  if (!specifier || specifier.startsWith('http:') || specifier.startsWith('https:')) return null;
  if (!specifier.startsWith('.') && !specifier.startsWith('@/') && !specifier.startsWith('/')) return null;

  let base;
  if (specifier.startsWith('@/')) base = path.join(root, specifier.slice(2));
  else if (specifier.startsWith('/')) base = path.join(root, specifier.slice(1));
  else base = path.resolve(path.dirname(fromFile), specifier);

  const candidates = [];
  candidates.push(base);
  for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yaml', '.yml', '.css', '.scss']) {
    candidates.push(base + ext);
  }
  for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yaml', '.yml', '.css']) {
    candidates.push(path.join(base, `index${ext}`));
  }

  return candidates.find((candidate) => exists(candidate)) || null;
}

function packageScriptEntrypoints(packageJson) {
  const entries = new Set();
  const scripts = packageJson.scripts || {};
  for (const command of Object.values(scripts)) {
    const matches = command.match(/[A-Za-z0-9_./\\-]+\.(?:ts|tsx|js|cjs|mjs|py)/g) || [];
    for (const match of matches) {
      const clean = match.replace(/\\/g, '/').replace(/^\.\//, '');
      const full = path.join(root, clean);
      if (exists(full)) entries.add(full);
    }
  }
  return entries;
}

function buildReachableGraph(filesByRel, packageJson) {
  const entries = new Set();
  for (const name of ['index.html', 'embed.html', 'server.ts', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js']) {
    const full = path.join(root, name);
    if (exists(full)) entries.add(full);
  }
  for (const file of packageScriptEntrypoints(packageJson)) entries.add(file);

  for (const htmlName of ['index.html', 'embed.html']) {
    const full = path.join(root, htmlName);
    if (!exists(full)) continue;
    const html = fs.readFileSync(full, 'utf8');
    for (const entry of extractHtmlEntries(html)) {
      const resolved = path.join(root, entry);
      if (exists(resolved)) entries.add(resolved);
    }
  }

  const reachable = new Set();
  const queue = [...entries];
  while (queue.length) {
    const current = queue.shift();
    const currentRel = rel(current);
    if (reachable.has(currentRel)) continue;
    reachable.add(currentRel);

    const ext = path.extname(current).toLowerCase();
    if (!CODE_EXTS.has(ext) && ext !== '.html') continue;
    const text = readMaybeText(current);
    if (!text) continue;
    for (const specifier of extractImports(text)) {
      const resolved = resolveImport(current, specifier);
      if (!resolved) continue;
      const resolvedRel = rel(resolved);
      if (filesByRel.has(resolvedRel) && !reachable.has(resolvedRel)) queue.push(resolved);
    }
  }

  return { entries: [...entries].map(rel).sort(), reachable };
}

function topLevelStats(files) {
  const stats = new Map();
  for (const file of files) {
    const relative = rel(file);
    const top = relative.includes('/') ? relative.split('/')[0] : '(root)';
    const current = stats.get(top) || { count: 0, bytes: 0 };
    current.count += 1;
    current.bytes += sizeOf(file);
    stats.set(top, current);
  }
  return [...stats.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.bytes - a.bytes);
}

function findGeneratedCandidates(filesByRel) {
  const candidates = [];
  const finalManuscriptPdfs = new Set([
    'output/pdf/address-morphism-theory-full-ja.pdf',
    'output/pdf/address-morphism-theory-full-en.pdf',
  ]);
  for (const [relative, full] of filesByRel) {
    const lower = relative.toLowerCase();
    const bytes = sizeOf(full);
    if (relative.startsWith('dist/')) {
      candidates.push({ relative, bytes, confidence: 'high', reason: 'Vite build output; reproducible by npm run build.' });
    } else if (relative.startsWith('tmp/')) {
      const isAuditJson = /^tmp\/unused-file-material-audit-.*\.json$/i.test(relative);
      candidates.push({
        relative,
        bytes,
        confidence: isAuditJson ? 'low' : 'high',
        reason: isAuditJson ? 'Machine-readable audit output; keep while using this report.' : 'Temporary screenshots/review artifacts.',
      });
    } else if (relative.startsWith('test-results/')) {
      candidates.push({ relative, bytes, confidence: 'high', reason: 'Playwright/test artifact; reproducible by rerunning tests.' });
    } else if (lower.includes('__pycache__/') || lower.endsWith('.pyc')) {
      candidates.push({ relative, bytes, confidence: 'high', reason: 'Python bytecode cache.' });
    } else if (lower.endsWith('.log') || lower.endsWith('.err.log')) {
      candidates.push({ relative, bytes, confidence: 'high', reason: 'Runtime log file.' });
    } else if (relative.startsWith('output/pdf/docs/') && lower.endsWith('.pdf')) {
      candidates.push({ relative, bytes, confidence: 'medium', reason: 'Generated PDF rendering of a docs source file; archive or keep only selected evidence copies.' });
    } else if (relative.startsWith('output/pdf/') && lower.endsWith('.pdf') && !finalManuscriptPdfs.has(relative)) {
      candidates.push({ relative, bytes, confidence: 'medium', reason: 'Older/generated PDF; keep only if it is a chosen deliverable or comparison baseline.' });
    } else if (relative.startsWith('output/pdf/') && /visual-check|launch-audit|review|contact-sheet/i.test(relative) && /\.(png|jpg|jpeg)$/i.test(relative)) {
      candidates.push({ relative, bytes, confidence: 'medium', reason: 'Visual verification evidence; keep only if audit trail is needed.' });
    } else if (relative.startsWith('output/pdf/') && lower.endsWith('.html')) {
      const pdf = relative.replace(/\.html$/i, '.pdf');
      candidates.push({
        relative,
        bytes,
        confidence: filesByRel.has(pdf) ? 'medium' : 'low',
        reason: filesByRel.has(pdf) ? 'HTML preview paired with generated PDF.' : 'HTML preview/intermediate output.',
      });
    } else if (relative.startsWith('output/pdf/') && lower.endsWith('.tex')) {
      candidates.push({ relative, bytes, confidence: 'low', reason: 'Generated TeX/intermediate PDF source; keep if manual editing is planned.' });
    }
  }
  return candidates.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.confidence] - rank[b.confidence] || b.bytes - a.bytes;
  });
}

function findPostalZipCandidates(filesByRel) {
  const out = [];
  for (const [relative, full] of filesByRel) {
    if (!relative.startsWith('data/postal_codes/') || !relative.toLowerCase().endsWith('.zip')) continue;
    const stem = relative.replace(/\.zip$/i, '');
    const hasExtracted = [...filesByRel.keys()].some((candidate) =>
      candidate !== relative && candidate.startsWith(stem) && /\.(txt|csv|json)$/i.test(candidate)
    );
    out.push({
      relative,
      bytes: sizeOf(full),
      confidence: hasExtracted ? 'medium' : 'low',
      reason: hasExtracted ? 'Archive appears to have extracted text/CSV/JSON sibling data.' : 'Postal archive cache; no extracted sibling detected.',
    });
  }
  return out.sort((a, b) => b.bytes - a.bytes);
}

function findDocumentArchiveCandidates(filesByRel) {
  const out = [];
  for (const [relative, full] of filesByRel) {
    if (!relative.startsWith('docs/') || !relative.endsWith('.md')) continue;
    const name = path.basename(relative).toLowerCase();
    let reason = null;
    if (relative.startsWith('docs/chapter-verification/')) {
      reason = 'Chapter verification/addendum note; valuable evidence, but can be archived outside active manuscript docs.';
    } else if (/draft|professional-draft|evaluation|verification|audit|matrix|boundaries|scan|comparison|gap/.test(name)) {
      reason = 'Audit, draft, comparison, or verification material; useful record but likely not active app/runtime input.';
    } else if (/address-morphism-theory-ja-v1-chapters-\d+-\d+/.test(name)) {
      reason = 'Split manuscript segment; archive if master manuscript already supersedes it.';
    }
    if (reason) {
      out.push({ relative, bytes: sizeOf(full), confidence: 'review', reason });
    }
  }
  return out.sort((a, b) => b.bytes - a.bytes);
}

function findCodeReviewCandidates(filesByRel, reachable, packageJson, textIndex) {
  const out = [];
  for (const [relative, full] of filesByRel) {
    const ext = path.extname(relative).toLowerCase();
    if (relative.startsWith('src/') && SRC_CODE_EXTS.has(ext) && !reachable.has(relative)) {
      out.push({
        relative,
        bytes: sizeOf(full),
        confidence: 'review',
        reason: 'Not reached by the static import graph from index/embed/server/package scripts. Check dynamic imports before removal.',
      });
    }
  }

  const scriptEntries = packageScriptEntrypoints(packageJson);
  const packageEntryRels = new Set([...scriptEntries].map(rel));
  for (const [relative, full] of filesByRel) {
    if (!relative.startsWith('scripts/')) continue;
    const ext = path.extname(relative).toLowerCase();
    if (!['.ts', '.tsx', '.js', '.cjs', '.mjs', '.py'].includes(ext)) continue;
    if (packageEntryRels.has(relative)) continue;
    const refs = referenceCount(relative, textIndex);
    if (refs.pathRefs <= 1 && refs.basenameRefs <= 1) {
      out.push({
        relative,
        bytes: sizeOf(full),
        confidence: 'review',
        reason: 'Script is not exposed through package.json and has little repository reference evidence.',
      });
    }
  }
  return out.sort((a, b) => b.bytes - a.bytes);
}

function referenceCount(relative, textIndex) {
  const base = path.basename(relative);
  const pathNeedles = new Set([relative, relative.replace(/\//g, '\\')]);
  let pathRefs = 0;
  let basenameRefs = 0;
  for (const { relative: textRel, text } of textIndex) {
    if (textRel === relative) continue;
    for (const needle of pathNeedles) pathRefs += countSubstring(text, needle);
    basenameRefs += countSubstring(text, base);
  }
  return { pathRefs, basenameRefs };
}

function tableRows(items, limit = 80) {
  const rows = [];
  for (const item of items.slice(0, limit)) {
    rows.push(`| \`${item.relative}\` | ${formatBytes(item.bytes)} | ${item.confidence} | ${item.reason} |`);
  }
  if (items.length > limit) {
    rows.push(`| ... | ... | ... | ${items.length - limit} more entries omitted in the Markdown summary; see JSON report for the full list. |`);
  }
  return rows.join('\n');
}

function makeReport(data) {
  const topStats = data.topStats.slice(0, 20).map((item) => `| \`${item.name}\` | ${item.count} | ${formatBytes(item.bytes)} |`).join('\n');
  const largest = data.largestFiles.slice(0, 25).map((item) => `| \`${item.relative}\` | ${formatBytes(item.bytes)} |`).join('\n');
  const highGenerated = data.generatedCandidates.filter((item) => item.confidence === 'high');
  const mediumGenerated = data.generatedCandidates.filter((item) => item.confidence !== 'high');

  return `# Unused File and Material Audit

Date: 2026-06-07

Scope: full workspace traversal excluding only \`.git\` and \`node_modules\`. The app was launched at \`http://127.0.0.1:3000/\`, and the production build was verified separately with \`npm run build\`.

This report does not delete files. It separates high-confidence generated cleanup from medium-confidence archives and code review candidates.

## Summary

- Total scanned files: ${data.totalFiles}
- Total scanned size: ${formatBytes(data.totalBytes)}
- Static reachable files from app/server/package entries: ${data.reachableCount}
- High-confidence generated cleanup candidates: ${highGenerated.length}
- Generated/intermediate review candidates: ${mediumGenerated.length}
- Postal archive cache candidates: ${data.postalZipCandidates.length}
- Document archive candidates: ${data.documentArchiveCandidates.length}
- Code review candidates: ${data.codeReviewCandidates.length}

## App And Build Verification

- App URL: \`http://127.0.0.1:3000/\`
- Launch result: HTTP 200, title \`AGID • Absolute Grid Identity\`
- Launch screenshot: \`output/pdf/agid-app-launch-audit.png\`
- Build result: production build succeeded.
- Build warning to consider: \`src/services/GeocodingService.ts\` imports \`AsiaOceaniaService.ts\` and \`EastAsiaService.ts\` both statically and dynamically, preventing dynamic chunk separation.
- Build warning to consider: \`assets/main-*.js\` is approximately 4.55 MB raw / 1.54 MB gzip, so code/data splitting should be improved before heavy cleanup.

## Largest Top-Level Areas

| Area | Files | Size |
|---|---:|---:|
${topStats}

## Largest Files

| File | Size |
|---|---:|
${largest}

## High-Confidence Cleanup Candidates

These are reproducible or temporary artifacts. They are the safest cleanup class, but deletion should still be done after one final user approval.

| File | Size | Confidence | Reason |
|---|---:|---|---|
${tableRows(highGenerated)}

## Generated Or Intermediate Review Candidates

These may be useful as visual evidence or editing intermediates. Keep them if you want an audit trail; otherwise archive or regenerate on demand.

| File | Size | Confidence | Reason |
|---|---:|---|---|
${tableRows(mediumGenerated)}

## Postal Archive Cache Candidates

These are compressed postal-code source archives. Prefer keeping normalized/extracted data and a source manifest; archive the zips unless they are required for provenance or offline reprocessing.

| File | Size | Confidence | Reason |
|---|---:|---|---|
${tableRows(data.postalZipCandidates)}

## Document Archive Candidates

These are not app runtime inputs. They are evidence, drafts, verification notes, and addenda. They should usually be moved under an archive folder rather than deleted.

| File | Size | Confidence | Reason |
|---|---:|---|---|
${tableRows(data.documentArchiveCandidates, 120)}

## Code Review Candidates

These need human review before deletion. Static graph analysis cannot fully see variable dynamic imports, generated imports, CLI-only scripts, or intentionally manual scripts.

| File | Size | Confidence | Reason |
|---|---:|---|---|
${tableRows(data.codeReviewCandidates, 120)}

## Keep List

Do not remove these classes during the first cleanup pass:

- \`src/**\` files reached by the static app/server graph.
- \`public/agid-logo.png\`, \`public/agid-logo.jpg\`, and \`public/pwa-icon.svg\`, because PWA config references them.
- \`data/address_formats/**\`, \`data/countries/**\`, \`data/gis/**\`, and normalized postal text/JSON datasets unless a manifest proves they are superseded.
- Final manuscript PDFs: \`output/pdf/address-morphism-theory-full-ja.pdf\` and \`output/pdf/address-morphism-theory-full-en.pdf\`.
- Chapter verification notes until the final paper has absorbed their claims and citations.
- SDK output directories if the package is intended to publish SDKs.

## Recommended Cleanup Sequence

1. Delete or archive high-confidence generated artifacts: \`dist/**\`, \`tmp/**\`, \`*.pyc\`, and runtime logs.
2. Move document evidence into \`docs/archive/2026-06-verification/\` instead of deleting it.
3. Keep final PDFs and remove only paired HTML/PNG previews after the PDF is visually accepted.
4. Replace postal ZIP caches with a source manifest once extracted/normalized data is verified.
5. Fix the duplicated static/dynamic service imports and rerun \`npm run build\`.
6. Review the code candidates manually, then remove only after build and app smoke tests still pass.

## Method Notes

The static graph starts from \`index.html\`, \`embed.html\`, \`server.ts\`, \`vite.config.ts\`, and scripts declared in \`package.json\`. It follows static imports, dynamic imports with literal strings, re-exports, and \`new URL(..., import.meta.url)\`. It intentionally does not treat heuristic misses as automatic deletion authority.
`;
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.mkdirSync(path.dirname(jsonPath), { recursive: true });

const files = walk(root);
const filesByRel = new Map(files.map((file) => [rel(file), file]));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const textIndex = [];
for (const [relative, full] of filesByRel) {
  const text = readMaybeText(full);
  if (text !== null) textIndex.push({ relative, text });
}

const graph = buildReachableGraph(filesByRel, packageJson);
const generatedCandidates = findGeneratedCandidates(filesByRel);
const postalZipCandidates = findPostalZipCandidates(filesByRel);
const documentArchiveCandidates = findDocumentArchiveCandidates(filesByRel);
const codeReviewCandidates = findCodeReviewCandidates(filesByRel, graph.reachable, packageJson, textIndex);
const largestFiles = [...filesByRel.entries()]
  .map(([relative, full]) => ({ relative, bytes: sizeOf(full) }))
  .sort((a, b) => b.bytes - a.bytes);

const totalBytes = largestFiles.reduce((sum, item) => sum + item.bytes, 0);
const data = {
  totalFiles: files.length,
  totalBytes,
  reachableCount: graph.reachable.size,
  entries: graph.entries,
  topStats: topLevelStats(files),
  largestFiles,
  generatedCandidates,
  postalZipCandidates,
  documentArchiveCandidates,
  codeReviewCandidates,
};

fs.writeFileSync(reportPath, makeReport(data), 'utf8');
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

console.log(`Report: ${reportPath}`);
console.log(`JSON: ${jsonPath}`);
console.log(`Files: ${files.length}`);
console.log(`High-confidence generated candidates: ${generatedCandidates.filter((item) => item.confidence === 'high').length}`);
console.log(`Document archive candidates: ${documentArchiveCandidates.length}`);
console.log(`Code review candidates: ${codeReviewCandidates.length}`);
