export const CARRIER_WAYBILL_ADDRESS_VERSION = 'veygrit-ship-carrier-address-us-v0.1';

export type CarrierWaybillAddressRole = 'shipper' | 'receiver';

export type RegisteredCarrierAddressInput = {
  recipient?: string;
  organization?: string;
  countryCode?: string;
  postcode?: string;
  state?: string;
  city?: string;
  district?: string;
  street?: string;
  houseNumber?: string;
  building?: string;
  unit?: string;
  phone?: string;
  email?: string;
  residential?: boolean;
};

export type CarrierAddressValidationError = {
  code:
    | 'required'
    | 'unsupported_country'
    | 'invalid_format'
    | 'carrier_limit_exceeded'
    | 'too_many_address_lines';
  field: keyof RegisteredCarrierAddressInput | 'addressLines';
  carriers: Array<'ups' | 'dhl'>;
  message: string;
};

export type NormalizedUsCarrierAddress = {
  recipientName: string;
  organizationName: string;
  countryCode: 'US';
  postalCode: string;
  stateCode: string;
  cityName: string;
  sourceAddressLines: string[];
  phoneE164: string;
  phoneNational: string;
  phoneExtension?: string;
  email?: string;
  residential: boolean;
};

export type UpsWaybillParty = {
  Name: string;
  AttentionName: string;
  Phone: {
    Number: string;
    Extension?: string;
  };
  EMailAddress?: string;
  Address: {
    AddressLine: string[];
    City: string;
    StateProvinceCode: string;
    PostalCode: string;
    CountryCode: 'US';
    ResidentialAddressIndicator?: '';
    POBoxIndicator?: '';
  };
};

export type DhlWaybillParty = {
  postalAddress: {
    postalCode: string;
    cityName: string;
    countryCode: 'US';
    provinceCode: string;
    addressLine1: string;
    addressLine2?: string;
    addressLine3?: string;
  };
  contactInformation: {
    email?: string;
    phone: string;
    companyName: string;
    fullName: string;
  };
  typeCode: 'business' | 'private';
};

export type CarrierWaybillAddressSuccess = {
  ok: true;
  version: typeof CARRIER_WAYBILL_ADDRESS_VERSION;
  role: CarrierWaybillAddressRole;
  normalized: NormalizedUsCarrierAddress;
  carrierPayloads: {
    ups: {
      container: 'ShipFrom' | 'ShipTo';
      value: UpsWaybillParty;
    };
    dhl: {
      container: 'shipperDetails' | 'receiverDetails';
      value: DhlWaybillParty;
    };
  };
  warnings: string[];
  privacy: {
    serverSideOnly: true;
    containsRawAddress: true;
    safeForMerchantCallback: false;
    safeForClientLogging: false;
  };
  sourceSpecifications: {
    ups: string;
    dhl: string;
  };
};

export type CarrierWaybillAddressFailure = {
  ok: false;
  version: typeof CARRIER_WAYBILL_ADDRESS_VERSION;
  errors: CarrierAddressValidationError[];
};

export type CarrierWaybillAddressResult = CarrierWaybillAddressSuccess | CarrierWaybillAddressFailure;

const US_STATE_AND_TERRITORY_CODES = new Set([
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'GU',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN',
  'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH',
  'OK', 'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'VI',
  'WA', 'WV', 'WI', 'WY', 'AA', 'AE', 'AP',
]);

const UPS_SPEC_URL = 'https://raw.githubusercontent.com/UPS-API/api-documentation/main/Shipping.yaml';
const DHL_SPEC_URL = 'https://developer.dhl.com/api-reference/dhl-express-mydhl-api';

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function addRequiredError(
  errors: CarrierAddressValidationError[],
  field: keyof RegisteredCarrierAddressInput,
  carriers: Array<'ups' | 'dhl'> = ['ups', 'dhl'],
) {
  errors.push({ code: 'required', field, carriers, message: `${field} is required for carrier label creation.` });
}

