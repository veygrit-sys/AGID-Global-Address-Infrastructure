import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLegacyAddressFormPatch,
  buildVeygritAddressForm,
  getVeygritAddressFieldBinding,
  VEYGRIT_ADDRESS_FORM_VERSION,
} from './veygritAddressForm';

test('builds the canonical local-only Veygrit Address Wallet form', () => {
  const form = buildVeygritAddressForm({
    country: 'jp',
    recipient: ' 山田 太郎 ',
    suburb: '千代田区',
    street: '丸の内通り',
    house_number: '1-1',
    building: 'AGIDビル',
    room: '101',
    postcode: '100-0005',
  }, { agid: 'JP05APPT3ZM0' });

  assert.equal(form.version, VEYGRIT_ADDRESS_FORM_VERSION);
  assert.equal(form.schema, 'agid-address-element-v1');
  assert.equal(form.owner, 'address-wallet');
  assert.equal(form.localOnly, true);
  assert.equal(form.countryCode, 'JP');
  assert.deepEqual({
    district: form.fields.district,
    street: form.fields.street,
    houseNumber: form.fields.houseNumber,
    building: form.fields.building,
    unit: form.fields.unit,
  }, {
    district: '千代田区',
    street: '丸の内通り',
    houseNumber: '1-1',
    building: 'AGIDビル',
    unit: '101',
  });
  assert.ok(form.submittedFields.includes('houseNumber'));
  assert.ok(form.submittedFields.includes('unit'));
});

test('reads canonical fields back into the legacy AGID form without losing data', () => {
  const form = buildVeygritAddressForm({
    countryCode: 'US',
    district: 'Brooklyn',
    street: 'Atlantic Ave',
    houseNumber: '120',
    unit: '4B',
  });
  const patch = buildLegacyAddressFormPatch(form);

  assert.equal(patch.country, 'US');
  assert.equal(patch.suburb, 'Brooklyn');
  assert.equal(patch.houseNumber, '120');
  assert.equal(patch.room, '4B');
  assert.equal(patch.unit, '4B');
});

test('binds country-specific source keys to stable Veygrit field names and autocomplete', () => {
  assert.deepEqual(getVeygritAddressFieldBinding('suburb'), {
    fieldKey: 'district',
    stateKey: 'suburb',
    name: 'veygritAddress.district',
    autoComplete: 'address-level3',
  });
  assert.equal(getVeygritAddressFieldBinding('room').stateKey, 'unit');
  assert.equal(getVeygritAddressFieldBinding('postcode').autoComplete, 'postal-code');
});

test('splits US primary and labeled unit lines without using them as verification', () => {
  const form = buildVeygritAddressForm({ country: 'us', line1: ' 123 Main St NW ', address_line_2: 'Apt 4B', addressLine3: 'Rear entry' });
  assert.equal(form.fields.street, 'Main St NW');
  assert.equal(form.fields.houseNumber, '123');
  assert.equal(form.fields.unit, '4B');
  assert.equal(form.fields.addressLine1, ' 123 Main St NW ');
  assert.equal(form.fields.addressLine2, 'Apt 4B');
  const patch = buildLegacyAddressFormPatch(form);
  assert.equal(patch.addressLine3, 'Rear entry');
  assert.deepEqual(buildVeygritAddressForm(patch), form);
});

test('keeps conflicting components and unsupported or indirect address lines separate', () => {
  for (const input of [
    { country: 'US', line1: '123 Main St', street: 'Oak Road' },
    { country: 'VU', line1: '123 Main St' },
    { country: 'US', line1: 'PO Box 321' },
    { country: 'US', line1: 'RR 5 Box 271' },
    { country: 'JP', line1: '神宮前1-2-3' },
    { country: 'NZ', line1: '4/123 Main St' },
  ]) {
    const form = buildVeygritAddressForm({ ...input, line2: '7' });
    assert.equal(form.fields.houseNumber, '');
    assert.equal(form.fields.unit, '');
    assert.equal(form.fields.addressLine1, input.line1);
    assert.equal(form.fields.addressLine2, '7');
  }
});

