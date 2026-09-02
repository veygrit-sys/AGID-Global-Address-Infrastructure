import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

const ledgerPath = 'docs/postal-context-m2-rollout.json';
const evidenceCommit = 'baf75c19ad3ffd50bd6c86e7f6f2874b70aa409d';
const observedAt = '2026-09-02T18:44:27.714Z';
const completedAt = '2026-09-02T19:05:00.000Z';
const sourceReport = 'reports/postal-context-m2/ac-current-whole-territory-2026-09-03.json';
const engineeringReport = 'reports/postal-context-m2/ac-validation-2026-09-03.json';
const browserReport = 'reports/postal-context-m2/ac-browser-validation-2026-09-03.json';
const countryReport = 'docs/postal-context-ascension-island-m2.md';
const digest = path => `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
const artifact = path => ({
  url: `https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure/blob/${evidenceCommit}/${path.replaceAll('\\', '/')}`,
  digest: digest(path), bytes: statSync(path).size,
});

const manifestPath = 'data/postal_country_packs/ac/postal-context/repository-manifest.json';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stage = manifest.promotion.stages.find(item => /^M2(?:_|$)/.test(item.id));
if (!stage) throw new Error('missing-ac-m2-definition');
const artifactPaths = [
  'data/postal_country_packs/ac/postal-context/m2/descriptor.json',
  'data/postal_country_packs/ac/postal-context/m2/graph.json',
  'data/postal_country_packs/ac/postal-context/m2/geometry.json',
  manifestPath,
  'data/postal_country_packs/ac/postal-context/source-profile.json',
  'data/postal_country_packs/ac/postal-context/M2-SOURCE-NOTICE.md',
  sourceReport, engineeringReport, browserReport,
  'reports/postal-context-m2/ac-browser-visual-2026-09-03.png',
  'reports/postal-context-m2/ac-browser-cleared-2026-09-03.png',
  countryReport,
];

const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const index = ledger.countries.findIndex(item => item.countryCode === 'AC');
if (index < 0) throw new Error('missing-ac-ledger-entry');
const previous = ledger.countries[index];
if (previous.status !== 'pending' || previous.attempts !== 0) throw new Error('unexpected-ac-ledger-state');
ledger.countries[index] = {
  ...previous,
  manifest: manifestPath,
  declaredStage: stage.id,
  m2Definition: { id: stage.id, definition: stage.definition },
  status: 'm2_verified', attempts: 1,
  lastAttempt: {
    observedAt, completedAt, outcome: 'm2_verified',
    report: sourceReport, reportDigest: digest(sourceReport),
    engineeringReport, engineeringReportDigest: digest(engineeringReport),
    browserReport, browserReportDigest: digest(browserReport),
  },
  blocker: null,
  evidence: {
    criterionId: stage.id, criterionSatisfied: true, synthetic: false,
    scope: 'The current August 2026 UPU table establishes ASCN 1ZZ as the single postcode for the whole Ascension territory. Fixed CC BY 4.0 geoBoundaries SHN ADM0 data is used only as a geometry provenance container: the reproducible transform selects source parts 44-46, preserves all 1,261 positions and 96.58210569103102 square kilometres exactly, and emits two independently valid derived MultiPolygons. It is not an official postal, legal, survey, cadastral or delivery boundary. AC identity is unchanged; Saint Helena and Tristan da Cunha are excluded. No address, building, parcel, recipient, customer, deliverability or land-right row is published.',
    sources: [
      {
        url: 'https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf',
        digest: 'sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d',
        version: 'Universal POST*CODE DataBase, August 2026; AC lists ASCN 1ZZ as the single code for the whole territory',
        observedAt, termsUrl: 'https://www.upu.int/en/legal/copyright',
        termsDigest: 'sha256:8e8eac3afccd5013e9c5f984f99ce7e2c41e9e43758f602543c4a5a5da9fe283', rightsReviewed: true,
      },
      {
        url: 'https://www.upu.int/en/universal-postal-union/about-upu/member-countries?ccid=48&csid=-1',
        digest: 'sha256:3c629d24e62ee49011443fe7837aa6e82d01d02c885cafd5a0b5c0e9721aa2de',
        version: 'Current UPU member record for AC and Ascension Island Post Office and Philatelic Bureau',
        observedAt, termsUrl: 'https://www.upu.int/en/legal/copyright',
        termsDigest: 'sha256:8e8eac3afccd5013e9c5f984f99ce7e2c41e9e43758f602543c4a5a5da9fe283', rightsReviewed: true,
      },
      {
        url: 'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09592ced973a3448cf66b6100b741b64c0d/releaseData/gbOpen/SHN/ADM0/geoBoundaries-SHN-ADM0.geojson',
        digest: 'sha256:94c9e525d8f9c12fc1f643f8c61b5f03323587e10d01b8c3109269b4349aa27e',
        version: 'geoBoundaries gbOpen SHN-ADM0-31036641; boundary year 2021; build 2023-12-12; commit 9469f09592ced973a3448cf66b6100b741b64c0d',
        observedAt, termsUrl: 'https://creativecommons.org/licenses/by/4.0/legalcode.en',
        termsDigest: 'sha256:6d55b998ed5c54f43426d059a8c549ed58a3321e5463e6a6af1c6b56ab78c333', rightsReviewed: true,
      },
    ],
    artifacts: artifactPaths.map(artifact),
    validation: {
      passed: 20, failed: 0,
      command: 'AC repository, topology, runtime API, normalization, map conversion, fit, translucent paint, clear, re-search and invalid-geometry tests 20/20; descriptor/graph/geometry byte-identical second build; JSON, script syntax and git diff checks; actual isolated app capabilities ready and live API HTTP 200; deterministic Chromium actual-app path verified detailed IDs and screenshots after in-app Browser Windows ACL failure',
      reportDigest: digest(engineeringReport),
    },
    runtime: {
      descriptorDigest: 'sha256:6b0e08e1c8e461e7fee847cc06ea13e5f0f8abc1cb9a5a2ade8bd258c67537e1',
      verificationCommand: 'start actual app with pinned AC descriptor; search country AC plus full-width ASCN 1ZZ; live /api/v1/postal/AC/ASCN%201ZZ HTTP 200; two real derived MultiPolygons; bounds fit; opacity-0.22 fill and opacity-0.95 width-3 outline over mounted background map; display postal, country, geometry, assertion, source, licence, date, confidence, digest and release IDs; clear removes; compact ASCN1ZZ re-search restores; invalid code and geometry fail closed; no address/building inference',
    },
  },
};
writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ countryCode: 'AC', status: 'm2_verified', evidenceCommit, artifactCount: artifactPaths.length }, null, 2));
