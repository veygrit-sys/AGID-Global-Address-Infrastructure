import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CanonicalAddress } from './addressRendering';
import {
buildEnglishShippingAddress,
EXTENDED_ENGLISH_SHIPPING_COUNTRIES,
getEnglishAddressModeProfile,
getEnglishShippingProfile,
normalizeEnglishAddressModeField,
renderEnglishAddressMode,
} from './englishAddressMode';
import { OUTER_CIRCLE_ENGLISH_COUNTRIES } from './languageTabs';

const australianAddress: CanonicalAddress = {
  country_code: 'AU',
  country: 'Australia',
  state: 'NSW',
  city: 'Sydney',
  district: '',
  subdistrict: '',
  suburb: '',
  road: 'George Street',
  house_number: '1',
  building: 'Queen Victoria Building',
  postcode: '2000',
  poi: '',
};

test('English-speaking countries share one normalization algorithm across domestic and international shipping tabs', () => {
  const profile = getEnglishAddressModeProfile('AU');

  assert.deepEqual(profile, {
    countryCode: 'AU',
    circle: 'inner',
    domesticTab: 'en_domestic',
    internationalTab: 'en',
    normalizerId: 'english-address-normalizer-v1',
    buildingNormalizerId: 'english-building-name-normalizer-v1',
    domesticIncludesCountry: false,
    internationalIncludesCountry: true,
  });
});

test('Outer Circle English countries use the same shared English mode profile', () => {
  const profile = getEnglishAddressModeProfile('FJ');

  assert.equal(profile.countryCode, 'FJ');
  assert.equal(profile.circle, 'outer');
  assert.equal(profile.normalizerId, 'english-address-normalizer-v1');
  assert.equal(profile.domesticIncludesCountry, false);
  assert.equal(profile.internationalIncludesCountry, true);
});

test('domestic English and international shipping English normalize address parts identically', () => {
  const domestic = normalizeEnglishAddressModeField({
    countryCode: 'NZ',
    fieldKey: 'state',
    text: 'Aotearoa',
    mode: 'domestic',
  });
  const international = normalizeEnglishAddressModeField({
    countryCode: 'NZ',
    fieldKey: 'state',
    text: 'Aotearoa',
    mode: 'international-shipping',
  });

  assert.equal(domestic, 'New Zealand');
  assert.equal(international, domestic);
});

test('Australian delivery rendering uses the official locality-state-postcode line', () => {
  const domestic = renderEnglishAddressMode(australianAddress, 'domestic');
  const international = renderEnglishAddressMode(australianAddress, 'international-shipping');

  assert.equal(domestic, 'Queen Victoria Building\n1 George Street\nSYDNEY NSW 2000');
  assert.equal(international, `${domestic}\nAUSTRALIA`);
});

test('core English shipping profiles expose reviewed presentation evidence without a deliverability claim', () => {
  for (const code of ['US', 'CA', 'GB', 'AU', 'NZ', 'IE']) {
    const profile = getEnglishShippingProfile(code);
    assert.equal(profile.countryCode, code);
    assert.equal(profile.evidenceScope, 'address-presentation-only');
    assert.match(profile.evidenceUrl, /^https:\/\//);
  }
});

test('every non-core English country has an explicit evidence-backed shipping profile', () => {
  assert.deepEqual(
    [...EXTENDED_ENGLISH_SHIPPING_COUNTRIES].sort(),
    OUTER_CIRCLE_ENGLISH_COUNTRIES.map(code => code.toUpperCase()).sort(),
  );

  for (const code of EXTENDED_ENGLISH_SHIPPING_COUNTRIES) {
    const profile = getEnglishShippingProfile(code);
    assert.equal(profile.countryCode, code);
    assert.equal(profile.profileId, 'outer-circle-english-postal-presentation-v1');
    assert.equal(profile.evidenceScope, 'address-presentation-only');
    assert.match(profile.evidenceUrl, /^https:\/\/(?:www\.)?(?:upu\.int|usps\.com|pe\.usps\.com|auspost\.com\.au|nzpost\.co\.nz)/i);
    assert.notEqual(profile.evidenceVersion, '');
    assert.ok(['required', 'optional', 'not-used'].includes(profile.postcodePolicy));
  }
});

test('US shipping format canonicalizes state, ZIP+4, PO Box, and unit designators', () => {
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'US',
    fieldKey: 'state',
    text: 'California',
    mode: 'domestic',
  }), 'CA');
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'US',
    fieldKey: 'postcode',
    text: '123456789',
    mode: 'domestic',
  }), '12345-6789');
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'US',
    fieldKey: 'building',
    text: 'Apartment 4B',
    mode: 'domestic',
  }), 'APT 4B');
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'US',
    fieldKey: 'road',
    text: 'P.O. Box 18',
    mode: 'domestic',
  }), 'PO BOX 18');
});

