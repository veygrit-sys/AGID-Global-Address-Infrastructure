import {
  countryName,
  normalizeEnglishAddressBuildingName,
  normalizeEnglishAddressPart,
  renderEnglishPostalAddress,
  renderStreetAddressLine,
} from './addressEnglish';
import type { CanonicalAddress } from './addressRendering';

export type EnglishShippingMode = 'domestic' | 'international-shipping';

export type EnglishShippingProfileId =
  | 'us-postal-presentation-v1'
  | 'ca-postal-presentation-v1'
  | 'gb-postal-presentation-v1'
  | 'au-postal-presentation-v1'
  | 'nz-postal-presentation-v1'
  | 'ie-postal-presentation-v1'
  | 'outer-circle-english-postal-presentation-v1'
  | 'generic-english-postal-presentation-v1';

export type EnglishShippingPostcodePolicy = 'required' | 'optional' | 'not-used';

export type EnglishShippingLayout =
  | 'north-america'
  | 'united-kingdom'
  | 'australasia'
  | 'ireland'
  | 'south-asia'
  | 'singapore'
  | 'southeast-asia'
  | 'africa'
  | 'caribbean'
  | 'pacific'
  | 'territory'
  | 'gulf'
  | 'generic';

export type EnglishShippingProfile = {
  countryCode: string;
  countryName: string;
  profileId: EnglishShippingProfileId;
  authority: string;
  evidenceUrl: string;
  evidenceCheckedOn: '2026-07-25';
  evidenceScope: 'address-presentation-only';
  evidenceVersion: string;
  postcodePolicy: EnglishShippingPostcodePolicy;
  postcodePattern: string | null;
  layout: EnglishShippingLayout;
};

export type EnglishShippingWarning =
  | 'delivery_point_not_validated'
  | 'unsupported_country_profile'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'postcode_format_unconfirmed'
  | 'postcode_not_used_by_destination'
  | 'subnational_area_unrecognized'
  | 'line_length_exceeds_40_characters';

export type EnglishShippingAddressResult = {
  mode: EnglishShippingMode;
  profile: EnglishShippingProfile;
  normalized: CanonicalAddress;
  lines: string[];
  formatted: string;
  changedFields: Array<keyof CanonicalAddress>;
  appliedRules: string[];
  warnings: EnglishShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
};

type CoreCountryCode = 'US' | 'CA' | 'GB' | 'AU' | 'NZ' | 'IE';

type PostcodePlacement = 'before-locality' | 'after-locality' | 'separate';

type ExtendedCountrySpec = {
  countryCode: string;
  countryName: string;
  authority: string;
  evidenceUrl: string;
  postcodePolicy: EnglishShippingPostcodePolicy;
  postcodePattern: string | null;
  layout: Exclude<EnglishShippingLayout, 'north-america' | 'united-kingdom' | 'australasia' | 'ireland' | 'generic'>;
  postcodePlacement: PostcodePlacement;
};

const UPU_PAS_BASE =
  'https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit';
const UPU_PAS_INDEX =
  'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions';

const upuCountrySheet = (slug: string) => `${UPU_PAS_BASE}/${slug}En.pdf`;

function extendedSpec(
  countryCode: string,
  countryNameValue: string,
  upuSlug: string | null,
  layout: ExtendedCountrySpec['layout'],
  postcodePolicy: EnglishShippingPostcodePolicy,
  postcodePattern: string | null,
  postcodePlacement: PostcodePlacement = 'after-locality',
  authority = 'Universal Postal Union Postal Addressing Systems',
): ExtendedCountrySpec {
  return {
    countryCode,
    countryName: countryNameValue,
    authority,
    evidenceUrl: upuSlug ? upuCountrySheet(upuSlug) : UPU_PAS_INDEX,
    postcodePolicy,
    postcodePattern,
    layout,
    postcodePlacement,
  };
}

