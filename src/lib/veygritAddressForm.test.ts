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