test('core English profiles preserve official place names instead of translating them', () => {
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'CA',
    fieldKey: 'city',
    text: 'Trois-Rivières',
    mode: 'international-shipping',
  }), 'Trois-Rivières');
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'CA',
    fieldKey: 'state',
    text: 'Québec',
    mode: 'international-shipping',
  }), 'QC');
  assert.equal(getEnglishAddressModeProfile('UK').countryCode, 'GB');
  assert.equal(getEnglishAddressModeProfile('UK').circle, 'inner');
});

test('Canada uses province codes, postal-code spacing, and a country-only international suffix', () => {
  const input: CanonicalAddress = {
    country_code: 'CA',
    country: 'Canada',
    state: 'Ontario',
    city: 'Exampleton',
    district: '',
    subdistrict: '',
    suburb: '',
    road: 'Fiction Avenue',
    house_number: '12',
    building: 'Suite 7',
    postcode: 'A1A1A1',
    poi: '',
  };

  const result = buildEnglishShippingAddress(input, 'international-shipping');
  assert.equal(
    result.formatted,
    'SUITE 7\n12 Fiction Avenue\nEXAMPLETON ON  A1A 1A1\nCANADA',
  );
  assert.deepEqual(result.changedFields.sort(), ['building', 'postcode', 'state']);
  assert.equal(result.deliveryPointValidated, false);
  assert.deepEqual(result.warnings, ['delivery_point_not_validated']);
  assert.equal(result.formatStatus, 'format-ready');
});

test('United Kingdom puts the post town and postcode on separate uppercase lines', () => {
  const input: CanonicalAddress = {
    country_code: 'UK',
    country: 'United Kingdom',
    state: '',
    city: 'Exampleford',
    district: 'North Quarter',
    subdistrict: '',
    suburb: '',
    road: 'Fiction Lane',
    house_number: '8',
    building: '',
    postcode: 'ab1 2cd',
    poi: '',
  };

  const result = buildEnglishShippingAddress(input, 'domestic');
  assert.equal(result.profile.countryCode, 'GB');
  assert.equal(result.formatted, '8 Fiction Lane\nNorth Quarter\nEXAMPLEFORD\nAB1 2CD');
  assert.equal(result.formatted.includes('UNITED KINGDOM'), false);
});

test('New Zealand omits regions and preserves the suburb-town-postcode hierarchy', () => {
  const input: CanonicalAddress = {
    country_code: 'NZ',
    country: 'New Zealand',
    state: 'Synthetic Region',
    city: 'Example City',
    district: '',
    subdistrict: '',
    suburb: 'Demo Suburb',
    road: 'Sample Road',
    house_number: '5',
    building: 'Level 2',
    postcode: '1234',
    poi: '',
  };

  const result = buildEnglishShippingAddress(input, 'domestic');
  assert.equal(
    result.formatted,
    'L 2\n5 Sample Road\nDemo Suburb\nExample City 1234',
  );
  assert.equal(result.formatted.includes('Synthetic Region'), false);
});

test('Ireland keeps Eircode immediately before the country on international mail', () => {
  const input: CanonicalAddress = {
    country_code: 'IE',
    country: 'Ireland',
    state: 'Example County',
    city: 'Sampletown',
    district: '',
    subdistrict: 'Demo Locality',
    suburb: '',
    road: 'Test Road',
    house_number: '3',
    building: '',
    postcode: 'A65F4E2',
    poi: '',
  };

  const result = buildEnglishShippingAddress(input, 'international-shipping');
  assert.equal(
    result.formatted,
    '3 Test Road\nDemo Locality\nSampletown\nExample County\nA65 F4E2\nIRELAND',
  );
});

test('India preserves English official names and renders the PIN after locality and state', () => {
  const input: CanonicalAddress = {
    country_code: 'IN',
    country: 'India',
    state: 'Test State',
    city: 'Example City',
    district: '',
    subdistrict: 'Demo Nagar',
    suburb: '',
    road: 'Sample Road',
    house_number: '12',
    building: 'Example Commerce',
    postcode: '560001',
    poi: '',
    unit: '3B',
  };

  const result = buildEnglishShippingAddress(input, 'international-shipping');
  assert.equal(
    result.formatted,
    'Example Commerce\nUNIT 3B\n12 Sample Road\nDemo Nagar\nExample City\nTest State\n560001\nINDIA',
  );
  assert.deepEqual(result.warnings, ['delivery_point_not_validated']);
  assert.equal(result.formatStatus, 'format-ready');
});

