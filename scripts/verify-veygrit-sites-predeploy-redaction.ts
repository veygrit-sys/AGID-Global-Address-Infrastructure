import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { buildVeygritSitesBridge } from '../src/lib/veygritSitesBridge';

type Finding = {
  file: string;
  ruleId: string;
};

const bridge = buildVeygritSitesBridge();
const siteAppRoot = join(bridge.codexThread.localRoot, 'work', 'veygrit-app');
const sourceRoot = join(siteAppRoot, 'src');

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }
    return /\.(?:mjs|cjs|js|jsx|ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function reportPath(file: string): string {
  return relative(siteAppRoot, file).split(sep).join('/');
}

const checkedFiles = existsSync(sourceRoot) ? collectSourceFiles(sourceRoot).sort() : [];

const rules: Array<{ id: string; pattern: RegExp }> = [
  { id: 'demo-address-body-literal', pattern: /\baddress:\s*['"][^'"]+/ },
  { id: 'demo-phone-literal', pattern: /\bphone:\s*['"][^'"]+/ },
  { id: 'demo-recipient-field-literal', pattern: /\brecipient:\s*['"][^'"]+/ },
  { id: 'demo-profile-qr-filename', pattern: /veygrit-[a-z0-9-]+-qr\.png/i },
];

const findings: Finding[] = [];

if (!existsSync(sourceRoot)) {
  findings.push({ file: 'src', ruleId: 'missing-redaction-source-root' });
}

if (existsSync(sourceRoot) && checkedFiles.length === 0) {
  findings.push({ file: 'src', ruleId: 'missing-redaction-source-files' });
}

for (const file of checkedFiles) {
  if (!existsSync(file)) {
    findings.push({ file: reportPath(file), ruleId: 'missing-redaction-target' });
    continue;
  }

  const source = readFileSync(file, 'utf8');
  for (const rule of rules) {
    if (rule.pattern.test(source)) {
      findings.push({ file: reportPath(file), ruleId: rule.id });
    }
  }
}

const findingsByRule = findings.reduce<Record<string, number>>((counts, finding) => {
  counts[finding.ruleId] = (counts[finding.ruleId] ?? 0) + 1;
  return counts;
}, {});

if (findings.length > 0) {
  console.error(JSON.stringify({
    status: 'blocked',
    verifier: 'verify-veygrit-sites-predeploy-redaction',
    checkedFiles: checkedFiles.map(reportPath),
    findingsByRule,
    remediation: 'Replace local demo address/contact/profile literals with ref-only fixtures before Sites save or deploy.',
  }));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'verify-veygrit-sites-predeploy-redaction',
  checkedFiles: checkedFiles.map(reportPath),
  findingsByRule,
}));
