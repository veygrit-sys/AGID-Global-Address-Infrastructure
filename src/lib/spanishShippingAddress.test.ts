import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CanonicalAddress } from './addressRendering';
import { AddressRenderer } from './addressRendering';
import {
  buildSpanishShippingAddress,
  getSpanishShippingComponentLabels,
  getSpanishShippingProfile,
  isSpanishShippingCountry,
  SPANISH_SHIPPING_COUNTRY_CODES,
} from './spanishShippingAddress';

const syntheticAddress = (
  overrides: Partial<CanonicalAddress>,
): CanonicalAddress => ({
  country_code: 'MX',
  country: 'México',
  state: 'CDMX',
  city: 'Ciudad de México',
  district: '',
  subdistrict: 'Colonia Demostración',
  suburb: '',
  road: 'Avenida Ficticia',
  house_number: '12 Int 4',
  building: 'Edificio Ejemplo',
  postcode: '01000',
  poi: '',
  ...overrides,
});

test('covers the Spanish-speaking destination profile set and regional aliases', () => {
  assert.equal(SPANISH_SHIPPING_COUNTRY_CODES.length, 21);
  for (const code of SPANISH_SHIPPING_COUNTRY_CODES) {
    const profile = getSpanishShippingProfile(code);
    assert.equal(profile?.countryCode, code);
    assert.match(profile?.evidenceUrl || '', /^https:\/\//);
  }
  assert.equal(isSpanishShippingCountry('ES-BAL'), true);
  assert.equal(getSpanishShippingProfile('ES_CAN')?.countryCode, 'ES');
  assert.equal(getSpanishShippingProfile('CL-EA')?.countryCode, 'CL');
});

test('Mexico domestic Spanish preserves official delivery names and omits country', () => {
  const result = buildSpanishShippingAddress(syntheticAddress({}), 'domestic');

  assert.equal(
    result.formatted,
    [
      'Edificio Ejemplo',
      'Avenida Ficticia 12 Int 4',
      'Colonia Demostración',
      '01000 Ciudad de México, CDMX',
    ].join('\n'),
  );
  assert.equal(result.outputLanguage, 'es');
  assert.deepEqual(result.translatedFields, []);
  assert.equal(result.formatted.includes('MÉXICO'), false);
  assert.deepEqual(result.warnings, ['delivery_point_not_validated']);
});

test('Mexico international English changes structure labels and country, not delivery keys', () => {
  const input = syntheticAddress({});
  const result = buildSpanishShippingAddress(input, 'international-shipping');
  const labels = getSpanishShippingComponentLabels('MX', 'international-shipping');

  assert.equal(result.formatted, `${buildSpanishShippingAddress(input, 'domestic').formatted}\nMEXICO`);
  assert.equal(result.outputLanguage, 'en');
  assert.equal(labels.neighborhood, 'Neighborhood or delivery area');
  assert.deepEqual(result.translatedFields, ['country']);
  assert.equal(result.normalized.city, 'Ciudad de México');
  assert.equal(result.normalized.road, 'Avenida Ficticia');
  assert.equal(result.deliveryPointValidated, false);
});

test('Spain uses postcode-locality ordering in both domestic and international output', () => {
  const input = syntheticAddress({
    country_code: 'ES',
    country: 'España',
    state: 'Comunidad de Prueba',
    city: 'Villa Ejemplo',
    subdistrict: '',
    road: 'Calle Ficticia',
    house_number: '7, 2.º B',
    building: '',
    postcode: '28000',
  });

  const domestic = buildSpanishShippingAddress(input, 'domestic');
  const international = buildSpanishShippingAddress(input, 'international-shipping');
  assert.equal(
    domestic.formatted,
    'Calle Ficticia 7, 2.º B\n28000 Villa Ejemplo\nComunidad de Prueba',
  );
  assert.equal(international.formatted, `${domestic.formatted}\nSPAIN`);
});

test('Colombia preserves the road class and applies the local number separator', () => {
  const input = syntheticAddress({
    country_code: 'CO',
    country: 'Colombia',
    state: 'Departamento Ejemplo',
    city: 'Ciudad Demostración',
    subdistrict: 'Barrio Prueba',
    road: 'Carrera Ficticia',
    house_number: '10-20',
    building: '',
    postcode: '110001',
  });

  const result = buildSpanishShippingAddress(input, 'international-shipping');
  assert.equal(
    result.formatted,
    [
      'Carrera Ficticia # 10-20',
      'Barrio Prueba',
      'Ciudad Demostración, Departamento Ejemplo',
      '110001',
      'COLOMBIA',
    ].join('\n'),
  );
});

test('Puerto Rico uses USPS urbanization and last-line structure without translating names', () => {
  const input = syntheticAddress({
    country_code: 'PR',
    country: 'Puerto Rico',
    state: '',
    city: 'Ciudad Ejemplo',
    subdistrict: 'Urbanización Demostración',
    road: 'Calle Ficticia',
    house_number: '9',
    building: '',
    postcode: '009991234',
  });

  const result = buildSpanishShippingAddress(input, 'domestic');
  assert.equal(
    result.formatted,
    [
      'Urbanización Demostración',
      '9 Calle Ficticia',
      'CIUDAD EJEMPLO PR 00999-1234',
    ].join('\n'),
  );
});

test('Argentina canonicalizes CPA casing while preserving locality spelling', () => {
  const input = syntheticAddress({
    country_code: 'AR',
    country: 'Argentina',
    state: 'Provincia Ejemplo',
    city: 'Ciudad de Prueba',
    subdistrict: '',
    road: 'Avenida Ficticia',
    house_number: '20',
    building: '',
    postcode: 'c1000abc',
  });

  const result = buildSpanishShippingAddress(input, 'domestic');
  assert.equal(result.normalized.postcode, 'C1000ABC');
  assert.equal(result.formatStatus, 'format-ready');
});

test('countries without a universal postcode requirement do not invent one', () => {
  const input = syntheticAddress({
    country_code: 'GQ',
    country: 'Guinea Ecuatorial',
    state: '',
    city: 'Ciudad Ejemplo',
    subdistrict: '',
    road: 'Calle Demostración',
    house_number: '4',
    building: '',
    postcode: '',
  });

  const result = buildSpanishShippingAddress(input, 'international-shipping');
  assert.equal(result.formatted, 'Calle Demostración 4\nCiudad Ejemplo\nEQUATORIAL GUINEA');
  assert.equal(result.warnings.includes('missing_postcode'), false);
});

test('renderer selects native Spanish domestically and destination-safe English internationally', () => {
  const input = syntheticAddress({});
  const domestic = AddressRenderer.render('es', input);
  const international = AddressRenderer.render('en', input);

  assert.equal(domestic.includes('MEXICO'), false);
  assert.equal(international.endsWith('\nMEXICO'), true);
  assert.equal(international.includes('Avenida Ficticia'), true);
});

test('incomplete data stays reviewable and never becomes a deliverability claim', () => {
  const result = buildSpanishShippingAddress(syntheticAddress({
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