test('Singapore and Malaysia use destination-specific final-line ordering', () => {
  const singapore = buildEnglishShippingAddress({
    country_code: 'SG',
    country: 'Singapore',
    state: '',
    city: '',
    district: '',
    subdistrict: '',
    suburb: '',
    road: 'Sample Road',
    house_number: '10',
    building: 'Demo Centre',
    postcode: '408600',
    poi: '',
    unit: '#01-38',
  }, 'domestic');
  assert.equal(
    singapore.formatted,
    'Demo Centre\nUNIT #01-38\n10 Sample Road\nSINGAPORE 408600',
  );

  const malaysia = buildEnglishShippingAddress({
    country_code: 'MY',
    country: 'Malaysia',
    state: 'Demo State',
    city: 'Example City',
    district: '',
    subdistrict: 'Sample District',
    suburb: '',
    road: 'Jalan Ujian',
    house_number: '8',
    building: '',
    postcode: '50000',
    poi: '',
  }, 'domestic');
  assert.equal(
    malaysia.formatted,
    '8 Jalan Ujian\nSample District\n50000 Example City\nDemo State',
  );
});

test('African profiles distinguish locality-postcode order and no-postcode destinations', () => {
  const nigeria = buildEnglishShippingAddress({
    country_code: 'NG',
    country: 'Nigeria',
    state: 'Demo State',
    city: 'Example City',
    district: '',
    subdistrict: 'Sample Area',
    suburb: '',
    road: 'Test Close',
    house_number: '34',
    building: '',
    postcode: '900001',
    poi: '',
  }, 'international-shipping');
  assert.equal(
    nigeria.formatted,
    '34 Test Close\nSample Area 900001\nExample City\nDemo State\nNIGERIA',
  );
  assert.equal(nigeria.formatStatus, 'format-ready');

  const ghana = buildEnglishShippingAddress({
    country_code: 'GH',
    country: 'Ghana',
    state: 'Demo Region',
    city: 'Example City',
    district: '',
    subdistrict: '',
    suburb: '',
    road: '',
    house_number: '',
    building: '',
    postcode: '',
    poi: '',
    po_box: '42',
  }, 'domestic');
  assert.equal(ghana.formatted, 'PO BOX 42\nExample City\nDemo Region');
  assert.deepEqual(ghana.warnings, ['delivery_point_not_validated']);

  const southAfrica = buildEnglishShippingAddress({
    country_code: 'ZA',
    country: 'South Africa',
    state: 'Demo Province',
    city: 'Example City',
    district: '',
    subdistrict: 'Sample Delivery Area',
    suburb: '',
    road: 'Test Avenue',
    house_number: '4',
    building: '',
    postcode: '0083',
    poi: '',
  }, 'international-shipping');
  assert.equal(
    southAfrica.formatted,
    '4 Test Avenue\nSAMPLE DELIVERY AREA\n0083\nSOUTH AFRICA',
  );
});

test('no-postcode countries reject invented postcodes without requiring one', () => {
  const jamaica = buildEnglishShippingAddress({
    country_code: 'JM',
    country: 'Jamaica',
    state: 'Demo Parish',
    city: 'Example Town',
    district: '',
    subdistrict: '',
    suburb: '',
    road: '',
    house_number: '',
    building: '',
    postcode: '12345',
    poi: '',
    po_box: '7',
  }, 'domestic');

  assert.equal(jamaica.formatted, 'PO BOX 7\nExample Town 12345\nDemo Parish');
  assert.ok(jamaica.warnings.includes('postcode_not_used_by_destination'));
  assert.equal(jamaica.warnings.includes('missing_postcode'), false);
  assert.equal(jamaica.formatStatus, 'needs-review');
});

test('small-island and territory profiles normalize network-specific postcodes', () => {
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'GG',
    fieldKey: 'postcode',
    text: 'GY11AA',
    mode: 'international-shipping',
  }), 'GY1 1AA');
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'AI',
    fieldKey: 'postcode',
    text: 'AI 2640',
    mode: 'international-shipping',
  }), 'AI-2640');
  assert.equal(normalizeEnglishAddressModeField({
    countryCode: 'AS',
    fieldKey: 'postcode',
    text: '967991234',
    mode: 'international-shipping',
  }), '96799-1234');
});

test('formatting reports review gates instead of claiming delivery-point validation', () => {
  const incomplete: CanonicalAddress = {
    country_code: 'US',
    country: 'United States',
    state: 'Unknown Territory',
    city: '',
    district: '',
    subdistrict: '',
    suburb: '',
    road: '',
    house_number: '',
    building: '',
    postcode: 'BAD',
    poi: '',
  };

  const result = buildEnglishShippingAddress(incomplete, 'domestic');
  assert.equal(result.formatStatus, 'needs-review');
  assert.equal(result.deliveryPointValidated, false);
  assert.deepEqual(result.warnings, [
    'delivery_point_not_validated',
    'missing_delivery_line',
    'missing_locality',
    'postcode_format_unconfirmed',
    'subnational_area_unrecognized',
  ]);
});
