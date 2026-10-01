import type { AddressElementFieldKey } from './addressElement';
import { mapAddressElementFormatFieldKey } from './addressElementInputPolicy';

export const VEYGRIT_ADDRESS_FORM_VERSION = 'veygrit-address-wallet-form-v0.1';
export const VEYGRIT_ADDRESS_FORM_SCHEMA = 'agid-address-element-v1';

export type VeygritAddressFormFields = {
  recipient: string;
  organization: string;
  countryCode: string;
  postcode: string;
  state: string;
  city: string;
  district: string;
  street: string;
  houseNumber: string;
  building: string;
  unit: string;
  phone: string;
  agid: string;
};

export type VeygritAddressFormEnvelope = {
  version: typeof VEYGRIT_ADDRESS_FORM_VERSION;
  schema: typeof VEYGRIT_ADDRESS_FORM_SCHEMA;
  owner: 'address-wallet';
  storage: 'local-only';
  localOnly: true;
  countryCode: string;
  fields: VeygritAddressFormFields;
  submittedFields: AddressElementFieldKey[];
};

export type VeygritAddressFieldBinding = {
  fieldKey: AddressElementFieldKey;
  stateKey: string;
  name: string;
  autoComplete: string;
};

const AUTOCOMPLETE_BY_FIELD: Partial<Record<AddressElementFieldKey, string>> = {
  recipient: 'name',
  organization: 'organization',
  countryCode: 'country',
  postcode: 'postal-code',
  state: 'address-level1',
  city: 'address-level2',
  district: 'address-level3',
  street: 'address-line1',
  houseNumber: 'address-line2',
  building: 'organization',
  unit: 'address-line3',
  phone: 'tel',
};

const STATE_KEY_BY_FIELD: Partial<Record<AddressElementFieldKey, string>> = {
  countryCode: 'country',
  district: 'suburb',
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function first(input: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = clean(input[key]);
    if (value) return value;
  }
  return '';
}

function resolveFieldKey(sourceKey: string): AddressElementFieldKey {
  return mapAddressElementFormatFieldKey(sourceKey)
    || (sourceKey === 'suburb' ? 'district' : 'street');
}

export function getVeygritAddressFieldBinding(sourceKey: string): VeygritAddressFieldBinding {
  const fieldKey = resolveFieldKey(sourceKey);
  const stateKey = STATE_KEY_BY_FIELD[fieldKey]
    || (fieldKey === 'unit' && sourceKey === 'room' ? 'unit' : fieldKey);
  return {
    fieldKey,
    stateKey,
    name: 'veygritAddress.' + fieldKey,
    autoComplete: AUTOCOMPLETE_BY_FIELD[fieldKey] || 'off',
  };
}

export function buildVeygritAddressForm(
  input: Record<string, unknown>,
  options: { agid?: string } = {},
): VeygritAddressFormEnvelope {
  const fields: VeygritAddressFormFields = {
    recipient: first(input, ['recipient', 'name', 'fullName']),
    organization: first(input, ['organization', 'company']),
    countryCode: first(input, ['countryCode', 'country', 'country_code']).toUpperCase(),
    postcode: first(input, ['postcode', 'postalCode', 'postal_code', 'zip']),
    state: first(input, ['state', 'province', 'region', 'prefecture']),
    city: first(input, ['city', 'town', 'municipality', 'locality']),
    district: first(input, ['district', 'suburb', 'neighbourhood', 'neighborhood', 'ward']),
    street: first(input, ['street', 'road', 'addressLine1', 'addressline1']),
    houseNumber: first(input, ['houseNumber', 'house_number', 'buildingNumber', 'addressLine2', 'addressline2']),
    building: first(input, ['building', 'buildingName', 'poi']),
    unit: first(input, ['unit', 'room', 'suite', 'apartment', 'addressLine3', 'addressline3']),
    phone: first(input, ['phone', 'telephone', 'tel']),
    agid: clean(options.agid) || first(input, ['agid']),
  };

  const submittedFields = (Object.entries(fields) as Array<[AddressElementFieldKey, string]>)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);

  return {
    version: VEYGRIT_ADDRESS_FORM_VERSION,
    schema: VEYGRIT_ADDRESS_FORM_SCHEMA,
    owner: 'address-wallet',
    storage: 'local-only',
    localOnly: true,
    countryCode: fields.countryCode,
    fields,
    submittedFields,
  };
}

export function buildLegacyAddressFormPatch(envelope: VeygritAddressFormEnvelope) {
  const { fields } = envelope;
  return {
    country: fields.countryCode,
    recipient: fields.recipient,
    organization: fields.organization,
    postcode: fields.postcode,
    state: fields.state,
    city: fields.city,
    suburb: fields.district,
    street: fields.street,
    houseNumber: fields.houseNumber,
    building: fields.building,
    unit: fields.unit,
    room: fields.unit,
    phone: fields.phone,
  };
}
