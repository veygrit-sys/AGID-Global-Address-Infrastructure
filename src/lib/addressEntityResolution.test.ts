import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveAddressEntities } from './addressEntityResolution';

test('address entity resolution merges equivalent address variants', () => {
  const result = resolveAddressEntities({
    domain: 'test:entity-resolution',
    primary: {
      candidateId: 'typed',
      source: 'pos',
      addressText: '100-0005 Tokyo Chiyoda Marunouchi 1-9-1',
      canonical: {
        country_code: 'JP',
        state: 'Tokyo',
        city: 'Chiyoda',
        road: 'Marunouchi',
        house_number: '1-9-1',
        postcode: '100-0005',
      },
      confidence: 0.92,
    },
    candidates: [{
      candidateId: 'postal',
      source: 'postal-api',
      canonical: {
        country_code: 'jp',
        state: 'Tokyo',
        city: 'Chiyoda',
        road: 'Marunouchi',
        house_number: '1-9-1',
        postcode: '1000005',
      },
      confidence: 0.96,
    }],
  });

  assert.equal(result.status, 'same-entity');
  assert.equal(result.decision, 'merge');
  assert.equal(result.clusters.length, 1);
  assert.equal(result.clusters[0].candidates.length, 2);
  assert.ok(result.confidence >= 0.9);
});

test('address entity resolution separates conflicting unit-level candidates', () => {
  const result = resolveAddressEntities({
    threshold: 0.78,
    strictUnitSeparation: true,
    primary: {
      candidateId: 'unit-101',
      canonical: {
        country_code: 'US',
        state: 'NY',
        city: 'New York',
        road: '5th Avenue',
        house_number: '350',
        building: 'Tower A 101',
        postcode: '10118',
      },
      confidence: 0.9,
    },
    candidates: [{
      candidateId: 'unit-902',
      canonical: {
        country_code: 'US',
        state: 'NY',
        city: 'New York',
        road: '5th Ave',
        house_number: '350',
        building: 'Tower A 902',
        postcode: '10118',
      },
      confidence: 0.9,
    }],
  });

  assert.notEqual(result.status, 'same-entity');
  assert.ok(result.edges.some(edge => edge.conflicts.includes('building-or-unit-conflict')));
});

test('address entity resolution avoids transitive over-merge through partial candidates', () => {
  const result = resolveAddressEntities({
    threshold: 0.78,
    primary: {
      candidateId: 'house-1',
      canonical: {
        country_code: 'GB',
        city: 'London',
        road: 'Baker Street',
        house_number: '1',
        postcode: 'NW16XE',
      },
      confidence: 0.9,
    },
    candidates: [
      {
        candidateId: 'partial-road',
        canonical: {
          country_code: 'GB',
          city: 'London',
          road: 'Baker St',
          postcode: 'NW16XE',
        },
        confidence: 0.82,
      },
      {
        candidateId: 'house-99',
        canonical: {
          country_code: 'GB',
          city: 'London',
          road: 'Baker Street',
          house_number: '99',
          postcode: 'NW16XE',
        },
        confidence: 0.9,
      },
    ],
  });

  assert.equal(result.status, 'ambiguous');
  assert.ok(result.clusters.length >= 2);
  assert.ok(result.edges.some(edge => edge.conflicts.includes('house-number-conflict')));
});

test('address entity resolution uses commitments without leaking raw AGID values', () => {
  const result = resolveAddressEntities({
    domain: 'delivery:private',
    primary: {
      candidateId: 'qr-scan',
      agid: 'ML01R1A0ZTR4',
      addressReferenceCommitment: '0xADDRESSREF',
      confidence: 0.5,
    },
    candidates: [{
      candidateId: 'registry',
      agid: 'ML01R1A0ZTR4',
      addressReferenceCommitment: '0xaddressref',
      confidence: 0.5,
    }],
  });

  assert.equal(result.status, 'same-entity');
  assert.equal(result.privacy.rawAgidStored, false);
  assert.doesNotMatch(JSON.stringify(result), /ML01R1A0ZTR4/);
});