const EXTENDED_COUNTRY_SPECS = [
  extendedSpec('IN', 'India', 'ind', 'south-asia', 'required', '^\\d{6}$', 'separate'),
  extendedSpec('PK', 'Pakistan', 'pak', 'south-asia', 'required', '^\\d{5}$'),
  extendedSpec('BD', 'Bangladesh', 'bgd', 'south-asia', 'required', '^\\d{4}$'),
  extendedSpec('LK', 'Sri Lanka', 'lka', 'south-asia', 'required', '^\\d{5}$'),
  extendedSpec('NP', 'Nepal', 'npl', 'south-asia', 'required', '^\\d{5}$'),
  extendedSpec('BT', 'Bhutan', 'btn', 'south-asia', 'required', '^\\d{5}$'),
  extendedSpec('MV', 'Maldives', 'mdv', 'south-asia', 'required', '^\\d{5}$'),
  extendedSpec('SG', 'Singapore', 'sgp', 'singapore', 'required', '^\\d{6}$'),
  extendedSpec('MY', 'Malaysia', 'mys', 'southeast-asia', 'required', '^\\d{5}$', 'before-locality'),
  extendedSpec('PH', 'Philippines', 'phl', 'southeast-asia', 'required', '^\\d{4}$'),
  extendedSpec('BN', 'Brunei Darussalam', 'brn', 'southeast-asia', 'required', '^[A-Z]{2}\\d{4}$', 'before-locality'),
  extendedSpec('MM', 'Myanmar', 'mmr', 'southeast-asia', 'required', '^\\d{5}$'),
  extendedSpec('HK', 'Hong Kong', 'hkg', 'southeast-asia', 'not-used', null),

  extendedSpec('NG', 'Nigeria', 'nga', 'africa', 'required', '^\\d{6}$'),
  extendedSpec('GH', 'Ghana', 'gha', 'africa', 'not-used', null),
  extendedSpec('SL', 'Sierra Leone', 'sle', 'africa', 'optional', '^\\d{4}$'),
  extendedSpec('LR', 'Liberia', 'lbr', 'africa', 'optional', '^\\d{4}$'),
  extendedSpec('GM', 'The Gambia', 'gmb', 'africa', 'not-used', null),
  extendedSpec('CM', 'Cameroon', 'cmr', 'africa', 'required', '^\\d{5}$'),
  extendedSpec('ER', 'Eritrea', 'eri', 'africa', 'not-used', null),
  extendedSpec('ET', 'Ethiopia', 'eth', 'africa', 'required', '^\\d{4}$'),
  extendedSpec('KE', 'Kenya', 'ken', 'africa', 'required', '^\\d{5}$', 'before-locality'),
  extendedSpec('MU', 'Mauritius', 'mus', 'africa', 'required', '^\\d{5}$'),
  extendedSpec('RW', 'Rwanda', 'rwa', 'africa', 'optional', '^\\d{5}$'),
  extendedSpec('SC', 'Seychelles', 'syc', 'africa', 'not-used', null),
  extendedSpec('SO', 'Somalia', 'som', 'africa', 'optional', '^[A-Z]{2} \\d{5}$'),
  extendedSpec('SS', 'South Sudan', 'ssd', 'africa', 'not-used', null),
  extendedSpec('TZ', 'United Republic of Tanzania', 'tza', 'africa', 'required', '^\\d{5}$'),
  extendedSpec('UG', 'Uganda', 'uga', 'africa', 'required', '^\\d{5}$'),
  extendedSpec('ZA', 'South Africa', 'zaf', 'africa', 'required', '^\\d{4}$'),
  extendedSpec('ZW', 'Zimbabwe', 'zwe', 'africa', 'not-used', null),
  extendedSpec('ZM', 'Zambia', 'zmb', 'africa', 'required', '^\\d{5}$'),
  extendedSpec('BW', 'Botswana', 'bwa', 'africa', 'not-used', null),
  extendedSpec('NA', 'Namibia', 'nam', 'africa', 'required', '^\\d{5}$'),
  extendedSpec('MW', 'Malawi', 'mwi', 'africa', 'not-used', null),
  extendedSpec('LS', 'Lesotho', 'lso', 'africa', 'required', '^\\d{3}$'),
  extendedSpec('SZ', 'Eswatini', 'swz', 'africa', 'required', '^[A-Z]\\d{3}$'),

  extendedSpec('JM', 'Jamaica', 'jam', 'caribbean', 'not-used', null),
  extendedSpec('TT', 'Trinidad and Tobago', 'tto', 'caribbean', 'required', '^\\d{6}$'),
  extendedSpec('BB', 'Barbados', 'brb', 'caribbean', 'required', '^BB\\d{5}$'),
  extendedSpec('BS', 'Bahamas', 'bhs', 'caribbean', 'not-used', null),
  extendedSpec('BZ', 'Belize', 'blz', 'caribbean', 'not-used', null),
  extendedSpec('GY', 'Guyana', 'guy', 'caribbean', 'not-used', null),
  extendedSpec('AG', 'Antigua and Barbuda', 'atg', 'caribbean', 'not-used', null),
  extendedSpec('LC', 'Saint Lucia', 'lca', 'caribbean', 'optional', '^LC\\d{2}\\s?\\d{3}$'),
  extendedSpec('GD', 'Grenada', 'grd', 'caribbean', 'not-used', null),
  extendedSpec('DM', 'Dominica', 'dma', 'caribbean', 'not-used', null),
  extendedSpec('VC', 'Saint Vincent and the Grenadines', 'vct', 'caribbean', 'optional', '^VC\\d{4}$'),
  extendedSpec('KN', 'Saint Kitts and Nevis', 'kna', 'caribbean', 'optional', '^KN\\d{4}$'),
  extendedSpec('BM', 'Bermuda', 'bmu', 'territory', 'required', '^[A-Z]{2}\\s?\\d{2}$'),
  extendedSpec('AI', 'Anguilla', 'aia', 'territory', 'required', '^AI-2640$'),
  extendedSpec('KY', 'Cayman Islands', 'cym', 'territory', 'required', '^KY\\d-\\d{4}$'),
  extendedSpec('MS', 'Montserrat', 'msr', 'territory', 'required', '^MSR\\s?\\d{4}$'),
  extendedSpec('TC', 'Turks and Caicos Islands', 'tca', 'territory', 'required', '^TKCA\\s1ZZ$'),
  extendedSpec('VG', 'British Virgin Islands', 'vgb', 'territory', 'required', '^VG\\d{4}$'),
  extendedSpec('VI', 'United States Virgin Islands', null, 'territory', 'required', '^\\d{5}(?:-\\d{4})?$', 'after-locality', 'United States Postal Service'),

  extendedSpec('PG', 'Papua New Guinea', 'png', 'pacific', 'required', '^\\d{3}$'),
  extendedSpec('FJ', 'Fiji', 'fji', 'pacific', 'not-used', null),
  extendedSpec('SB', 'Solomon Islands', 'slb', 'pacific', 'not-used', null),
  extendedSpec('VU', 'Vanuatu', 'vut', 'pacific', 'not-used', null),
  extendedSpec('WS', 'Samoa', 'wsm', 'pacific', 'not-used', null),
  extendedSpec('TO', 'Tonga', 'ton', 'pacific', 'not-used', null),
  extendedSpec('FM', 'Federated States of Micronesia', null, 'pacific', 'required', '^\\d{5}(?:-\\d{4})?$', 'after-locality', 'United States Postal Service'),
  extendedSpec('PW', 'Palau', null, 'pacific', 'required', '^\\d{5}(?:-\\d{4})?$', 'after-locality', 'United States Postal Service'),
  extendedSpec('MH', 'Marshall Islands', null, 'pacific', 'required', '^\\d{5}(?:-\\d{4})?$', 'after-locality', 'United States Postal Service'),
  extendedSpec('KI', 'Kiribati', 'kir', 'pacific', 'not-used', null),
  extendedSpec('TV', 'Tuvalu', 'tuv', 'pacific', 'not-used', null),
  extendedSpec('NR', 'Nauru', 'nru', 'pacific', 'not-used', null),
  extendedSpec('NF', 'Norfolk Island', null, 'territory', 'required', '^2899$', 'after-locality', 'Australia Post'),
  extendedSpec('CX', 'Christmas Island', null, 'territory', 'required', '^6798$', 'after-locality', 'Australia Post'),
  extendedSpec('CC', 'Cocos (Keeling) Islands', null, 'territory', 'required', '^6799$', 'after-locality', 'Australia Post'),
  extendedSpec('CK', 'Cook Islands', 'cok', 'pacific', 'not-used', null, 'after-locality', 'Cook Islands Post'),
  extendedSpec('TK', 'Tokelau', 'tkl', 'pacific', 'not-used', null, 'after-locality', 'New Zealand Post'),
  extendedSpec('NU', 'Niue', 'niu', 'pacific', 'not-used', null, 'after-locality', 'Niue Post'),
  extendedSpec('PN', 'Pitcairn', 'pcn', 'territory', 'required', '^PCRN\\s1ZZ$', 'after-locality', 'Pitcairn Islands Postal Service'),
  extendedSpec('AQ', 'Antarctica', null, 'territory', 'optional', null),
  extendedSpec('AS', 'American Samoa', null, 'territory', 'required', '^\\d{5}(?:-\\d{4})?$', 'after-locality', 'United States Postal Service'),
  extendedSpec('GU', 'Guam', null, 'territory', 'required', '^\\d{5}(?:-\\d{4})?$', 'after-locality', 'United States Postal Service'),
  extendedSpec('MP', 'Northern Mariana Islands', null, 'territory', 'required', '^\\d{5}(?:-\\d{4})?$', 'after-locality', 'United States Postal Service'),
  extendedSpec('UM', 'United States Minor Outlying Islands', null, 'territory', 'optional', null, 'after-locality', 'United States Postal Service'),
  extendedSpec('FK', 'Falkland Islands', 'flk', 'territory', 'required', '^FIQQ\\s1ZZ$'),
  extendedSpec('GS', 'South Georgia and the South Sandwich Islands', null, 'territory', 'required', '^SIQQ\\s1ZZ$'),
  extendedSpec('GG', 'Guernsey', 'ggy', 'territory', 'required', '^GY\\d[\\dA-Z]?\\s\\d[A-Z]{2}$'),
  extendedSpec('IM', 'Isle of Man', 'imn', 'territory', 'required', '^IM\\d[\\dA-Z]?\\s\\d[A-Z]{2}$'),
  extendedSpec('JE', 'Jersey', 'jey', 'territory', 'required', '^JE\\d[\\dA-Z]?\\s\\d[A-Z]{2}$'),
  extendedSpec('GI', 'Gibraltar', 'gib', 'territory', 'required', '^GX11\\s1AA$'),
  extendedSpec('SBA', 'Sovereign Base Areas of Akrotiri and Dhekelia', null, 'territory', 'optional', null),
  extendedSpec('IO', 'British Indian Ocean Territory', 'iot', 'territory', 'required', '^BBND\\s1ZZ$'),
  extendedSpec('SH', 'Saint Helena', 'shn', 'territory', 'required', '^STHL\\s1ZZ$'),
  extendedSpec('AC', 'Ascension Island', null, 'territory', 'required', '^ASCN\\s1ZZ$'),
  extendedSpec('TA', 'Tristan da Cunha', null, 'territory', 'required', '^TDCU\\s1ZZ$'),
  extendedSpec('AE', 'United Arab Emirates', 'are', 'gulf', 'not-used', null),
  extendedSpec('QA', 'Qatar', 'qat', 'gulf', 'not-used', null),
  extendedSpec('BH', 'Bahrain', 'bhr', 'gulf', 'optional', '^\\d{3,4}$'),
] as const satisfies readonly ExtendedCountrySpec[];

