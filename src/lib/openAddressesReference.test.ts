import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateAddressWithOpenSourceRules } from './addressValidation';
import { matchOpenAddressesReference } from './openAddressesReference';

test('matches OpenAddresses reference records without adding a package dependency', () => {
  const match = matchOpenAddressesReference(
    {
      country_code: 'us',
      state: 'CA',
      city: 'Cupertino',
      road: 'Infinite Loop',
      house_number: '1',
      postcode: '95014',
    },
    [
      {
        source: 'openaddresses-us-ca',
        countryCode: 'US',
        state: 'CA',
        city: 'Cupertino',
        street: 'Infinite Loop',
        houseNumber: '1',
        postcode: '95014',
        lat: 37.33182,
        lon: -122.03118,
      },
    ]
  );

  assert.equal(match?.source, 'openaddresses-us-ca');
  assert.equal(match?.confidence, 0.95);
});

test('raises validation evidence when an OpenAddresses reference matches', () => {
  const result = validateAddressWithOpenSourceRules(
    {
      country_code: 'us',
      state: 'CA',
      city: 'Cupertino',
      road: 'Infinite Loop',
      house_number: '1',
      postcode: '95014',
    },
    {
      countryCode: 'US',
      name: 'United States',
      native: {
        addressFormat: '{{houseNumber}} {{street}}\n{{city}}, {{state}} {{postcode}}',
        fields: [
          { key: 'street', required: true },
          { key: 'city', required: true },
          { key: 'state', required: true },
          { key: 'postcode', required: true },
        ],
      },
      postalCode: { regex: '^\\d{5}([ \\-]\\d{4})?$', source: 'libaddressinput' },
    },
    ['nominatim'],
    { referenceMatches: [{ source: 'openaddresses-us-ca', confidence: 0.95 }] }
  );

  assert.equal(result.status, 'verified');
  assert.ok(result.checkedWith.includes('openaddresses-us-ca'));
  assert.ok(result.score >= 0.95);
});

test('rejects conflicting locality or country, duplicate premises and missing number', () => {
  const address = { country_code: 'US', city: 'Sample', road: 'Main St', house_number: '12B', postcode: '00001' };
  const record = { source: 'fixture', countryCode: 'US', city: 'Sample', street: 'Main St', houseNumber: '12B', postcode: '00001' };
  for (const fields of [{ countryCode: 'CA' }, { city: 'Other' }, { postcode: '00002' }, { houseNumber: '12' }]) {
    assert.equal(matchOpenAddressesReference(address, [{ ...record, ...fields }]), null);
  }
  assert.equal(matchOpenAddressesReference(address, [record, { ...record, lon: 1 }]), null);
  assert.equal(matchOpenAddressesReference({ ...address, house_number: '' }, [record]), null);
  assert.equal(matchOpenAddressesReference({ ...address, district: 'First' }, [record]), null);
});
