import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getUnbuiltAppBuildOrder,
  getUnbuiltAppConcept,
  getUnbuiltAppConcepts,
  renderUnbuiltAppConceptsMermaid,
  summarizeUnbuiltAppConcepts,
  validateUnbuiltAppConcepts,
} from './unbuiltAppConcepts';

test('catalogs unfinished and immature app concepts', () => {
  const concepts = getUnbuiltAppConcepts();
  const ids = concepts.map(concept => concept.id);
  const summary = summarizeUnbuiltAppConcepts();

  assert.equal(summary.total, 10);
  assert.equal(summary.partial, 5);
  assert.equal(summary.planned, 4);
  assert.equal(summary.future, 1);
  assert.equal(summary.p0, 5);
  assert.ok(ids.includes('portal-maturity'));
  assert.ok(ids.includes('console-dashboard-maturity'));
  assert.ok(ids.includes('review-console'));
  assert.ok(ids.includes('evidence-vault'));
  assert.ok(ids.includes('developer-platform'));
  assert.ok(ids.includes('field-handoff-app'));
  assert.ok(ids.includes('carrier-label-settlement'));
});

test('keeps Portal, Field Handoff, and Settings as high-priority maturity work', () => {
  const p0Ids = getUnbuiltAppBuildOrder()
    .filter(concept => concept.priority === 'P0')
    .map(concept => concept.id);

  assert.ok(p0Ids.includes('portal-maturity'));
  assert.ok(p0Ids.includes('field-handoff-app'));
  assert.ok(p0Ids.includes('settings-policy-center'));
  assert.ok(p0Ids.includes('review-console'));
});

test('keeps open-source baselines before paid operations', () => {
  for (const concept of getUnbuiltAppConcepts()) {
    assert.ok(concept.openSourceBaseline.length > 0);
    assert.ok(concept.paidOnlyWhen.length > 0);
    assert.match(concept.firstMilestone, /\S/);
  }

  assert.match(
    getUnbuiltAppConcept('evidence-vault')?.openSourceBaseline.join(' ') ?? '',
    /local file import/i,
  );
  assert.match(
    getUnbuiltAppConcept('developer-platform')?.paidOnlyWhen.join(' ') ?? '',
    /hosted API key operations/i,
  );
});

test('sets privacy boundaries for sensitive app concepts', () => {
  const portal = getUnbuiltAppConcept('portal-maturity');
  const dashboard = getUnbuiltAppConcept('console-dashboard-maturity');
  const field = getUnbuiltAppConcept('field-handoff-app');

  assert.match(portal?.privacyRules.join(' ') ?? '', /Do not display raw address/i);
  assert.match(dashboard?.privacyRules.join(' ') ?? '', /Reject request bodies/i);
  assert.match(field?.privacyRules.join(' ') ?? '', /High-risk mode uses AGID-S/i);
});

test('renders unbuilt app concept relationship diagram', () => {
  const diagram = renderUnbuiltAppConceptsMermaid();

  assert.match(diagram, /^flowchart LR/);
  assert.match(diagram, /Settings and Policy Center/);
  assert.match(diagram, /Field Handoff App/);
  assert.match(diagram, /Drone Delivery Evidence and Reachability API/);
});

test('validates unfinished app concept catalog', () => {
  const validation = validateUnbuiltAppConcepts();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