export const EXTENDED_ENGLISH_SHIPPING_COUNTRIES = EXTENDED_COUNTRY_SPECS.map(
  spec => spec.countryCode,
);

const EXTENDED_SPEC_BY_COUNTRY = new Map(
  EXTENDED_COUNTRY_SPECS.map(spec => [spec.countryCode, spec]),
);

const CORE_PROFILES: Record<CoreCountryCode, EnglishShippingProfile> = {
  US: {
    countryCode: 'US',
    countryName: 'United States',
    profileId: 'us-postal-presentation-v1',
    authority: 'United States Postal Service',
    evidenceUrl: 'https://pe.usps.com/text/pub28/',
    evidenceCheckedOn: '2026-07-25',
    evidenceScope: 'address-presentation-only',
    evidenceVersion: 'Publication 28, web edition reviewed 2026-07-25',
    postcodePolicy: 'required',
    postcodePattern: '^\\d{5}(?:-\\d{4})?$',
    layout: 'north-america',
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    profileId: 'ca-postal-presentation-v1',
    authority: 'Canada Post',
    evidenceUrl:
      'https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/important-information.page',
    evidenceCheckedOn: '2026-07-25',
    evidenceScope: 'address-presentation-only',
    evidenceVersion: 'Canada Post addressing guidelines reviewed 2026-07-25',
    postcodePolicy: 'required',
    postcodePattern:
      '^[ABCEGHJKLMNPRSTVXY]\\d[ABCEGHJKLMNPRSTVWXYZ]\\s\\d[ABCEGHJKLMNPRSTVWXYZ]\\d$',
    layout: 'north-america',
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    profileId: 'gb-postal-presentation-v1',
    authority: 'Royal Mail',
    evidenceUrl:
      'https://www.royalmailtechnical.com/rmt_docs/User_Guides_2024/Guide_For_Clear_Addressing_20240402.pdf',
    evidenceCheckedOn: '2026-07-25',
    evidenceScope: 'address-presentation-only',
    evidenceVersion: 'Royal Mail clear addressing guide, 2024-04-02',
    postcodePolicy: 'required',
    postcodePattern: '^(?:GIR 0AA|[A-Z]{1,2}\\d[A-Z\\d]?\\s\\d[A-Z]{2})$',
    layout: 'united-kingdom',
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    profileId: 'au-postal-presentation-v1',
    authority: 'Australia Post',
    evidenceUrl: 'https://auspost.com.au/personal/sending/sending-guidelines/addressing-guidelines',
    evidenceCheckedOn: '2026-07-25',
    evidenceScope: 'address-presentation-only',
    evidenceVersion: 'Australia Post addressing guidelines reviewed 2026-07-25',
    postcodePolicy: 'required',
    postcodePattern: '^\\d{4}$',
    layout: 'australasia',
  },
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    profileId: 'nz-postal-presentation-v1',
    authority: 'New Zealand Post',
    evidenceUrl: 'https://www.nzpost.co.nz/personal/sending-in-nz/how-to-address-mail',
    evidenceCheckedOn: '2026-07-25',
    evidenceScope: 'address-presentation-only',
    evidenceVersion: 'New Zealand Post addressing guide reviewed 2026-07-25',
    postcodePolicy: 'required',
    postcodePattern: '^\\d{4}$',
    layout: 'australasia',
  },
  IE: {
    countryCode: 'IE',
    countryName: 'Ireland',
    profileId: 'ie-postal-presentation-v1',
    authority: 'An Post',
    evidenceUrl: 'https://www.anpost.com/Post-Parcels/Sending/Correct-Address',
    evidenceCheckedOn: '2026-07-25',
    evidenceScope: 'address-presentation-only',
    evidenceVersion: 'An Post correct addressing guide reviewed 2026-07-25',
    postcodePolicy: 'required',
    postcodePattern: '^[AC-FHKNPRTV-Y]\\d{2}\\s[0-9AC-FHKNPRTV-Y]{4}$',
    layout: 'ireland',
  },
};

