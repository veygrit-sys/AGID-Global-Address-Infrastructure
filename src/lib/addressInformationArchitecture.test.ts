import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  getAddressInformationArchitectureConcept,
  getAddressInformationArchitectureConcepts,
  summarizeAddressInformationArchitecture,
  validateAddressInformationArchitecture,
} from './addressInformationArchitecture';

test('address information architecture catalog covers the core engineering concepts', () => {
  const concepts = getAddressInformationArchitectureConcepts();
  const ids = concepts.map(concept => concept.id);

  assert.deepEqual(ids, [
    'entity-resolution',
    'temporal-database',
    'event-sourcing',
    'crdt-vector-clock',
    'merkle-transparency-log',
    'bloom-cuckoo-filter',
    'inverted-index',
    'spatial-index',
    'cqrs',
    'cap-consistency',
    'state-machine',
    'access-control',
    'differential-privacy',
    'property-based-testing',
    'formal-verification',
  ]);
});

test('address information architecture validation prevents undocumented implemented claims', () => {
  const validation = validateAddressInformationArchitecture();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('address information architecture summary separates implemented, partial, and planned work', () => {
  const summary = summarizeAddressInformationArchitecture();

  assert.equal(summary.total, 15);
  assert.ok(summary.implemented >= 6);
  assert.ok(summary.partial >= 5);
  assert.ok(summary.planned >= 3);
  assert.equal(summary.privacyCritical, summary.total);
  assert.ok(summary.implementedConceptIds.includes('entity-resolution'));
  assert.ok(summary.implementedConceptIds.includes('spatial-index'));
  assert.ok(summary.implementedConceptIds.includes('crdt-vector-clock'));
  assert.ok(summary.partialConceptIds.includes('access-control'));
  assert.ok(summary.plannedConceptIds.includes('differential-privacy'));
  assert.ok(summary.highestPriorityNextSteps.some(step => /Merkle|accumulator|root/i.test(step)));
});

test('planned filters and differential privacy do not pretend to have production implementation refs', () => {
  const bloom = getAddressInformationArchitectureConcept('bloom-cuckoo-filter');
  const differentialPrivacy = getAddressInformationArchitectureConcept('differential-privacy');
  const propertyTesting = getAddressInformationArchitectureConcept('property-based-testing');

  assert.equal(bloom.status, 'planned');
  assert.deepEqual(bloom.implementationRefs, []);
  assert.match(bloom.privacySafeguards.join('\n'), /commitment|nullifier/i);

  assert.equal(differentialPrivacy.status, 'planned');
  assert.deepEqual(differentialPrivacy.implementationRefs, []);
  assert.match(differentialPrivacy.privacySafeguards.join('\n'), /noise|k-anonymity|coarsening/i);

  assert.equal(propertyTesting.status, 'planned');
  assert.match(propertyTesting.privacySafeguards.join('\n'), /synthetic|fuzzed/i);
});
