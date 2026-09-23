import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const ledger = JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json', root), 'utf8'));
const ch = ledger.countries.find((country) => country.countryCode === 'CH');
const cy = ledger.countries.find((country) => country.countryCode === 'CY');
const manifest = JSON.parse(readFileSync(new URL('data/postal_country_packs/ch/postal-context/repository-manifest.json', root), 'utf8'));
const digest = (path) => `sha256:${createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex')}`;

test('CH is evidence-verified under its real PLZO app-visualization criterion', () => {
  assert.equal(ch.status, 'm2_verified');
  assert.equal(ch.attempts, 1);
  assert.equal(ch.m2Definition.id, 'M2_current_swisstopo_plzo_postal_area_visualization');
  assert.equal(manifest.promotion.stages.find((stage) => stage.id.startsWith('M2')).id, ch.m2Definition.id);
  assert.equal(ch.evidence.criterionId, ch.m2Definition.id);
  assert.equal(ch.evidence.criterionSatisfied, true);
  assert.equal(ch.evidence.synthetic, false);
});

test('CH reports, descriptor and published artifacts are digest-pinned', () => {
  assert.equal(digest(ch.lastAttempt.report), ch.lastAttempt.reportDigest);
  assert.equal(digest(ch.lastAttempt.engineeringReport), ch.lastAttempt.engineeringReportDigest);
  assert.equal(digest('data/postal_country_packs/ch/postal-context/m2/descriptor.json'), ch.evidence.runtime.descriptorDigest);
  assert.equal(ch.evidence.artifacts.length, 3);
  assert.ok(ch.evidence.artifacts.every((artifact) => artifact.url.includes('/blob/0205bd986bb39632b88c5b68e53f62caa8693521/')));
});

test('CH source rights and real app path are explicit and Cyprus is next', () => {
  assert.equal(ch.evidence.sources[0].rightsReviewed, true);
  assert.equal(ch.evidence.validation.passed, 239);
  assert.equal(ch.evidence.validation.failed, 0);
  assert.match(ch.evidence.runtime.verificationCommand, /API lookup CH\/1000.*bounds fit.*clear\/re-search/i);
  assert.equal(cy.status, 'pending');
  assert.equal(cy.region, 'europe');
});
