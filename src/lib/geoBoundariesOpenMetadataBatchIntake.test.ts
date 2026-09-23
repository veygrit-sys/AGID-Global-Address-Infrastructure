import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  GEOBOUNDARIES_OPEN_METADATA_BATCH_INTAKE_VERSION,
  buildGeoBoundariesOpenMetadataBatchIntake,
  type GeoBoundariesOpenMetadataRecord,
} from './geoBoundariesOpenMetadataBatchIntake';

const approvedMetadata: GeoBoundariesOpenMetadataRecord = {
  countryCode: 'DE',
  administrativeLevel: 'ADM1',
  metadataUrl: 'https://www.geoboundaries.org/api/current/gbOpen/DEU/ADM1/',
  boundaryLicense: 'CC BY 4.0',
  licenseSourceUrl: 'https://example.invalid/de/license',
  sourceDataUpdateDate: '2026-07-20T00:00:00Z',
  buildDate: '2026-07-21T00:00:00Z',
  reviewedAt: '2026-07-25T00:00:00Z',
  reviewBy: '2026-08-25T00:00:00Z',
};

test('processes multiple country metadata records in one privacy-safe batch', () => {
  const result = buildGeoBoundariesOpenMetadataBatchIntake({
    countryCodes: ['DE', 'AU', 'DE'],
    metadata: [
      approvedMetadata,
      {
        ...approvedMetadata,
        countryCode: 'AU',
        administrativeLevel: 'ADM2',
        metadataUrl: 'https://www.geoboundaries.org/api/current/gbOpen/AUS/ADM2/',
        boundaryLicense: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      },
    ],
    now: '2026-07-25T12:00:00Z',
  });

  assert.equal(GEOBOUNDARIES_OPEN_METADATA_BATCH_INTAKE_VERSION, 'geoboundaries-open-metadata-batch-intake-v1');
  assert.deepEqual(result.countryCodes, ['AU', 'DE']);
  assert.deepEqual(result.gates, [
    {
      countryCode: 'AU',
      status: 'approved-for-synthetic-administrative-evaluation',
      reason: 'Every supplied open-source metadata record passed explicit CC BY 4.0, version, scope, correction, and synthetic-holdout gates.',
      sourceIds: ['geoboundaries-gbopen-au-adm2'],
    },
    {
      countryCode: 'DE',
      status: 'approved-for-synthetic-administrative-evaluation',
      reason: 'Every supplied open-source metadata record passed explicit CC BY 4.0, version, scope, correction, and synthetic-holdout gates.',
      sourceIds: ['geoboundaries-gbopen-de-adm1'],
    },
  ]);
  assert.equal(result.index.sources.length, 2);
  assert.equal(result.index.syntheticAdministrativeKeys.length, 2);
  assert.equal(
    result.index.sources.find(source => source.countryCode === 'DE')?.reuseLicense,
    'CC BY 4.0',
  );
  assert.equal(
    result.index.sources.find(source => source.countryCode === 'DE')?.reuseTermsUrl,
    'https://example.invalid/de/license',
  );
  assert.equal(result.postalLookupEnabled, false);
  assert.equal(result.addressValidationEnabled, false);
  assert.equal(result.deliveryClaimsEnabled, false);
});

test('does not admit a batch source at its exact review deadline', () => {
  const deadline = '2026-08-25T00:00:00Z';
  const result = buildGeoBoundariesOpenMetadataBatchIntake({
    countryCodes: ['DE'],
    metadata: [{ ...approvedMetadata, reviewBy: deadline }],
    now: deadline,
  });

  assert.deepEqual(result.gates, [{
    countryCode: 'DE',
    status: 'blocked',
    reason: 'current-review-required',
    sourceIds: [],
  }]);
  assert.equal(result.index.sources.length, 0);
});

test('keeps source records blocked when the individual license evidence is not explicit CC BY 4.0', () => {
  const result = buildGeoBoundariesOpenMetadataBatchIntake({
    countryCodes: ['DE', 'FR', 'JP'],
    metadata: [
      { ...approvedMetadata, boundaryLicense: 'ODbL' },
      {
        ...approvedMetadata,
        countryCode: 'FR',
        boundaryLicense: 'Creative Commons Attribution 4.0 International',
      },
    ],
    now: '2026-07-25T12:00:00Z',
  });

  assert.deepEqual(result.gates, [
    {
      countryCode: 'DE',
      status: 'blocked',
      reason: 'explicit-cc-by-4-license-required',
      sourceIds: [],
    },
    {
      countryCode: 'FR',
      status: 'approved-for-synthetic-administrative-evaluation',
      reason: 'Every supplied open-source metadata record passed explicit CC BY 4.0, version, scope, correction, and synthetic-holdout gates.',
      sourceIds: ['geoboundaries-gbopen-fr-adm1'],
    },
    {
      countryCode: 'JP',
      status: 'blocked',
      reason: 'country-specific-metadata-not-supplied',
      sourceIds: [],
    },
  ]);
});

test('rejects geometric or address payloads before a batch can be evaluated', () => {
  assert.throws(() => buildGeoBoundariesOpenMetadataBatchIntake({
    countryCodes: ['DE'],
    metadata: [{ ...approvedMetadata, geometry: 'must-not-be-accepted' } as unknown as GeoBoundariesOpenMetadataRecord],
    now: '2026-07-25T12:00:00Z',
  }), /disallowed field geometry/);
});