const GENERIC_PROFILE: EnglishShippingProfile = {
  countryCode: '',
  countryName: '',
  profileId: 'generic-english-postal-presentation-v1',
  authority: 'AGID conservative fallback',
  evidenceUrl: '',
  evidenceCheckedOn: '2026-07-25',
  evidenceScope: 'address-presentation-only',
  evidenceVersion: 'No country-specific evidence registered',
  postcodePolicy: 'optional',
  postcodePattern: null,
  layout: 'generic',
};

const US_SUBDIVISIONS = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
  'American Samoa': 'AS',
  Guam: 'GU',
  'Northern Mariana Islands': 'MP',
  'Puerto Rico': 'PR',
  'U.S. Virgin Islands': 'VI',
} as const;

const CA_SUBDIVISIONS = {
  Alberta: 'AB',
  'British Columbia': 'BC',
  Manitoba: 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT',
  'Nova Scotia': 'NS',
  Nunavut: 'NU',
  Ontario: 'ON',
  'Prince Edward Island': 'PE',
  Quebec: 'QC',
  Saskatchewan: 'SK',
  Yukon: 'YT',
} as const;

const AU_SUBDIVISIONS = {
  'Australian Capital Territory': 'ACT',
  'New South Wales': 'NSW',
  'Northern Territory': 'NT',
  Queensland: 'QLD',
  'South Australia': 'SA',
  Tasmania: 'TAS',
  Victoria: 'VIC',
  'Western Australia': 'WA',
} as const;

const normalizeLookupKey = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');

function createSubdivisionLookup(values: Record<string, string>) {
  const lookup = new Map<string, string>();
  for (const [name, code] of Object.entries(values)) {
    lookup.set(normalizeLookupKey(name), code);
    lookup.set(normalizeLookupKey(code), code);
  }
  return lookup;
}

const SUBDIVISION_LOOKUPS: Partial<Record<CoreCountryCode, Map<string, string>>> = {
  US: createSubdivisionLookup(US_SUBDIVISIONS),
  CA: createSubdivisionLookup(CA_SUBDIVISIONS),
  AU: createSubdivisionLookup(AU_SUBDIVISIONS),
};

