import assert from 'node:assert/strict';
import { test } from 'node:test';

import { convertRegisteredAddressToCarrierWaybill } from './carrierWaybillAddress';

const registeredUsAddress = {
  recipient: 'Avery Johnson',
  organization: 'Veygrit Store',
  countryCode: 'us',
  postcode: '94107-1234',
  state: 'ca',
  city: 'San Francisco',
  street: 'Brannan Street',
  houseNumber: '548',
  building: 'Warehouse North',
  unit: 'Dock 3',
  phone: '+1 (415) 555-0100 ext 42',
  email: 'shipping@example.com',
  residential: false,
};

test('converts one registered US address into UPS ShipFrom and DHL shipperDetails', () => {
  const result = convertRegisteredAddressToCarrierWaybill('shipper', registeredUsAddress);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.carrierPayloads.ups.container, 'ShipFrom');
  assert.deepEqual(result.carrierPayloads.ups.value.Address, {
    AddressLine: ['548 Brannan Street', 'Warehouse North Dock 3'],
    City: 'San Francisco',
    StateProvinceCode: 'CA',
    PostalCode: '941071234',
    CountryCode: 'US',
  });
  assert.deepEqual(result.carrierPayloads.ups.value.Phone, { Number: '4155550100', Extension: '42' });
  assert.equal(result.carrierPayloads.dhl.container, 'shipperDetails');
  assert.deepEqual(result.carrierPayloads.dhl.value.postalAddress, {
    postalCode: '94107-1234',
    cityName: 'San Francisco',
    countryCode: 'US',
    provinceCode: 'CA',
    addressLine1: '548 Brannan Street',
    addressLine2: 'Warehouse North Dock 3',
  });
  assert.equal(result.carrierPayloads.dhl.value.contactInformation.phone, '+14155550100');
  assert.equal(result.privacy.safeForMerchantCallback, false);
});

test('uses receiver containers, residential marker, and a private DHL party when organization is absent', () => {
  const result = convertRegisteredAddressToCarrierWaybill('receiver', {
    ...registeredUsAddress,
    organization: undefined,
    residential: true,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.carrierPayloads.ups.container, 'ShipTo');
  assert.equal(result.carrierPayloads.ups.value.Address.ResidentialAddressIndicator, '');
  assert.equal(result.carrierPayloads.dhl.container, 'receiverDetails');
  assert.equal(result.carrierPayloads.dhl.value.typeCode, 'private');
  assert.equal(result.carrierPayloads.dhl.value.contactInformation.companyName, 'Avery Johnson');
});

test('reflows long label lines at word boundaries without truncating', () => {
  const result = convertRegisteredAddressToCarrierWaybill('receiver', {
    ...registeredUsAddress,
    street: 'North Martin Luther King Junior Boulevard',
    houseNumber: '1200',
    building: undefined,
    unit: undefined,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.carrierPayloads.ups.value.Address.AddressLine, [
    '1200 North Martin Luther King',
    'Junior Boulevard',
  ]);
  assert.deepEqual(result.carrierPayloads.dhl.value.postalAddress.addressLine1, '1200 North Martin Luther King Junior');
  assert.deepEqual(result.carrierPayloads.dhl.value.postalAddress.addressLine2, 'Boulevard');
  assert.ok(result.warnings.includes('ups_address_line_reflowed'));
  assert.ok(result.warnings.includes('dhl_address_line_reflowed'));
});

test('rejects unsupported countries and malformed US values rather than silently coercing them', () => {
  const result = convertRegisteredAddressToCarrierWaybill('receiver', {
    ...registeredUsAddress,
    countryCode: 'JP',
    state: 'California',
    postcode: 'ABC',
    phone: '555',
  });
  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.ok(result.errors.some(error => error.code === 'unsupported_country'));
  assert.ok(result.errors.some(error => error.field === 'state'));
  assert.ok(result.errors.some(error => error.field === 'postcode'));
  assert.ok(result.errors.some(error => error.field === 'phone'));
});

test('does not truncate an address that cannot fit into three carrier lines', () => {
  const result = convertRegisteredAddressToCarrierWaybill('receiver', {
    ...registeredUsAddress,
    street: 'One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen',
    building: 'Building Alpha Beta Gamma Delta Epsilon Zeta Eta Theta',
    unit: 'Suite Nine Hundred',
    district: 'Historic Waterfront Commerce District',
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some(error => error.code === 'too_many_address_lines'));
});

test('adds the UPS POBoxIndicator when a registered address is a PO box', () => {
  const result = convertRegisteredAddressToCarrierWaybill('receiver', {
    ...registeredUsAddress,
    street: 'PO Box 123',
    houseNumber: undefined,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.carrierPayloads.ups.value.Address.POBoxIndicator, '');
  assert.ok(result.warnings.includes('ups_po_box_indicator_added'));
});