function splitAtWordBoundaries(value: string, maxLength: number): string[] | undefined {
  if (value.length <= maxLength) return [value];
  const words = value.split(' ');
  if (words.some(word => word.length > maxLength)) return undefined;
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

function buildAddressLines(input: RegisteredCarrierAddressInput): string[] {
  const street = cleanText(input.street);
  const houseNumber = cleanText(input.houseNumber);
  const primary = houseNumber && !street.toUpperCase().startsWith(`${houseNumber.toUpperCase()} `)
    ? `${houseNumber} ${street}`.trim()
    : street;
  const secondary = [cleanText(input.building), cleanText(input.unit)].filter(Boolean).join(' ');
  return [primary, secondary, cleanText(input.district)].filter(Boolean);
}

function carrierLines(
  sourceLines: string[],
  maxLength: number,
  carrier: 'ups' | 'dhl',
  errors: CarrierAddressValidationError[],
  warnings: string[],
): string[] {
  const lines: string[] = [];
  for (const sourceLine of sourceLines) {
    const split = splitAtWordBoundaries(sourceLine, maxLength);
    if (!split) {
      errors.push({
        code: 'carrier_limit_exceeded',
        field: 'addressLines',
        carriers: [carrier],
        message: `${carrier.toUpperCase()} address line contains a token longer than ${maxLength} characters.`,
      });
      continue;
    }
    if (split.length > 1) warnings.push(`${carrier}_address_line_reflowed`);
    lines.push(...split);
  }
  if (lines.length > 3) {
    errors.push({
      code: 'too_many_address_lines',
      field: 'addressLines',
      carriers: [carrier],
      message: `${carrier.toUpperCase()} address requires more than three label lines after safe reflow.`,
    });
  }
  return lines;
}

function normalizePhone(phoneValue: string): {
  national: string;
  e164: string;
  extension?: string;
} | undefined {
  const extensionMatch = phoneValue.match(/(?:ext\.?|extension|x)\s*([0-9]{1,4})\s*$/i);
  const extension = extensionMatch?.[1];
  const withoutExtension = extensionMatch ? phoneValue.slice(0, extensionMatch.index) : phoneValue;
  let digits = withoutExtension.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
  if (digits.length !== 10) return undefined;
  return { national: digits, e164: `+1${digits}`, ...(extension ? { extension } : {}) };
}

function isPoBox(lines: string[]): boolean {
  return lines.some(line => /\bP(?:OST)?\.?\s*O(?:FFICE)?\.?\s*BOX\b|\bPO\s+BOX\b/i.test(line));
}

export function convertRegisteredAddressToCarrierWaybill(
  role: CarrierWaybillAddressRole,
  input: RegisteredCarrierAddressInput,
): CarrierWaybillAddressResult {
  const errors: CarrierAddressValidationError[] = [];
  const warnings: string[] = [];
  const recipientName = cleanText(input.recipient);
  const organization = cleanText(input.organization);
  const organizationName = organization || recipientName;
  const countryCode = cleanText(input.countryCode).toUpperCase();
  const stateCode = cleanText(input.state).toUpperCase();
  const cityName = cleanText(input.city);
  const postcodeInput = cleanText(input.postcode).toUpperCase();
  const phoneInput = cleanText(input.phone);
  const email = cleanText(input.email).toLowerCase();
  const sourceAddressLines = buildAddressLines(input);

  if (!recipientName) addRequiredError(errors, 'recipient');
  if (!countryCode) addRequiredError(errors, 'countryCode');
  if (!postcodeInput) addRequiredError(errors, 'postcode');
  if (!stateCode) addRequiredError(errors, 'state');
  if (!cityName) addRequiredError(errors, 'city');
  if (!sourceAddressLines[0]) addRequiredError(errors, 'street');
  if (!phoneInput) addRequiredError(errors, 'phone');

  if (countryCode && countryCode !== 'US') {
    errors.push({
      code: 'unsupported_country',
      field: 'countryCode',
      carriers: ['ups', 'dhl'],
      message: 'This adapter is intentionally limited to US origin and destination addresses in v0.1.',
    });
  }
  if (stateCode && !US_STATE_AND_TERRITORY_CODES.has(stateCode)) {
    errors.push({
      code: 'invalid_format',
      field: 'state',
      carriers: ['ups', 'dhl'],
      message: 'US state must be a valid two-letter state or territory code.',
    });
  }

  const zipDigits = postcodeInput.replace(/[-\s]/g, '');
  if (postcodeInput && !/^\d{5}(?:[-\s]?\d{4})?$/.test(postcodeInput)) {
    errors.push({
      code: 'invalid_format',
      field: 'postcode',
      carriers: ['ups', 'dhl'],
      message: 'US postcode must be ZIP or ZIP+4.',
    });
  }
  const postalCode = zipDigits.length === 9 ? `${zipDigits.slice(0, 5)}-${zipDigits.slice(5)}` : zipDigits;

  if (cityName.length > 30) {
    errors.push({
      code: 'carrier_limit_exceeded',
      field: 'city',
      carriers: ['ups'],
      message: 'UPS city exceeds the 30-character Shipping API limit.',
    });
  }
  if (recipientName.length > 35) {
    errors.push({
      code: 'carrier_limit_exceeded',
      field: 'recipient',
      carriers: ['ups'],
      message: 'UPS recipient name exceeds the 35-character Shipping API limit.',
    });
  }
  if (organizationName.length > 35) {
    errors.push({
      code: 'carrier_limit_exceeded',
      field: 'organization',
      carriers: ['ups'],
      message: 'UPS organization/name exceeds the 35-character Shipping API limit.',
    });
  }
  if (organizationName.length > 100) {
    errors.push({
      code: 'carrier_limit_exceeded',
      field: 'organization',
      carriers: ['dhl'],
      message: 'DHL company name exceeds the 100-character MyDHL limit.',
    });
  }
  if (email && (email.length > 50 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    errors.push({
      code: email.length > 50 ? 'carrier_limit_exceeded' : 'invalid_format',
      field: 'email',
      carriers: email.length > 50 ? ['ups'] : ['ups', 'dhl'],
      message: email.length > 50
        ? 'Email exceeds the UPS 50-character Shipping API limit.'
        : 'Email format is invalid.',
    });
  }

  const phone = phoneInput ? normalizePhone(phoneInput) : undefined;
  if (phoneInput && !phone) {
    errors.push({
      code: 'invalid_format',
      field: 'phone',
      carriers: ['ups', 'dhl'],
      message: 'US phone must contain a 10-digit national number, with an optional 1-digit country prefix and extension.',
    });
  }

  const upsLines = carrierLines(sourceAddressLines, 35, 'ups', errors, warnings);
  const dhlLines = carrierLines(sourceAddressLines, 45, 'dhl', errors, warnings);
  if (errors.length > 0 || !phone || countryCode !== 'US') {
    return { ok: false, version: CARRIER_WAYBILL_ADDRESS_VERSION, errors };
  }

  const normalized: NormalizedUsCarrierAddress = {
    recipientName,
    organizationName,
    countryCode: 'US',
    postalCode,
    stateCode,
    cityName,
    sourceAddressLines,
    phoneE164: phone.e164,
    phoneNational: phone.national,
    ...(phone.extension ? { phoneExtension: phone.extension } : {}),
    ...(email ? { email } : {}),
    residential: input.residential === true,
  };

  const poBox = isPoBox(sourceAddressLines);
  if (poBox) warnings.push('ups_po_box_indicator_added');

  const upsValue: UpsWaybillParty = {
    Name: organizationName,
    AttentionName: recipientName,
    Phone: {
      Number: phone.national,
      ...(phone.extension ? { Extension: phone.extension } : {}),
    },
    ...(email ? { EMailAddress: email } : {}),
    Address: {
      AddressLine: upsLines,
      City: cityName,
      StateProvinceCode: stateCode,
      PostalCode: zipDigits,
      CountryCode: 'US',
      ...(input.residential === true ? { ResidentialAddressIndicator: '' as const } : {}),
      ...(poBox ? { POBoxIndicator: '' as const } : {}),
    },
  };

  const dhlValue: DhlWaybillParty = {
    postalAddress: {
      postalCode,
      cityName,
      countryCode: 'US',
      provinceCode: stateCode,
      addressLine1: dhlLines[0],
      ...(dhlLines[1] ? { addressLine2: dhlLines[1] } : {}),
      ...(dhlLines[2] ? { addressLine3: dhlLines[2] } : {}),
    },
    contactInformation: {
      ...(email ? { email } : {}),
      phone: phone.e164,
      companyName: organizationName,
      fullName: recipientName,
    },
    typeCode: organization ? 'business' : 'private',
  };

  return {
    ok: true,
    version: CARRIER_WAYBILL_ADDRESS_VERSION,
    role,
    normalized,
    carrierPayloads: {
      ups: { container: role === 'shipper' ? 'ShipFrom' : 'ShipTo', value: upsValue },
      dhl: { container: role === 'shipper' ? 'shipperDetails' : 'receiverDetails', value: dhlValue },
    },
    warnings: [...new Set(warnings)],
    privacy: {
      serverSideOnly: true,
      containsRawAddress: true,
      safeForMerchantCallback: false,
      safeForClientLogging: false,
    },
    sourceSpecifications: { ups: UPS_SPEC_URL, dhl: DHL_SPEC_URL },
  };
}
