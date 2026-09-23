import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'ResearchDesignHubScreen.tsx'), 'utf8');

test('Research / Design Hub connects the research app surfaces into one workflow', () => {
  assert.match(source, /RESEARCH_SURFACE_IDS/);
  assert.match(source, /evidence-vault/);
  assert.match(source, /postal-zone-designer/);
  assert.match(source, /open-locker-pudo-simulator/);
  assert.match(source, /drone-locker-ops/);
  assert.match(source, /developer-console/);
  assert.match(source, /agid-address-element/);
  assert.match(source, /WORKFLOW_STEPS/);
});

test('Research / Design Hub includes search, mode filters, and publish gates', () => {
  assert.match(source, /normalizedQuery/);
  assert.match(source, /setQuery/);
  assert.match(source, /setMode/);
  assert.match(source, /MODE_OPTIONS/);
  assert.match(source, /QUALITY_GATES/);
  assert.match(source, /No raw address/);
  assert.match(source, /実住所を表示しない/);
  assert.match(source, /Source and license traceability/);
  assert.match(source, /SDK \/ API conformance path/);
  assert.match(source, /証跡を集める/);
  assert.match(source, /公開準備をする/);
});

test('Research / Design Hub presents claim maturity and executable evidence boundaries', () => {
  assert.match(source, /CLAIM_MATURITY/);
  assert.match(source, /RESEARCH_CLAIMS/);
  assert.match(source, /Executable evidence matrix/);
  assert.match(source, /Address Morphism Theory/);
  assert.match(source, /AGID \/ AOID Spec/);
  assert.match(source, /Secure Address QR/);
  assert.match(source, /ZK Address Predicates/);
  assert.match(source, /ZK-ready envelope only/);
  assert.match(source, /production cryptographic ZK needs audited circuits/);
  assert.match(source, /全世界すべての住所制度で常に正しいとは主張しない/);
});

test('Research / Design Hub links paper output to implementation and artifacts', () => {
  assert.match(source, /PAPER_TO_IMPLEMENTATION/);
  assert.match(source, /RESEARCH_ARTIFACTS/);
  assert.match(source, /Paper to implementation/);
  assert.match(source, /Field pilot/);
  assert.match(source, /Human review before production/);
  assert.match(source, /AMT paper/);
  assert.match(source, /Conformance/);
  assert.match(source, /Evidence Vault/);
  assert.match(source, /Postal Zones/);
});

test('Research / Design Hub keeps navigation data-driven and avoids raw address fields', () => {
  assert.match(source, /getAppSurfaces/);
  assert.match(source, /getAppSurfaceCopy/);
  assert.match(source, /goTo\(surface\.route\)/);
  assert.doesNotMatch(source, /rawAddress\s*:/);
  assert.doesNotMatch(source, /recipientSecret\s*:/);
  assert.doesNotMatch(source, /privateKey\s*:/);
});
