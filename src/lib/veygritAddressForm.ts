import { parseDeliveryLines, readDeliveryLines, type DeliveryLines } from './addressDeliveryLines';
import type { AddressElementFieldKey } from './addressElement';
import { LOCAL_ADDRESS_COMPONENTS, mapAddressElementFormatFieldKey } from './addressElementInputPolicy';

export const VEYGRIT_ADDRESS_FORM_VERSION = 'veygrit-address-wallet-form-v0.1';
export const VEYGRIT_ADDRESS_FORM_SCHEMA = 'agid-address-element-v1';

export type VeygritAddressFormFields = DeliveryLines & {
  recipient: string;
  organization: string;
  countryCode: string;
  postcode: string;
  state: string;
  city: string;
  district: string;
  subdistrict?: string;
  floor?: string;
  room?: string;
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
  countryFields?: Record<string, string>;
  submittedFields: AddressElementFieldKey[];
};

export type VeygritAddressFieldBinding = {
  fieldKey: string;
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
  addressLine1: 'address-line1',
  addressLine2: 'address-line2',
  addressLine3: 'address-line3',
  building: 'organization',
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

export function readCountryFormComponents(input: Record<string, unknown>): Partial<Record<typeof LOCAL_ADDRESS_COMPONENTS[number], string>> {
  const entries = LOCAL_ADDRESS_COMPONENTS.map(key => [key, clean(input[key])] as const);
  return Object.fromEntries(entries.filter(([, value]) => value));
}

export function getVeygritAddressFieldBinding(sourceKey: string, countryCode = ''): VeygritAddressFieldBinding {
  const fieldKey = sourceKey === 'room' && countryCode === 'CN' ? 'room' : mapAddressElementFormatFieldKey(sourceKey);
  if (!fieldKey) {
    // Keep format-specific controls independent even when a new field is introduced.
    return { fieldKey: sourceKey, stateKey: sourceKey, name: 'veygritAddress.' + sourceKey, autoComplete: 'off' };
  }
  const stateKey = STATE_KEY_BY_FIELD[fieldKey] || fieldKey;
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
  const countryCode = first(input, ['countryCode', 'country', 'country_code']).toUpperCase();
  const state = first(input, ['state', 'province', 'region', 'prefecture', 'administrativeArea', 'administrative_area', 'provinceTerritory']);
  const lines = readDeliveryLines(input);
  const street = first(input, ['street', 'road', 'streetName']);
  const houseNumber = first(input, ['houseNumber', 'house_number', 'buildingNumber', 'civicNumber']);
  const subdistrict = first(input, ['subdistrict']);
  const unit = first(input, countryCode === 'CN' ? ['unit', 'suite', 'apartment'] : ['unit', 'room', 'suite', 'apartment']);
  const floor = clean(input.floor);
  const room = countryCode === 'CN' ? clean(input.room) : '';
  const countryFields = readCountryFormComponents(input);
  const parsed = parseDeliveryLines(countryCode, state, lines, { street, houseNumber, subdistrict, unit });
  const fields: VeygritAddressFormFields = {
    ...lines,
    ...(floor ? { floor } : {}),
    ...(room ? { room } : {}),
    recipient: first(input, ['recipient', 'name', 'fullName']),
    organization: first(input, ['organization', 'company']),
    countryCode,
    postcode: first(input, ['postcode', 'postalCode', 'postal_code', 'zip']),
    state,
    city: first(input, ['city', 'town', 'municipality', 'locality', 'prefectureCity']),
    district: first(input, ['district', 'suburb', 'neighbourhood', 'neighborhood', 'ward', 'districtOrCounty']),
    ...((subdistrict || parsed.subdistrict) ? { subdistrict: subdistrict || parsed.subdistrict } : {}),
    street: street || parsed.street || '',
    houseNumber: houseNumber || parsed.houseNumber || '',
    building: first(input, ['building', 'buildingName', 'buildingOrPremises', 'poi']),
    unit: unit || parsed.unit || '',
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
    ...(Object.keys(countryFields).length ? { countryFields } : {}),
    submittedFields,
  };
}

export function buildLegacyAddressFormPatch(envelope: VeygritAddressFormEnvelope) {
  const { fields } = envelope;
  return {
    ...readCountryFormComponents(envelope.countryFields ?? {}),
    ...readDeliveryLines(fields),
    ...(fields.floor ? { floor: fields.floor } : {}),
    ...(fields.subdistrict ? { subdistrict: fields.subdistrict } : {}),
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
    room: fields.countryCode === 'CN' ? fields.room || '' : fields.unit,
    phone: fields.phone,
  };
}