const CORE_CODES = new Set<CoreCountryCode>(['US', 'CA', 'GB', 'AU', 'NZ', 'IE']);
const EXTENDED_CODES = new Set(EXTENDED_ENGLISH_SHIPPING_COUNTRIES);

const BUILDING_FIELD_KEYS = new Set([
  'building',
  'organization',
  'company',
  'poi',
  'amenity',
  'shop',
  'office',
  'tourism',
]);

const OFFICIAL_NAME_FIELD_KEYS = new Set([
  'building',
  'organization',
  'company',
  'poi',
  'amenity',
  'shop',
  'office',
  'tourism',
  'city',
  'district',
  'subdistrict',
  'suburb',
  'road',
  'street',
  'address_line_1',
  'address_line_2',
  'house_number',
  'unit',
]);

const clean = (value: unknown) =>
  String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();

const canonicalCountryCode = (value: string) => {
  const code = clean(value).toUpperCase();
  return code === 'UK' ? 'GB' : code;
};

function normalizeDeliveryDesignator(value: string, countryCode: string) {
  const poBox = value.match(/^(?:P\.?\s*O\.?|POST\s+OFFICE)\s+BOX\s+([A-Z0-9/-]+)$/i);
  if (poBox) return `PO BOX ${poBox[1].toUpperCase()}`;

  const code = canonicalCountryCode(countryCode);
  const unit = value.match(
    /^(APARTMENT|APT|SUITE|STE|UNIT|FLOOR|FL|LEVEL|ROOM|RM|FLAT)\s+([A-Z0-9/-]+)$/i,
  );
  if (!unit) return value;

  const token = unit[1].toUpperCase();
  const number = unit[2].toUpperCase();
  if (code === 'US') {
    const usDesignator: Record<string, string> = {
      APARTMENT: 'APT',
      APT: 'APT',
      SUITE: 'STE',
      STE: 'STE',
      UNIT: 'UNIT',
      FLOOR: 'FL',
      FL: 'FL',
      LEVEL: 'FL',
      ROOM: 'RM',
      RM: 'RM',
      FLAT: 'APT',
    };
    return `${usDesignator[token]} ${number}`;
  }
  if (code === 'CA') {
    const caDesignator: Record<string, string> = {
      APARTMENT: 'APT',
      APT: 'APT',
      SUITE: 'SUITE',
      STE: 'SUITE',
      UNIT: 'UNIT',
      FLOOR: 'FL',
      FL: 'FL',
      LEVEL: 'FL',
      ROOM: 'RM',
      RM: 'RM',
      FLAT: 'APT',
    };
    return `${caDesignator[token]} ${number}`;
  }
  if (code === 'NZ') {
    const nzDesignator: Record<string, string> = {
      APARTMENT: 'Apt',
      APT: 'Apt',
      SUITE: 'Ste',
      STE: 'Ste',
      UNIT: 'Unit',
      FLOOR: 'Fl',
      FL: 'Fl',
      LEVEL: 'L',
      ROOM: 'Rm',
      RM: 'Rm',
      FLAT: 'Flat',
    };
    return `${nzDesignator[token]} ${number}`;
  }
  const sharedDesignator: Record<string, string> = {
    APARTMENT: 'APT',
    APT: 'APT',
    SUITE: 'SUITE',
    STE: 'SUITE',
    UNIT: 'UNIT',
    FLOOR: 'FLOOR',
    FL: 'FLOOR',
    LEVEL: 'LEVEL',
    ROOM: 'ROOM',
    RM: 'ROOM',
    FLAT: 'FLAT',
  };
  return `${sharedDesignator[token]} ${number}`;
}

