import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CanonicalAddress } from './addressRendering';
import { AddressRenderer } from './addressRendering';
import {
  buildFrenchShippingAddress,
  FRENCH_SHIPPING_COUNTRY_CODES,
  getFrenchShippingComponentLabels,
  getFrenchShippingProfile,
  isFrenchShippingCountry,
} from './frenchShippingAddress';

const syntheticAddress = (
  overrides: Partial<CanonicalAddress>,
): CanonicalAddress => ({
  country_code: 'FR',
  country: 'France',
  state: 'Région Exemple',
  city: 'Ville-sur-Test',
  district: '',
  subdistrict: 'Quartier Démonstration',
  suburb: '',
  road: 'Rue des Fleurs Fictives',
  house_number: '12 bis',
  building: 'Organisation Exemple',
  postcode: '75001',
  poi: '',
  ...overrides,
});

test('covers the French delivery-language profile set and regional aliases', () => {
  assert.equal(FRENCH_SHIPPING_COUNTRY_CODES.length, 42);
  for (const code of FRENCH_SHIPPING_COUNTRY_CODES) {
    const profile = getFrenchShippingProfile(code);
    assert.equal(profile?.countryCode, code);
    assert.match(profile?.evidenceUrl || '', /^https:\/\//);
    assert.equal(profile?.evidenceScope, 'destination-format-and-postcode-shape-only');
  }
  assert.equal(isFrenchShippingCountry('FR-COR'), true);
  assert.equal(getFrenchShippingProfile('CA_QC')?.countryCode, 'CA');
  assert.equal(getFrenchShippingProfile('BE-WAL')?.countryCode, 'BE');
  assert.equal(getFrenchShippingProfile('SC')?.postcodePattern, null);
  assert.equal(getFrenchShippingProfile('SC')?.postcodeRequired, false);
  assert.equal(getFrenchShippingProfile('SC')?.evidenceAuthority, 'Seychelles Postal Regulator National Addressing System');
});

test('France domestic French preserves official delivery names and omits country', () => {
  const result = buildFrenchShippingAddress(syntheticAddress({ state: '' }), 'domestic');

  assert.equal(
    result.formatted,
    [
      'Organisation Exemple',
      '12 bis Rue des Fleurs Fictives',
      'Quartier Démonstration',
      '75001 Ville-sur-Test',
    ].join('\n'),
  );
  assert.equal(result.outputLanguage, 'fr');
  assert.deepEqual(result.translatedFields, []);
  assert.equal(result.formatted.includes('\nFRANCE'), false);
  assert.deepEqual(result.warnings, ['delivery_point_not_validated']);
});

test('France international English changes structural labels and country only', () => {
  const input = syntheticAddress({ state: '' });
  const result = buildFrenchShippingAddress(input, 'international-shipping');
  const labels = getFrenchShippingComponentLabels('FR', 'international-shipping');

  assert.equal(result.formatted, `${buildFrenchShippingAddress(input, 'domestic').formatted}\nFRANCE`);
  assert.equal(result.outputLanguage, 'en');
  assert.equal(labels.streetLine, 'Delivery address');
  assert.deepEqual(result.translatedFields, ['country']);
  assert.equal(result.normalized.road, 'Rue des Fleurs Fictives');
  assert.equal(result.normalized.city, 'Ville-sur-Test');
  assert.equal(result.deliveryPointValidated, false);
});

test('Canada normalizes the postal code but never translates official French names', () => {
  const input = syntheticAddress({
    country_code: 'CA',
    country: 'Canada',
    state: 'QC',
    city: 'Montréal',
    district: '',
    subdistrict: '',
    road: 'Rue Sainte-Catherine',
    house_number: '1250',
    building: '',
    postcode: 'h2x1y4',
  });

  const result = buildFrenchShippingAddress(input, 'international-shipping');
  assert.equal(
    result.formatted,
    '1250 Rue Sainte-Catherine\nMontréal QC  H2X 1Y4\nCANADA',
  );
  assert.equal(result.normalized.postcode, 'H2X 1Y4');
  assert.equal(result.normalized.city, 'Montréal');
  assert.equal(result.formatStatus, 'format-ready');
});

test('Belgium uses street-number order and keeps one official address language', () => {
  const result = buildFrenchShippingAddress(syntheticAddress({
    country_code: 'BE',
    country: 'Belgique',
    state: '',
    city: 'Bruxelles',
    subdistrict: '',
    road: 'Rue de l’Exemple',
    house_number: '32 bte 20',
    building: '',
    postcode: '1000',
  }), 'domestic');

  assert.equal(result.formatted, 'Rue de l’Exemple 32 bte 20\n1000 Bruxelles');
});

test('optional West African postcodes remain optional and P.O. boxes count as delivery lines', () => {
  const result = buildFrenchShippingAddress(syntheticAddress({
    country_code: 'SN',
    country: 'Sénégal',
    state: 'Région Exemple',
    city: 'Dakar',
    district: '',
    subdistrict: '',
    road: '',
    house_number: '',
    building: 'BP 123',
    postcode: '',
  }), 'domestic');

  assert.equal(result.formatted, 'BP 123\nDakar\nRégion Exemple');
  assert.equal(result.warnings.includes('missing_delivery_line'), false);
  assert.equal(result.warnings.includes('missing_postcode'), false);
});

test('countries without a universal postcode do not invent one', () => {
  const result = buildFrenchShippingAddress(syntheticAddress({
    country_code: 'CD',
    country: 'République démocratique du Congo',
    state: 'Province Exemple',
    city: 'Ville Exemple',
    district: 'Commune Démonstration',
    subdistrict: '',
    road: 'Avenue Fictive',
    house_number: '8',
    building: '',
    postcode: '',
  }), 'international-shipping');

  assert.equal(
    result.formatted,
    [
      '8 Avenue Fictive',
      'Commune Démonstration',
      'Ville Exemple',
      'Province Exemple',
      'DEMOCRATIC REPUBLIC OF THE CONGO',
    ].join('\n'),
  );
  assert.equal(result.warnings.includes('missing_postcode'), false);
});

test('French overseas profiles enforce destination-specific postcode shapes', () => {
  const result = buildFrenchShippingAddress(syntheticAddress({
    country_code: 'PF',
    country: 'Polynésie française',
    state: '',
    city: 'Papeete',
    subdistrict: '',
    road: 'Rue Fictive',
    house_number: '5',
    building: '',
    postcode: '98714',
  }), 'international-shipping');

  assert.equal(result.formatted, '5 Rue Fictive\n98714 Papeete\nFRENCH POLYNESIA');
  assert.equal(result.formatStatus, 'format-ready');
});

test('special territories stay review-only even when their presentation is complete', () => {
  const result = buildFrenchShippingAddress(syntheticAddress({
    country_code: 'CP',
    country: 'Île de la Passion-Clipperton',
    state: '',
    city: 'Secteur logistique fictif',
    subdistrict: '',
    road: 'Voie technique fictive',
    house_number: '1',
    building: '',
    postcode: '',
  }), 'international-shipping');

  assert.equal(result.warnings.includes('special_territory_delivery_scope'), true);
  assert.equal(result.formatStatus, 'needs-review');
  assert.equal(result.deliveryPointValidated, false);
});

test('renderer selects French domestically and destination-safe English internationally', () => {
  const france = syntheticAddress({ state: '' });
  assert.equal(AddressRenderer.render('fr', france).includes('\nFRANCE'), false);
  assert.equal(AddressRenderer.render('en', france).endsWith('\nFRANCE'), true);
  assert.equal(AddressRenderer.render('intl_en', france).endsWith('\nFRANCE'), true);
  assert.equal(AddressRenderer.render('en', france).includes('Rue des Fleurs Fictives'), true);

  const canada = syntheticAddress({
    country_code: 'CA',
    country: 'Canada',
    state: 'QC',
    city: 'Montréal',
    subdistrict: '',
    road: 'Rue Fictive',
    house_number: '10',
    building: '',
    postcode: 'H2X 1Y4',
  });
  assert.equal(AddressRenderer.render('fr', canada).endsWith('\nCANADA'), false);
  assert.equal(AddressRenderer.render('en', canada).endsWith('\nCANADA'), true);
  assert.equal(AddressRenderer.render('en_domestic', canada).includes('\nCANADA'), false);
});

test('incomplete data remains reviewable and never becomes a deliverability claim', () => {
  const result = buildFrenchShippingAddress(syntheticAddress({
    city: '',
    subdistrict: '',
    road: '',
    house_number: '',
    postcode: 'BAD',
  }), 'international-shipping');

  assert.equal(result.formatStatus, 'needs-review');
  assert.equal(result.deliveryPointValidated, false);
  assert.deepEqual(result.warnings, [
    'delivery_point_not_validated',
    'missing_delivery_line',
    'missing_locality',
    'postcode_format_unconfirmed',
  ]);
});