test('handles explicit Japanese block notation, Chinese road doorplates and PR street syntax', () => {
  const jp = buildVeygritAddressForm({ country: 'JP', line1: '永田町1丁目2番3号' }).fields;
  assert.equal(jp.subdistrict, '永田町');
  assert.equal(jp.houseNumber, '1丁目2番3号');
  assert.equal(jp.street, '');
  const cn = buildVeygritAddressForm({ country: 'CN', line1: '中山路123号', room: '501室', unit: '2单元', floor: '5层' });
  assert.equal(cn.fields.street, '中山路');
  assert.equal(cn.fields.houseNumber, '123号');
  assert.equal(cn.fields.room, '501室');
  assert.equal(cn.fields.unit, '2单元');
  assert.equal(buildLegacyAddressFormPatch(cn).floor, '5层');
  const pr = buildVeygritAddressForm({ country: 'US', state: 'PR', line1: 'A17 CALLE 1', urbanization: 'URB NORTE' });
  assert.equal(pr.fields.houseNumber, 'A17');
  assert.equal(pr.fields.street, 'CALLE 1');
  assert.equal(pr.countryFields?.urbanization, 'URB NORTE');
  assert.equal(buildLegacyAddressFormPatch(pr).urbanization, 'URB NORTE');
});

test('keeps browser address lines and region-specific fields on their own controls', () => {
  for (const key of ['line2', 'addressLine2', 'address_2']) {
    const binding = getVeygritAddressFieldBinding(key);
    assert.equal(binding.stateKey, 'addressLine2');
    assert.equal(binding.autoComplete, 'address-line2');
  }
  assert.equal(getVeygritAddressFieldBinding('houseNumber').autoComplete, 'off');
  assert.equal(getVeygritAddressFieldBinding('urbanization').stateKey, 'urbanization');
  assert.equal(getVeygritAddressFieldBinding('subdistrict').stateKey, 'subdistrict');
  assert.equal(getVeygritAddressFieldBinding('township', 'CN').stateKey, 'township');
  assert.equal(getVeygritAddressFieldBinding('room', 'CN').stateKey, 'room');
  assert.equal(getVeygritAddressFieldBinding('floor', 'CN').stateKey, 'floor');
});

test('does not treat provider-specific numeric keys as generic wallet lines', () => {
  const form = buildVeygritAddressForm({ country: 'JP', address1: '東京都', address2: '千代田区', address3: '永田町' });
  assert.equal(form.fields.street, '');
  assert.equal(form.fields.houseNumber, '');
  assert.equal(form.fields.addressLine1, undefined);
});

test('preserves address numbers with local suffixes and Canadian civic field bindings', () => {
  for (const [country, addressLine1, houseNumber] of [
    ['FR', "2 bis place de l'église", '2 bis'], ['LU', '4, rue de la Gare', '4'],
    ['NL', 'Schoolstraat 22A', '22A'], ['MX', 'Calle 18 No. 17A', '17A'],
  ]) {
    const result = buildVeygritAddressForm({ country, addressLine1 });
    assert.equal(result.fields.houseNumber, houseNumber);
    assert.equal(result.fields.addressLine1, addressLine1);
  }
  const ca = buildVeygritAddressForm({ country: 'CA', civicNumber: '42', civicNumberSuffix: 'B', streetName: 'Main', streetDirection: 'NW', provinceTerritory: 'AB' });
  assert.equal(ca.fields.houseNumber, '42');
  assert.equal(ca.fields.street, 'Main');
  assert.equal(ca.fields.state, 'AB');
  assert.equal(ca.countryFields?.civicNumberSuffix, 'B');
  assert.equal(getVeygritAddressFieldBinding('streetName', 'CA').stateKey, 'street');
  assert.equal(getVeygritAddressFieldBinding('civicNumber', 'CA').stateKey, 'houseNumber');
});