function normalizePostcode(value: string, countryCode: string) {
  const original = clean(value).toUpperCase();
  if (!original) return { value: '', confirmed: false };
  const code = canonicalCountryCode(countryCode);

  if (code === 'US') {
    const compact = original.replace(/[\s-]+/g, '');
    if (/^\d{5}$/.test(compact)) return { value: compact, confirmed: true };
    if (/^\d{9}$/.test(compact)) {
      return { value: `${compact.slice(0, 5)}-${compact.slice(5)}`, confirmed: true };
    }
  }
  if (code === 'CA') {
    const compact = original.replace(/[\s-]+/g, '');
    if (/^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\d[ABCEGHJKLMNPRSTVWXYZ]\d$/.test(compact)) {
      return { value: `${compact.slice(0, 3)} ${compact.slice(3)}`, confirmed: true };
    }
  }
  if (code === 'GB') {
    const compact = original.replace(/\s+/g, '');
    const formatted =
      compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;
    const confirmed =
      formatted === 'GIR 0AA' ||
      /^[A-Z]{1,2}\d[A-Z\d]?\s\d[A-Z]{2}$/.test(formatted);
    return { value: formatted, confirmed };
  }
  if (code === 'AU' || code === 'NZ') {
    return { value: original, confirmed: /^\d{4}$/.test(original) };
  }
  if (code === 'IE') {
    const compact = original.replace(/\s+/g, '');
    const formatted =
      compact.length === 7 ? `${compact.slice(0, 3)} ${compact.slice(3)}` : original;
    return {
      value: formatted,
      confirmed: /^[AC-FHKNPRTV-Y]\d{2}\s[0-9AC-FHKNPRTV-Y]{4}$/.test(formatted),
    };
  }

  const extendedSpec = EXTENDED_SPEC_BY_COUNTRY.get(code);
  if (extendedSpec) {
    if (extendedSpec.postcodePolicy === 'not-used') {
      return { value: original, confirmed: false };
    }

    const compact = original.replace(/[\s-]+/g, '');
    const fixedPostcodes: Record<string, string> = {
      AI2640: 'AI-2640',
      TKCA1ZZ: 'TKCA 1ZZ',
      PCRN1ZZ: 'PCRN 1ZZ',
      FIQQ1ZZ: 'FIQQ 1ZZ',
      SIQQ1ZZ: 'SIQQ 1ZZ',
      GX111AA: 'GX11 1AA',
      BBND1ZZ: 'BBND 1ZZ',
      STHL1ZZ: 'STHL 1ZZ',
      ASCN1ZZ: 'ASCN 1ZZ',
      TDCU1ZZ: 'TDCU 1ZZ',
    };
    let formatted = fixedPostcodes[compact] ?? compact;
    if (/^(?:GY|IM|JE)\d[\dA-Z]?\d[A-Z]{2}$/.test(compact)) {
      formatted = `${compact.slice(0, -3)} ${compact.slice(-3)}`;
    } else if (/^[A-Z]{2}\d{2}$/.test(compact) && code === 'BM') {
      formatted = `${compact.slice(0, 2)} ${compact.slice(2)}`;
    } else if (/^MSR\d{4}$/.test(compact)) {
      formatted = `${compact.slice(0, 3)} ${compact.slice(3)}`;
    } else if (/^LC\d{5}$/.test(compact)) {
      formatted = `${compact.slice(0, 4)} ${compact.slice(4)}`;
    } else if (/^\d{9}$/.test(compact) && ['AS', 'FM', 'GU', 'MH', 'MP', 'PW', 'VI'].includes(code)) {
      formatted = `${compact.slice(0, 5)}-${compact.slice(5)}`;
    }

    return {
      value: formatted,
      confirmed: extendedSpec.postcodePattern
        ? new RegExp(extendedSpec.postcodePattern).test(formatted)
        : extendedSpec.postcodePolicy === 'optional',
    };
  }

  if (CORE_CODES.has(code as CoreCountryCode)) {
    return { value: original, confirmed: false };
  }
  return { value: original, confirmed: true };
}

function normalizeField(countryCode: string, fieldKey: string, value: unknown) {
  const code = canonicalCountryCode(countryCode);
  const text = clean(value);
  if (!text) return '';

  if (fieldKey === 'country_code') return code;
  if (fieldKey === 'country') return countryName(code, text);
  if (fieldKey === 'postcode' || fieldKey === 'postal_code' || fieldKey === 'zip') {
    return normalizePostcode(text, code).value;
  }

  const preserveOfficialName =
    (CORE_CODES.has(code as CoreCountryCode) || EXTENDED_CODES.has(code)) &&
    OFFICIAL_NAME_FIELD_KEYS.has(fieldKey);
  const normalized = preserveOfficialName
    ? text
    : BUILDING_FIELD_KEYS.has(fieldKey)
      ? normalizeEnglishAddressBuildingName(text, code)
      : normalizeEnglishAddressPart(text, code);

  if (fieldKey === 'state' || fieldKey === 'province' || fieldKey === 'region') {
    return SUBDIVISION_LOOKUPS[code as CoreCountryCode]?.get(normalizeLookupKey(normalized)) ?? normalized;
  }

  if (
    BUILDING_FIELD_KEYS.has(fieldKey) ||
    fieldKey === 'road' ||
    fieldKey === 'street' ||
    fieldKey === 'address_line_1' ||
    fieldKey === 'address_line_2' ||
    fieldKey === 'unit'
  ) {
    return normalizeDeliveryDesignator(normalized, code);
  }

  return normalized;
}

export function normalizeEnglishShippingField(input: {
  countryCode: string;
  fieldKey: string;
  text: unknown;
}) {
  return normalizeField(
    input.countryCode,
    input.fieldKey.trim().toLowerCase(),
    input.text,
  );
}

