import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

type RequiredFile = {
  path: string;
  mustContain: RegExp[];
};

const root = process.cwd();

const requiredFiles: RequiredFile[] = [
  {
    path: 'README.md',
    mustContain: [/AGID/i, /No raw address by default/i, /npm run verify:oss-launch/i],
  },
  {
    path: 'LICENSE',
    mustContain: [/MIT/i],
  },
  {
    path: 'LICENSE_POLICY.md',
    mustContain: [/license/i, /SDK/i],
  },
  {
    path: 'DATA_LICENSES.md',
    mustContain: [/data/i, /license/i],
  },
  {
    path: 'SECURITY.md',
    mustContain: [/No raw address by default/i, /What Not To Send/i],
  },
  {
    path: 'CONTRIBUTING.md',
    mustContain: [/Pull Requests/i, /SDKs spec-driven/i],
  },
  {
    path: 'GOVERNANCE.md',
    mustContain: [/Project Roles/i, /Security And Privacy Veto/i, /Repository Split Policy/i],
  },
  {
    path: 'docs/repository-owner-routing.md',
    mustContain: [
      /dawnportinfo-design/,
      /veygrit-sys/,
      /veygrit-commercial-products/,
      /does not claim production readiness/i,
      /raw address/i,
    ],
  },
  {
    path: 'ROADMAP.md',
    mustContain: [/Phase 0/i, /Specification And SDK/i, /Country Packs/i],
  },
  {
    path: 'SUPPORT.md',
    mustContain: [/Do Not Post Private Data/i, /Security Reports/i],
  },
  {
    path: '.github/pull_request_template.md',
    mustContain: [/Privacy And Security/i, /Verification/i],
  },
  {
    path: '.github/ISSUE_TEMPLATE/bug_report.yml',
    mustContain: [/synthetic or redacted data/i, /Privacy check/i],
  },
  {
    path: '.github/ISSUE_TEMPLATE/feature_request.yml',
    mustContain: [/Open-source mode/i, /raw address data/i],
  },
  {
    path: '.github/ISSUE_TEMPLATE/security_boundary.yml',
    mustContain: [/Security\/privacy boundary/i, /Safety confirmation/i],
  },
  {
    path: '.github/ISSUE_TEMPLATE/config.yml',
    mustContain: [/blank_issues_enabled: false/i, /Security or privacy report/i],
  },
];

const forbiddenPublicFixturePatterns = [
  /Tokyo Station 1-9-1/i,
  /1-1 Chiyoda/i,
  /Private Receiver/i,
];

const errors: string[] = [];

for (const file of requiredFiles) {
  const absolute = path.join(root, file.path);
  if (!existsSync(absolute)) {
    errors.push(`missing:${file.path}`);
    continue;
  }

  const text = readFileSync(absolute, 'utf8');
  for (const pattern of file.mustContain) {
    if (!pattern.test(text)) {
      errors.push(`missing-content:${file.path}:${pattern}`);
    }
  }
}

for (const file of requiredFiles) {
  if (!existsSync(path.join(root, file.path))) continue;
  const text = readFileSync(path.join(root, file.path), 'utf8');
  for (const pattern of forbiddenPublicFixturePatterns) {
    if (pattern.test(text)) {
      errors.push(`unsafe-public-fixture-text:${file.path}:${pattern}`);
    }
  }
}

if (errors.length > 0) {
  console.error('[oss-repository-readiness] failed');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[oss-repository-readiness] repository public entrypoints are present');
