import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getFrontendRelationships,
  getFrontendSurfaces,
  renderFrontendEcosystemMermaid,
  summarizeFrontendEcosystem,
  validateFrontendEcosystem,
} from './frontendEcosystem';

test('catalogs required frontend surfaces and routes', () => {
  const surfaces = getFrontendSurfaces();
  const ids = surfaces.map(surface => surface.id);
  const summary = summarizeFrontendEcosystem();

  assert.ok(ids.includes('map-workspace'));
  assert.ok(ids.includes('address-registration'));
  assert.ok(ids.includes('agid-address-element'));
  assert.ok(ids.includes('pos-terminal'));
  assert.ok(ids.includes('address-portal'));
  assert.ok(ids.includes('address-dashboard'));
  assert.ok(ids.includes('address-review-console'));
  assert.ok(ids.includes('developer-console'));
  assert.ok(ids.includes('evidence-vault'));
  assert.ok(ids.includes('settings-and-policy'));
  assert.deepEqual(summary.requiredRoutes.sort(), ['/', '/dashboard', '/portal', '/pos']);
});

test('covers core frontend capabilities across surfaces', () => {
  const coverage = summarizeFrontendEcosystem().capabilityCoverage;

  assert.ok(coverage['search-and-resolve'].includes('map-workspace'));
  assert.ok(coverage['language-tabs'].includes('map-workspace'));
  assert.ok(coverage['language-tabs'].includes('settings-and-policy'));
  assert.ok(coverage['address-intent'].includes('agid-address-element'));
  assert.ok(coverage['qr-nfc-scan'].includes('pos-terminal'));
  assert.ok(coverage['portal-consent'].includes('address-portal'));
  assert.ok(coverage['review-and-dispute'].includes('address-review-console'));
  assert.ok(coverage['audit-report'].includes('address-dashboard'));
  assert.ok(coverage['privacy-mode'].length >= 5);
});

test('models frontend relationships with privacy-safe edges', () => {
  const relationships = getFrontendRelationships();

  assert.ok(relationships.some(edge =>
    edge.from === 'pos-terminal' &&
    edge.to === 'address-review-console' &&
    edge.relation === 'opens-review'
  ));
  assert.ok(relationships.some(edge =>
    edge.from === 'settings-and-policy' &&
    edge.to === 'agid-address-element' &&
    edge.sensitiveDataPolicy === 'none'
  ));
  assert.ok(relationships.some(edge =>
    edge.from === 'evidence-vault' &&
    edge.to === 'address-review-console' &&
    edge.sensitiveDataPolicy === 'encrypted-only'
  ));
});

test('renders a mermaid ecosystem diagram', () => {
  const diagram = renderFrontendEcosystemMermaid();

  assert.match(diagram, /^flowchart LR/);
  assert.match(diagram, /AGID Map Workspace/);
  assert.match(diagram, /AGID POS Terminal/);
  assert.match(diagram, /Address Dashboard/);
  assert.match(diagram, /Resolver \/ Registry \/ Adapter Layer/);
});

test('validates frontend ecosystem catalog', () => {
  const result = validateFrontendEcosystem();

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.includes('ephemeral-plaintext-relationship:map-workspace->address-registration'));
});
