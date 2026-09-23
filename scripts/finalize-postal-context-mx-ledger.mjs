import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const implementationCommit = process.argv[2];
if (!/^[0-9a-f]{40}$/u.test(implementationCommit ?? '')) {
  throw new Error('usage: node scripts/finalize-postal-context-mx-ledger.mjs <40-hex implementation commit>');
}

const root = resolve(import.meta.dirname, '..');
const ledgerPath = resolve(root, 'docs/postal-context-m2-rollout.json');
const manifestPath = resolve(root, 'data/postal_country_packs/mx/postal-context/repository-manifest.json');
const profilePath = resolve(root, 'data/postal_country_packs/mx/postal-context/source-profile.json');
const reportPath = 'reports/postal-context-m2/mx-current-postal-polygons-2026-09-01.json';
const validationPath = 'reports/postal-context-m2/mx-validation-2026-09-01.json';
const countryDocPath = 'docs/postal-context-mexico-m2.md';
const descriptorPath = 'data/postal_country_packs/mx/postal-context/m2/descriptor.json';
const graphPath = 'data/postal_country_packs/mx/postal-context/m2/graph.json';
const geometryPath = 'data/postal_country_packs/mx/postal-context/m2/geometry.json';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const bytes = path => readFileSync(resolve(root, path));
const digest = body => `sha256:${createHash('sha256').update(body).digest('hex')}`;
const artifact = path => {
  const body = bytes(path);
  return {
    url: `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${implementationCommit}/${path}`,
    digest: digest(body),
    bytes: body.byteLength,
  };
};

const ledger = readJson(ledgerPath);
const manifest = readJson(manifestPath);
const profile = readJson(profilePath);
const descriptor = readJson(resolve(root, descriptorPath));
const mx = ledger.countries.find(country => country.countryCode === 'MX');
if (!mx) throw new Error('MX ledger entry is missing');
if (mx.status !== 'pending' || mx.attempts !== 0) {
  throw new Error(`MX must be pending with zero attempts, got ${mx.status}/${mx.attempts}`);
}

const m2Definition = manifest.promotion.stages.find(
  stage => stage.id === manifest.promotion.current_stage,
);
if (!m2Definition?.id.startsWith('M2_')) throw new Error('MX M2 definition is missing from manifest');

const reportDigest = digest(bytes(reportPath));
const validationDigest = digest(bytes(validationPath));
const packageDigest = `sha256:${profile.dataset.package_sha256}`;

Object.assign(mx, {
  declaredStage: m2Definition.id,
  m2Definition,
  status: 'm2_verified',
  attempts: 1,
  lastAttempt: {
    observedAt: '2026-09-01T14:44:58.852Z',
    completedAt: '2026-09-02T00:00:00.000+09:00',
    outcome: 'm2_verified',
    report: reportPath,
    reportDigest,
    engineeringReport: validationPath,
    engineeringReportDigest: validationDigest,
  },
  blocker: null,
  evidence: {
    criterionId: m2Definition.id,
    criterionSatisfied: true,
    synthetic: false,
    scope: 'All 35,898 distinct five-digit codes in the latest published official SEPOMEX 2025 national spatial release map one-to-one to 35,898 official state-SHP Polygon features. AGID publishes topology-valid simplified Polygon/MultiPolygon geometry only as derived display context with 250 m conservative accuracy. No address, building, point, route, P.O. box, organization, customer, person, parcel, cadastral fact, land right or invented area is included.',
    sources: [
      {
        url: profile.dataset.api_url,
        digest: packageDigest,
        version: `Official datos.gob.mx CKAN metadata modified ${profile.dataset.package_metadata_modified}; 32 state SHP resources titled 2025; source DBF date 2026-01-05; CC BY 4.0`,
        observedAt: '2026-09-01T14:44:58.852Z',
        termsUrl: profile.dataset.api_url,
        termsDigest: packageDigest,
        rightsReviewed: true,
      },
    ],
    artifacts: [
      artifact(descriptorPath),
      artifact(graphPath),
      artifact(geometryPath),
      artifact(reportPath),
      artifact(validationPath),
      artifact(countryDocPath),
    ],
    validation: {
      passed: 177,
      failed: 0,
      command: 'MX repository/API targeted 6/6; shared Postal Context runtime 162/162; shared postal-area UI 9/9; TypeScript no-emit, strict topology parser, JSON and git diff checks; clean end-to-end rebuild reproduced the fixed descriptor digest',
      reportDigest: validationDigest,
    },
    runtime: {
      descriptorDigest: digest(bytes(descriptorPath)),
      verificationCommand: 'start actual app and Playwright Chromium; country MX plus 06000; actual Postal Context API HTTP 200; one real derived Polygon; visually inspect bounds fit, opacity-0.22 translucent fill, opacity-0.95 width-3 outline and visible background map; DOM code/type/provenance/source/date/confidence; clear; MX plus 01000 API 200 and re-fit; deterministic loading/no-match/multiple/API-failure/invalid-geometry contracts; in-app browser ACL bootstrap failed twice and is not claimed',
    },
  },
});

if (mx.evidence.runtime.descriptorDigest !== `sha256:${profile.validation.descriptor_sha256}`) {
  throw new Error('descriptor digest does not match source profile');
}
if (descriptor.artifacts[0].recordCounts.assertions !== 35898) {
  throw new Error('unexpected MX assertion count');
}

writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ countryCode: 'MX', status: mx.status, implementationCommit }, null, 2));