export function getEnglishShippingProfile(countryCode: string): EnglishShippingProfile {
  const code = canonicalCountryCode(countryCode);
  if (CORE_CODES.has(code as CoreCountryCode)) return CORE_PROFILES[code as CoreCountryCode];
  const extendedSpec = EXTENDED_SPEC_BY_COUNTRY.get(code);
  if (extendedSpec) {
    return {
      countryCode: code,
      countryName: extendedSpec.countryName,
      profileId: 'outer-circle-english-postal-presentation-v1',
      authority: extendedSpec.authority,
      evidenceUrl: extendedSpec.evidenceUrl,
      evidenceCheckedOn: '2026-07-25',
      evidenceScope: 'address-presentation-only',
      evidenceVersion: 'UPU PAS or parent postal network guidance reviewed 2026-07-25',
      postcodePolicy: extendedSpec.postcodePolicy,
      postcodePattern: extendedSpec.postcodePattern,
      layout: extendedSpec.layout,
    };
  }

  return {
    ...GENERIC_PROFILE,
    countryCode: code,
    countryName: countryName(code, code),
  };
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  return lines
    .map(line => String(line ?? '').normalize('NFKC').replace(/[\r\n]+/g, ' ').trim())
    .filter(Boolean)
    .filter(line => {
      const key = normalizeLookupKey(line);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function localityParts(data: CanonicalAddress) {
  return uniqueLines([data.subdistrict || data.suburb, data.district]);
}

function extendedLocalityParts(data: CanonicalAddress) {
  return uniqueLines([data.subdistrict, data.suburb, data.district]);
}

function uniqueInlineParts(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values
    .map(clean)
    .filter(Boolean)
    .filter(value => {
      const key = normalizeLookupKey(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function prefixedComponent(value: string | undefined, label: string) {
  const text = clean(value);
  if (!text) return '';
  return new RegExp(`^${label}\\b`, 'i').test(text) ? text : `${label} ${text}`;
}

function postalLocalityLine(
  locality: string,
  postcode: string,
  placement: PostcodePlacement,
) {
  const parts =
    placement === 'before-locality'
      ? uniqueInlineParts([postcode, locality])
      : uniqueInlineParts([locality, postcode]);
  return parts.join(' ');
}

function renderCoreLines(data: CanonicalAddress, code: CoreCountryCode) {
  const organization = data.building || data.poi;
  const street = renderStreetAddressLine(code, data.road, data.house_number);
  const localParts = localityParts(data);

  if (code === 'US') {
    return uniqueLines([
      organization,
      street,
      ...localParts,
      [data.city, data.state, data.postcode].filter(Boolean).join(' ').toUpperCase(),
    ]);
  }
  if (code === 'CA') {
    const lastLine = [
      [data.city, data.state].filter(Boolean).join(' '),
      data.postcode,
    ]
      .filter(Boolean)
      .join('  ')
      .toUpperCase();
    return uniqueLines([organization, street, ...localParts, lastLine]);
  }
  if (code === 'GB') {
    return uniqueLines([
      organization,
      street,
      ...localParts,
      data.city.toUpperCase(),
      data.postcode.toUpperCase(),
    ]);
  }
  if (code === 'AU') {
    const deliveryLocality =
      data.subdistrict || data.suburb || data.district || data.city;
    const lastLine = [deliveryLocality, data.state, data.postcode]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    return uniqueLines([organization, street, lastLine]);
  }
  if (code === 'NZ') {
    const suburb = data.subdistrict || data.suburb || data.district;
    return uniqueLines([
      organization,
      street,
      suburb,
      [data.city, data.postcode].filter(Boolean).join(' '),
    ]);
  }

  return uniqueLines([
    organization,
    street,
    ...localParts,
    data.city,
    data.state,
    data.postcode.toUpperCase(),
  ]);
}

function renderExtendedLines(data: CanonicalAddress, spec: ExtendedCountrySpec) {
  const organization = uniqueLines([data.poi, data.building]);
  const premiseDetails = uniqueInlineParts([
    prefixedComponent(data.block, 'BLOCK'),
    prefixedComponent(data.floor, 'FLOOR'),
    prefixedComponent(data.unit, 'UNIT'),
  ]).join(', ');
  const street = renderStreetAddressLine(spec.countryCode, data.road, data.house_number);
  const poBox = data.po_box ? prefixedComponent(data.po_box, 'PO BOX') : '';
  const localParts = extendedLocalityParts(data);
  const cityAndState = uniqueInlineParts([data.city, data.state]).join(' ');
  const cityAndPostcode = postalLocalityLine(
    data.city,
    data.postcode,
    spec.postcodePlacement,
  );

  if (spec.layout === 'south-asia') {
    if (spec.postcodePlacement === 'separate') {
      return uniqueLines([
        ...organization,
        premiseDetails,
        poBox,
        street,
        ...localParts,
        data.city,
        data.state,
        data.postcode,
      ]);
    }
    return uniqueLines([
      ...organization,
      premiseDetails,
      poBox,
      street,
      ...localParts,
      uniqueInlineParts([data.city, data.state, data.postcode]).join(' '),
    ]);
  }

  if (spec.layout === 'singapore') {
    return uniqueLines([
      ...organization,
      premiseDetails,
      poBox,
      street,
      ...localParts,
      uniqueInlineParts(['SINGAPORE', data.postcode]).join(' '),
    ]);
  }

  if (spec.layout === 'southeast-asia') {
    if (spec.countryCode === 'PH') {
      return uniqueLines([
        ...organization,
        premiseDetails,
        poBox,
        street,
        ...localParts,
        data.city,
        uniqueInlineParts([data.state, data.postcode]).join(' '),
      ]);
    }
    return uniqueLines([
      ...organization,
      premiseDetails,
      poBox,
      street,
      ...localParts,
      cityAndPostcode,
      data.state,
    ]);
  }

  if (spec.layout === 'africa') {
    const deliveryLocality = localParts.at(-1) || data.city;
    const remainingLocality = localParts.filter(part => part !== deliveryLocality);
    if (spec.countryCode === 'ZA' && data.postcode) {
      return uniqueLines([
        ...organization,
        premiseDetails,
        poBox,
        street,
        ...remainingLocality,
        deliveryLocality.toUpperCase(),
        data.postcode,
      ]);
    }
    return uniqueLines([
      ...organization,
      premiseDetails,
      poBox,
      street,
      ...remainingLocality,
      postalLocalityLine(deliveryLocality, data.postcode, spec.postcodePlacement),
      deliveryLocality === data.city ? '' : data.city,
      data.state,
    ]);
  }

  if (spec.layout === 'gulf') {
    const deliveryArea = localParts.at(-1) || '';
    const remainingAreas = localParts.filter(part => part !== deliveryArea);
    return uniqueLines([
      ...organization,
      premiseDetails,
      street,
      ...remainingAreas,
      poBox,
      uniqueInlineParts([deliveryArea, cityAndState]).join(', '),
      data.postcode,
    ]);
  }

  return uniqueLines([
    ...organization,
    premiseDetails,
    poBox,
    street,
    ...localParts,
    cityAndPostcode,
    data.state,
  ]);
}

function normalizeCanonical(data: CanonicalAddress) {
  const code = canonicalCountryCode(data.country_code);
  const normalized: CanonicalAddress = {
    country_code: code,
    country: normalizeField(code, 'country', data.country || code),
    state: normalizeField(code, 'state', data.state),
    city: normalizeField(code, 'city', data.city),
    district: normalizeField(code, 'district', data.district),
    subdistrict: normalizeField(code, 'subdistrict', data.subdistrict),
    suburb: normalizeField(code, 'suburb', data.suburb),
    road: normalizeField(code, 'road', data.road),
    house_number: normalizeField(code, 'house_number', data.house_number),
    building: normalizeField(code, 'building', data.building),
    postcode: normalizeField(code, 'postcode', data.postcode),
    poi: normalizeField(code, 'poi', data.poi),
    plus_code: clean(data.plus_code),
    po_box: normalizeField(code, 'po_box', data.po_box),
    unit: normalizeField(code, 'unit', data.unit),
    floor: normalizeField(code, 'floor', data.floor),
    block: normalizeField(code, 'block', data.block),
    zone: normalizeField(code, 'zone', data.zone),
    additional_number: normalizeField(code, 'additional_number', data.additional_number),
    short_address: normalizeField(code, 'short_address', data.short_address),
  };
  const changedFields = (Object.keys(normalized) as Array<keyof CanonicalAddress>).filter(
    key => clean(data[key]) !== clean(normalized[key]),
  );
  return { normalized, changedFields };
}

export function buildEnglishShippingAddress(
  data: CanonicalAddress,
  mode: EnglishShippingMode,
): EnglishShippingAddressResult {
  const { normalized, changedFields } = normalizeCanonical(data);
  const code = canonicalCountryCode(normalized.country_code);
  const profile = getEnglishShippingProfile(code);
  const isCore = CORE_CODES.has(code as CoreCountryCode);
  const extendedSpec = EXTENDED_SPEC_BY_COUNTRY.get(code);
  const domesticLines = isCore
    ? renderCoreLines(normalized, code as CoreCountryCode)
    : extendedSpec
      ? renderExtendedLines(normalized, extendedSpec)
      : renderEnglishPostalAddress(normalized, { includeCountry: false }).split('\n').filter(Boolean);
  const countryLine = countryName(code, normalized.country).toUpperCase();
  const lines =
    mode === 'international-shipping'
      ? uniqueLines([...domesticLines, countryLine])
      : domesticLines;
  const postcode = normalizePostcode(normalized.postcode, code);
  const warnings: EnglishShippingWarning[] = ['delivery_point_not_validated'];
  const deliveryLinePresent =
    Boolean(normalized.road && normalized.house_number) ||
    Boolean(normalized.po_box) ||
    /^(PO BOX|PRIVATE BAG|LOCKED BAG|RR)\b/i.test(normalized.building) ||
    /^(PO BOX|PRIVATE BAG|LOCKED BAG|RR)\b/i.test(normalized.road);
  const localityPresent = Boolean(
    code === 'SG' ||
    normalized.city ||
    normalized.subdistrict ||
    normalized.suburb ||
    normalized.district,
  );

  if (!isCore && !extendedSpec) warnings.push('unsupported_country_profile');
  if (!deliveryLinePresent) warnings.push('missing_delivery_line');
  if (!localityPresent) warnings.push('missing_locality');
  if (profile.postcodePolicy === 'required' && !normalized.postcode) {
    warnings.push('missing_postcode');
  } else if (
    profile.postcodePolicy !== 'not-used' &&
    normalized.postcode &&
    !postcode.confirmed
  ) {
    warnings.push('postcode_format_unconfirmed');
  } else if (profile.postcodePolicy === 'not-used' && normalized.postcode) {
    warnings.push('postcode_not_used_by_destination');
  }

  const subdivisionLookup = SUBDIVISION_LOOKUPS[code as CoreCountryCode];
  if (
    normalized.state &&
    subdivisionLookup &&
    !subdivisionLookup.has(normalizeLookupKey(normalized.state))
  ) {
    warnings.push('subnational_area_unrecognized');
  }
  if (lines.some(line => line.replace(/\s/g, '').length > 40)) {
    warnings.push('line_length_exceeds_40_characters');
  }

  const reviewWarnings = warnings.filter(warning => warning !== 'delivery_point_not_validated');
  return {
    mode,
    profile,
    normalized,
    lines,
    formatted: lines.join('\n'),
    changedFields,
    appliedRules: [
      profile.profileId,
      'preserve-official-place-names',
      'normalize-postal-code-spacing-and-case',
      `postcode-policy:${profile.postcodePolicy}`,
      `country-layout:${profile.layout}`,
      'omit-country-for-domestic-mail',
      'append-uppercase-country-for-international-mail',
      'never-claim-delivery-point-validation-from-formatting',
    ],
    warnings,
    formatStatus: reviewWarnings.length === 0 ? 'format-ready' : 'needs-review',
    deliveryPointValidated: false,
  };
}
