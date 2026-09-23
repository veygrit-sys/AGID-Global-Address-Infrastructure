export const ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION = 'address-wallet-carrier-country-forms-v0.1';

export type AddressWalletCarrierCode = 'dhl' | 'ups';

export type AddressWalletCarrierCapabilityMode =
  | 'runtime_capability_check_required'
  | 'street_level_validation_available'
  | 'global_express_api_available';

export type AddressWalletCarrierCountryForm = {
  countryCode: string;
  countryName: string;
  continent: 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania';
  addressFormatPath: string;
  defaultLanguage: string;
  requiredWalletFields: string[];
  optionalWalletFields: string[];
  carriers: Record<AddressWalletCarrierCode, {
    capabilityMode: AddressWalletCarrierCapabilityMode;
    capabilityRef: string;
    runtimeCheck: string;
  }>;
  mvpReason: string;
  blockedMaterial: string[];
};

export type AddressWalletCarrierCountryFormCatalog = {
  version: typeof ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION;
  productName: 'Address Wallet Carrier Country Forms';
  scope: string;
  countries: AddressWalletCarrierCountryForm[];
  runtimeRules: string[];
  nonClaims: string[];
};

export type AddressWalletCarrierCoverageMatrix = {
  version: typeof ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION;
  productName: 'Address Wallet DHL/UPS Coverage Matrix';
  countryCount: number;
  countryCodes: string[];
  continentCoverage: Record<AddressWalletCarrierCountryForm['continent'], string[]>;
  carrierSummaries: Array<{
    carrier: AddressWalletCarrierCode;
    countryCount: number;
    countryCodes: string[];
    capabilityModes: AddressWalletCarrierCapabilityMode[];
    streetLevelValidationCountryCodes: string[];
    serverSideRuntimeChecksRequired: true;
    localFormOnlyBoundary: true;
  }>;
  blockedMaterial: string[];
  nonClaims: string[];
  productionTraffic: false;
};

export type AddressWalletCarrierFeatureId =
  | 'countryForm'
  | 'recipientIdResolution'
  | 'getRates'
  | 'createShipment'
  | 'createLabel'
  | 'trackShipment'
  | 'createReturn'
  | 'pickupRequest'
  | 'addressValidation'
  | 'walletConsentHandoff';

export type AddressWalletCarrierFeatureAvailability =
  | 'local_ready'
  | 'sandbox_contract_required'
  | 'runtime_carrier_check_required'
  | 'future';

export type AddressWalletCarrierCountryFeature = {
  feature: AddressWalletCarrierFeatureId;
  availability: AddressWalletCarrierFeatureAvailability;
  exposedToMerchant: boolean;
  serverSideOnly: boolean;
  notes: string;
};

export type AddressWalletCarrierCountryFeatureMatrix = {
  version: typeof ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION;
  productName: 'Address Wallet DHL/UPS Country Feature Matrix';
  countryCodes: string[];
  carriers: AddressWalletCarrierCode[];
  rows: Array<{
    countryCode: string;
    carrier: AddressWalletCarrierCode;
    capabilityMode: AddressWalletCarrierCapabilityMode;
    features: AddressWalletCarrierCountryFeature[];
    requiredRuntimeChecks: string[];
    productionTraffic: false;
    nonClaims: string[];
  }>;
  blockedMaterial: string[];
  productionTraffic: false;
};

export type AddressWalletCarrierCountryFormSelection = {
  version: typeof ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION;
  carrier: AddressWalletCarrierCode;
  countryCode: string;
  form: AddressWalletCarrierCountryForm;
  requiredNextAction: 'render_wallet_country_form' | 'run_carrier_capability_check';
  safeToStore: string[];
  blockedMaterial: string[];
};

export type AddressWalletCarrierShipmentPreflightInput = {
  carrier: AddressWalletCarrierCode;
  countryCode: string;
  recipientId?: string;
  walletConsentRef?: string;
  parcelProfileRef?: string;
  carrierCapabilityRef?: string;
  addressFormVersion?: string;
  submittedFields?: string[];
  [key: string]: unknown;
};

export type AddressWalletCarrierShipmentPreflightResult = {
  version: typeof ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION;
  ok: boolean;
  carrier: AddressWalletCarrierCode;
  countryCode: string;
  addressFormVersion: string;
  requiredNextAction:
    | 'render_wallet_country_form'
    | 'run_carrier_capability_check'
    | 'request_wallet_consent'
    | 'ready_for_hexaship_createShipment';
  missingRefs: string[];
  missingWalletFields: string[];
  rejectedKeys: string[];
  safeRefs: {
    recipientId?: string;
    walletConsentRef?: string;
    parcelProfileRef?: string;
    carrierCapabilityRef?: string;
  };
  blockedMaterial: string[];
  localOnly: true;
  productionTraffic: false;
  nonClaims: string[];
};

export type AddressWalletCarrierLabelTransformInput = {
  carrier: AddressWalletCarrierCode;
  countryCode: string;
  submittedFields: string[];
  poBoxUsed?: boolean;
  poBoxSpelling?: string;
  labelFormat?: 'pdf' | 'zpl' | 'qr';
};

export type AddressWalletCarrierLabelTransform = {
  version: typeof ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION;
  carrier: AddressWalletCarrierCode;
  countryCode: string;
  sourceFormMode: 'user_familiar_country_form';
  userEntryPolicy: {
    renderCountryNativeOrder: true;
    doNotAskForCarrierSpecificShape: true;
    carrierShapeGeneratedServerSide: true;
    acceptedPoBoxSpellings: Array<'P.O. Box' | 'PO Box' | 'P/O Box'>;
  };
  sourceAddressFormatPath: string;
  addressFormVersion: string;
  userInputFields: string[];
  acceptedStreetAlternatives: Array<'street' | 'poBox'>;
  normalizedCarrierFields: Record<string, string>;
  poBoxPolicy: {
    supportedAtFormLevel: true;
    usedInThisTransform: boolean;
    submittedSpellingAccepted: boolean;
    normalizedSpelling?: 'PO Box';
    labelEligibilityRuntimeCheckRequired: true;
    carrierSpecificWarning: string;
  };
  requiredNextAction: 'run_carrier_label_transform' | 'run_carrier_capability_check' | 'ready_for_createLabel';
  missingWalletFields: string[];
  serverSideOnly: true;
  rawAddressExposedToMerchant: false;
  blockedMaterial: string[];
  productionTraffic: false;
  nonClaims: string[];
};

export type AddressWalletCarrierPreflightPreview = {
  version: typeof ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION;
  carrier: AddressWalletCarrierCode;
  countryCode: string;
  selection: AddressWalletCarrierCountryFormSelection | null;
  preflight: AddressWalletCarrierShipmentPreflightResult;
  activeNextAction: AddressWalletCarrierShipmentPreflightResult['requiredNextAction'];
  activeSelectionAction: AddressWalletCarrierCountryFormSelection['requiredNextAction'] | 'unsupported_country_or_carrier';
  activeMissingRefs: string[];
  activeMissingWalletFields: string[];
  capabilityMode: AddressWalletCarrierCapabilityMode | 'none';
  privateMaterialExposed: false;
  productionTraffic: false;
};

export const ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL = [
  'rawAddress',
  'recipientName',
  'recipientPhone',
  'privateDeliveryNotes',
  'proofWitness',
  'proofSecret',
  'privateKey',
  'carrierApiKey',
  'carrierCredential',
] as const;

export function normalizeAddressWalletPoBoxSpelling(value: string | undefined): 'PO Box' | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase().replace(/[\s.]+/g, '');
  if (normalized === 'POBOX' || normalized === 'P/OBOX' || normalized === 'P/O/BOX') return 'PO Box';
  return null;
}

const COMMON_REQUIRED_FIELDS = ['recipient', 'countryCode', 'postcode', 'state', 'city', 'street'] as const;
const COMMON_OPTIONAL_FIELDS = ['houseNumber', 'building', 'unit', 'phone', 'poBox'] as const;

const DHL_EXPRESS_CAPABILITY = {
  capabilityMode: 'global_express_api_available',
  capabilityRef: 'dhl-mydhl-api-capability-ref',
  runtimeCheck: 'Call DHL Express MyDHL capability/rating/shipping APIs in sandbox or production server-side only.',
} as const;

const UPS_RUNTIME_CAPABILITY = {
  capabilityMode: 'runtime_capability_check_required',
  capabilityRef: 'ups-rating-shipping-capability-ref',
  runtimeCheck: 'Call UPS Rating/Shipping capability APIs server-side; do not infer service from form presence.',
} as const;

export const ENGLISH_SPEAKING_CARRIER_COUNTRY_CODES = [
  'AG',
  'AU',
  'BB',
  'BS',
  'BW',
  'BZ',
  'CA',
  'CY',
  'DM',
  'GB',
  'GD',
  'GH',
  'GM',
  'GY',
  'HK',
  'IE',
  'IN',
  'JM',
  'KE',
  'KN',
  'LC',
  'LR',
  'MT',
  'MW',
  'MY',
  'NA',
  'NG',
  'NZ',
  'PH',
  'RW',
  'SG',
  'SL',
  'TT',
  'TZ',
  'UG',
  'US',
  'VC',
  'ZA',
  'ZM',
  'ZW',
] as const;

export const MULTILINGUAL_CARRIER_COUNTRY_CODES = [
  'AO',
  'AR',
  'AT',
  'BE',
  'BF',
  'BJ',
  'BO',
  'BR',
  'CD',
  'CG',
  'CH',
  'CI',
  'CL',
  'CM',
  'CO',
  'CR',
  'CU',
  'CV',
  'CZ',
  'DK',
  'DO',
  'EC',
  'ES',
  'FI',
  'GA',
  'GN',
  'GR',
  'GT',
  'GW',
  'HN',
  'HU',
  'IT',
  'LI',
  'LU',
  'MC',
  'ML',
  'MZ',
  'NE',
  'NI',
  'NL',
  'NO',
  'PA',
  'PE',
  'PL',
  'PR',
  'PT',
  'PY',
  'RO',
  'SE',
  'SN',
  'ST',
  'SV',
  'TG',
  'TL',
  'TR',
  'UA',
  'UY',
  'VE',
] as const;

const ENGLISH_SPEAKING_COUNTRY_EXPANSION: Array<Omit<AddressWalletCarrierCountryForm, 'carriers' | 'requiredWalletFields' | 'optionalWalletFields' | 'blockedMaterial'>> = [
  { countryCode: 'AG', countryName: 'Antigua and Barbuda', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/AG.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean commerce and cross-border gift delivery readiness.' },
  { countryCode: 'BB', countryName: 'Barbados', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/BB.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean form coverage and tourism/commerce delivery readiness.' },
  { countryCode: 'BS', countryName: 'Bahamas', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/BS.json', defaultLanguage: 'en', mvpReason: 'English-speaking island commerce and cross-border shipping readiness.' },
  { countryCode: 'BW', countryName: 'Botswana', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/southern_africa/BW.json', defaultLanguage: 'en', mvpReason: 'Southern Africa English-language address form readiness.' },
  { countryCode: 'BZ', countryName: 'Belize', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/central_america/BZ.json', defaultLanguage: 'en', mvpReason: 'Central America English-language commerce and delivery readiness.' },
  { countryCode: 'CY', countryName: 'Cyprus', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/southern_europe/CY.json', defaultLanguage: 'en', mvpReason: 'English-supported EU/Med commerce and address-form readiness.' },
  { countryCode: 'DM', countryName: 'Dominica', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/DM.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean delivery readiness.' },
  { countryCode: 'GD', countryName: 'Grenada', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/GD.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean delivery readiness.' },
  { countryCode: 'GH', countryName: 'Ghana', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/GH.json', defaultLanguage: 'en', mvpReason: 'West Africa English-language ecommerce and address form readiness.' },
  { countryCode: 'GM', countryName: 'Gambia', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/GM.json', defaultLanguage: 'en', mvpReason: 'West Africa English-language address form readiness.' },
  { countryCode: 'GY', countryName: 'Guyana', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/GY.json', defaultLanguage: 'en', mvpReason: 'South America English-language commerce and delivery readiness.' },
  { countryCode: 'HK', countryName: 'Hong Kong', continent: 'Asia', addressFormatPath: 'src/data/address_formats/asia/east_asia/HK.json', defaultLanguage: 'en', mvpReason: 'High-density English-supported Asian commerce and cross-border delivery readiness.' },
  { countryCode: 'IE', countryName: 'Ireland', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/northern_europe/IE.json', defaultLanguage: 'en', mvpReason: 'English-speaking EU commerce and Eircode-oriented address readiness.' },
  { countryCode: 'IN', countryName: 'India', continent: 'Asia', addressFormatPath: 'src/data/address_formats/asia/south_asia/IN.json', defaultLanguage: 'en', mvpReason: 'Large English-supported ecommerce market and postal-code-heavy address forms.' },
  { countryCode: 'JM', countryName: 'Jamaica', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/JM.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean commerce and delivery readiness.' },
  { countryCode: 'KE', countryName: 'Kenya', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/eastern_africa/KE.json', defaultLanguage: 'en', mvpReason: 'East Africa English-language ecommerce and address form readiness.' },
  { countryCode: 'KN', countryName: 'Saint Kitts and Nevis', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/KN.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean delivery readiness.' },
  { countryCode: 'LC', countryName: 'Saint Lucia', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/LC.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean delivery readiness.' },
  { countryCode: 'LR', countryName: 'Liberia', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/LR.json', defaultLanguage: 'en', mvpReason: 'West Africa English-language address form readiness.' },
  { countryCode: 'MT', countryName: 'Malta', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/southern_europe/MT.json', defaultLanguage: 'en', mvpReason: 'English-supported EU commerce and postal-code form readiness.' },
  { countryCode: 'MW', countryName: 'Malawi', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/eastern_africa/MW.json', defaultLanguage: 'en', mvpReason: 'East Africa English-language address form readiness.' },
  { countryCode: 'MY', countryName: 'Malaysia', continent: 'Asia', addressFormatPath: 'src/data/address_formats/asia/southeast_asia/MY.json', defaultLanguage: 'en', mvpReason: 'English-supported Southeast Asia commerce and cross-border readiness.' },
  { countryCode: 'NA', countryName: 'Namibia', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/southern_africa/NA.json', defaultLanguage: 'en', mvpReason: 'Southern Africa English-language address form readiness.' },
  { countryCode: 'NG', countryName: 'Nigeria', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/NG.json', defaultLanguage: 'en', mvpReason: 'Large West Africa English-language ecommerce and address form readiness.' },
  { countryCode: 'NZ', countryName: 'New Zealand', continent: 'Oceania', addressFormatPath: 'src/data/address_formats/oceania/oceania/NZ.json', defaultLanguage: 'en', mvpReason: 'Oceania English-speaking commerce and delivery readiness.' },
  { countryCode: 'PH', countryName: 'Philippines', continent: 'Asia', addressFormatPath: 'src/data/address_formats/asia/southeast_asia/PH.json', defaultLanguage: 'en', mvpReason: 'English-supported Southeast Asia ecommerce and archipelago delivery readiness.' },
  { countryCode: 'RW', countryName: 'Rwanda', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/eastern_africa/RW.json', defaultLanguage: 'en', mvpReason: 'East Africa English-supported address form readiness.' },
  { countryCode: 'SG', countryName: 'Singapore', continent: 'Asia', addressFormatPath: 'src/data/address_formats/asia/southeast_asia/SG.json', defaultLanguage: 'en', mvpReason: 'High-density English-speaking logistics and cross-border commerce hub.' },
  { countryCode: 'SL', countryName: 'Sierra Leone', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/SL.json', defaultLanguage: 'en', mvpReason: 'West Africa English-language address form readiness.' },
  { countryCode: 'TT', countryName: 'Trinidad and Tobago', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/TT.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean commerce and delivery readiness.' },
  { countryCode: 'TZ', countryName: 'Tanzania', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/eastern_africa/TZ.json', defaultLanguage: 'en', mvpReason: 'East Africa English-supported address form readiness.' },
  { countryCode: 'UG', countryName: 'Uganda', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/eastern_africa/UG.json', defaultLanguage: 'en', mvpReason: 'East Africa English-language ecommerce and address form readiness.' },
  { countryCode: 'VC', countryName: 'Saint Vincent and the Grenadines', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/VC.json', defaultLanguage: 'en', mvpReason: 'English-speaking Caribbean delivery readiness.' },
  { countryCode: 'ZA', countryName: 'South Africa', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/southern_africa/ZA.json', defaultLanguage: 'en', mvpReason: 'Southern Africa English-language ecommerce and address form readiness.' },
  { countryCode: 'ZM', countryName: 'Zambia', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/southern_africa/ZM.json', defaultLanguage: 'en', mvpReason: 'Southern Africa English-language address form readiness.' },
  { countryCode: 'ZW', countryName: 'Zimbabwe', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/southern_africa/ZW.json', defaultLanguage: 'en', mvpReason: 'Southern Africa English-language address form readiness.' },
];

const MULTILINGUAL_COUNTRY_EXPANSION: Array<Omit<AddressWalletCarrierCountryForm, 'carriers' | 'requiredWalletFields' | 'optionalWalletFields' | 'blockedMaterial'>> = [
  { countryCode: 'AO', countryName: 'Angola', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/central_africa/AO.json', defaultLanguage: 'pt', mvpReason: 'Portuguese-speaking Africa address form and cross-border readiness.' },
  { countryCode: 'AR', countryName: 'Argentina', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/AR.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America ecommerce and address form readiness.' },
  { countryCode: 'AT', countryName: 'Austria', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/central_europe/AT.json', defaultLanguage: 'de', mvpReason: 'German-speaking Europe address form and DHL/UPS runtime readiness.' },
  { countryCode: 'BE', countryName: 'Belgium', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/western_europe/BE.json', defaultLanguage: 'fr', mvpReason: 'French/Dutch/German Europe address form and cross-border readiness.' },
  { countryCode: 'BF', countryName: 'Burkina Faso', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/BF.json', defaultLanguage: 'fr', mvpReason: 'French-speaking West Africa address form readiness.' },
  { countryCode: 'BJ', countryName: 'Benin', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/BJ.json', defaultLanguage: 'fr', mvpReason: 'French-speaking West Africa address form readiness.' },
  { countryCode: 'BO', countryName: 'Bolivia', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/BO.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America address form readiness.' },
  { countryCode: 'BR', countryName: 'Brazil', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/BR.json', defaultLanguage: 'pt', mvpReason: 'Portuguese-speaking major ecommerce market and address form readiness.' },
  { countryCode: 'CD', countryName: 'DR Congo', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/central_africa/CD.json', defaultLanguage: 'fr', mvpReason: 'French-speaking Central Africa address form readiness.' },
  { countryCode: 'CG', countryName: 'Congo', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/central_africa/CG.json', defaultLanguage: 'fr', mvpReason: 'French-speaking Central Africa address form readiness.' },
  { countryCode: 'CH', countryName: 'Switzerland', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/central_europe/CH.json', defaultLanguage: 'de', mvpReason: 'German/French/Italian Europe address form and cross-border readiness.' },
  { countryCode: 'CI', countryName: 'Ivory Coast', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/CI.json', defaultLanguage: 'fr', mvpReason: 'French-speaking West Africa ecommerce and address form readiness.' },
  { countryCode: 'CL', countryName: 'Chile', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/CL.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America ecommerce and address form readiness.' },
  { countryCode: 'CM', countryName: 'Cameroon', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/central_africa/CM.json', defaultLanguage: 'fr', mvpReason: 'French/English Central Africa address form readiness.' },
  { countryCode: 'CO', countryName: 'Colombia', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/CO.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America ecommerce and address form readiness.' },
  { countryCode: 'CR', countryName: 'Costa Rica', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/central_america/CR.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Central America address form readiness.' },
  { countryCode: 'CU', countryName: 'Cuba', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/CU.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Caribbean address form readiness.' },
  { countryCode: 'CV', countryName: 'Cape Verde', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/CV.json', defaultLanguage: 'pt', mvpReason: 'Portuguese-speaking Atlantic Africa address form readiness.' },
  { countryCode: 'CZ', countryName: 'Czech Republic', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/central_europe/CZ.json', defaultLanguage: 'cs', mvpReason: 'Major European ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'DK', countryName: 'Denmark', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/northern_europe/DK.json', defaultLanguage: 'da', mvpReason: 'Major Nordic ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'DO', countryName: 'Dominican Republic', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/DO.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Caribbean ecommerce and address form readiness.' },
  { countryCode: 'EC', countryName: 'Ecuador', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/EC.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America address form readiness.' },
  { countryCode: 'ES', countryName: 'Spain', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/southern_europe/ES.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Europe ecommerce and cross-border address form readiness.' },
  { countryCode: 'FI', countryName: 'Finland', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/northern_europe/FI.json', defaultLanguage: 'fi', mvpReason: 'Major Nordic ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'GA', countryName: 'Gabon', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/central_africa/GA.json', defaultLanguage: 'fr', mvpReason: 'French-speaking Central Africa address form readiness.' },
  { countryCode: 'GN', countryName: 'Guinea', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/GN.json', defaultLanguage: 'fr', mvpReason: 'French-speaking West Africa address form readiness.' },
  { countryCode: 'GR', countryName: 'Greece', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/southern_europe/GR.json', defaultLanguage: 'el', mvpReason: 'Major European ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'GT', countryName: 'Guatemala', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/central_america/GT.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Central America address form readiness.' },
  { countryCode: 'GW', countryName: 'Guinea-Bissau', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/GW.json', defaultLanguage: 'pt', mvpReason: 'Portuguese-speaking West Africa address form readiness.' },
  { countryCode: 'HN', countryName: 'Honduras', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/central_america/HN.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Central America address form readiness.' },
  { countryCode: 'HU', countryName: 'Hungary', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/central_europe/HU.json', defaultLanguage: 'hu', mvpReason: 'Major European ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'IT', countryName: 'Italy', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/southern_europe/IT.json', defaultLanguage: 'it', mvpReason: 'Major European ecommerce and cross-border address form readiness.' },
  { countryCode: 'LI', countryName: 'Liechtenstein', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/central_europe/LI.json', defaultLanguage: 'de', mvpReason: 'German-speaking Europe address form readiness.' },
  { countryCode: 'LU', countryName: 'Luxembourg', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/western_europe/LU.json', defaultLanguage: 'fr', mvpReason: 'French/German Europe address form and cross-border readiness.' },
  { countryCode: 'MC', countryName: 'Monaco', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/western_europe/MC.json', defaultLanguage: 'fr', mvpReason: 'French-speaking Europe address form readiness.' },
  { countryCode: 'ML', countryName: 'Mali', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/ML.json', defaultLanguage: 'fr', mvpReason: 'French-speaking West Africa address form readiness.' },
  { countryCode: 'MZ', countryName: 'Mozambique', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/southern_africa/MZ.json', defaultLanguage: 'pt', mvpReason: 'Portuguese-speaking Southern Africa address form readiness.' },
  { countryCode: 'NE', countryName: 'Niger', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/NE.json', defaultLanguage: 'fr', mvpReason: 'French-speaking West Africa address form readiness.' },
  { countryCode: 'NI', countryName: 'Nicaragua', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/central_america/NI.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Central America address form readiness.' },
  { countryCode: 'NL', countryName: 'Netherlands', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/western_europe/NL.json', defaultLanguage: 'nl', mvpReason: 'Major European logistics and ecommerce address form readiness.' },
  { countryCode: 'NO', countryName: 'Norway', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/northern_europe/NO.json', defaultLanguage: 'no', mvpReason: 'Major Nordic ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'PA', countryName: 'Panama', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/central_america/PA.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Central America logistics and address form readiness.' },
  { countryCode: 'PE', countryName: 'Peru', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/PE.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America ecommerce and address form readiness.' },
  { countryCode: 'PL', countryName: 'Poland', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/central_europe/PL.json', defaultLanguage: 'pl', mvpReason: 'Major European ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'PR', countryName: 'Puerto Rico', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/caribbean/PR.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Caribbean and US-linked address form readiness.' },
  { countryCode: 'PT', countryName: 'Portugal', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/southern_europe/PT.json', defaultLanguage: 'pt', mvpReason: 'Portuguese-speaking Europe ecommerce and address form readiness.' },
  { countryCode: 'PY', countryName: 'Paraguay', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/PY.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America address form readiness.' },
  { countryCode: 'RO', countryName: 'Romania', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/eastern_europe/RO.json', defaultLanguage: 'ro', mvpReason: 'Major European ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'SE', countryName: 'Sweden', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/northern_europe/SE.json', defaultLanguage: 'sv', mvpReason: 'Major Nordic ecommerce address form and carrier runtime readiness.' },
  { countryCode: 'SN', countryName: 'Senegal', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/SN.json', defaultLanguage: 'fr', mvpReason: 'French-speaking West Africa address form readiness.' },
  { countryCode: 'ST', countryName: 'Sao Tome and Principe', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/central_africa/ST.json', defaultLanguage: 'pt', mvpReason: 'Portuguese-speaking Central Africa address form readiness.' },
  { countryCode: 'SV', countryName: 'El Salvador', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/central_america/SV.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking Central America address form readiness.' },
  { countryCode: 'TG', countryName: 'Togo', continent: 'Africa', addressFormatPath: 'src/data/address_formats/africa/western_africa/TG.json', defaultLanguage: 'fr', mvpReason: 'French-speaking West Africa address form readiness.' },
  { countryCode: 'TL', countryName: 'Timor-Leste', continent: 'Asia', addressFormatPath: 'src/data/address_formats/asia/southeast_asia/TL.json', defaultLanguage: 'pt', mvpReason: 'Portuguese-speaking Southeast Asia address form readiness.' },
  { countryCode: 'TR', countryName: 'Turkey', continent: 'Asia', addressFormatPath: 'src/data/address_formats/asia/middle_east/TR.json', defaultLanguage: 'tr', mvpReason: 'Large Europe/Asia commerce bridge and carrier runtime readiness.' },
  { countryCode: 'UA', countryName: 'Ukraine', continent: 'Europe', addressFormatPath: 'src/data/address_formats/europe/eastern_europe/UA.json', defaultLanguage: 'uk', mvpReason: 'Major European address form and carrier runtime readiness.' },
  { countryCode: 'UY', countryName: 'Uruguay', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/UY.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America address form readiness.' },
  { countryCode: 'VE', countryName: 'Venezuela', continent: 'Americas', addressFormatPath: 'src/data/address_formats/americas/south_america/VE.json', defaultLanguage: 'es', mvpReason: 'Spanish-speaking South America address form readiness.' },
];

function englishSpeakingExpansionForm(
  country: typeof ENGLISH_SPEAKING_COUNTRY_EXPANSION[number] | typeof MULTILINGUAL_COUNTRY_EXPANSION[number],
): AddressWalletCarrierCountryForm {
  return {
    ...country,
    requiredWalletFields: [...COMMON_REQUIRED_FIELDS],
    optionalWalletFields: [...COMMON_OPTIONAL_FIELDS],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: UPS_RUNTIME_CAPABILITY,
    },
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  };
}

export const ADDRESS_WALLET_CARRIER_COUNTRY_FORMS: AddressWalletCarrierCountryForm[] = [
  {
    countryCode: 'JP',
    countryName: 'Japan',
    continent: 'Asia',
    addressFormatPath: 'src/data/address_formats/asia/east_asia/JP.json',
    defaultLanguage: 'ja',
    requiredWalletFields: ['recipient', 'countryCode', 'postcode', 'state', 'city'],
    optionalWalletFields: ['street', 'houseNumber', 'building', 'unit', 'phone', 'poBox'],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: UPS_RUNTIME_CAPABILITY,
    },
    mvpReason: 'Home market, Japanese/English forms, and high-value cross-border EC flows.',
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    continent: 'Americas',
    addressFormatPath: 'src/data/address_formats/americas/north_america/US.json',
    defaultLanguage: 'en',
    requiredWalletFields: [...COMMON_REQUIRED_FIELDS],
    optionalWalletFields: [...COMMON_OPTIONAL_FIELDS],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: {
        capabilityMode: 'street_level_validation_available',
        capabilityRef: 'ups-address-validation-street-level-ref',
        runtimeCheck: 'Use UPS Address Validation and Shipping APIs server-side for supported services.',
      },
    },
    mvpReason: 'Large developer market, UPS street-level validation baseline, and DHL Express global API coverage.',
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    continent: 'Europe',
    addressFormatPath: 'src/data/address_formats/europe/central_europe/DE.json',
    defaultLanguage: 'de',
    requiredWalletFields: [...COMMON_REQUIRED_FIELDS],
    optionalWalletFields: [...COMMON_OPTIONAL_FIELDS],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: UPS_RUNTIME_CAPABILITY,
    },
    mvpReason: 'DHL home-region density, EU parcel complexity, and strong B2B/B2C address quality requirements.',
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    continent: 'Europe',
    addressFormatPath: 'src/data/address_formats/europe/western_europe/FR.json',
    defaultLanguage: 'fr',
    requiredWalletFields: [...COMMON_REQUIRED_FIELDS],
    optionalWalletFields: [...COMMON_OPTIONAL_FIELDS],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: UPS_RUNTIME_CAPABILITY,
    },
    mvpReason: 'EU launch coverage with postal-code-led routing and international commerce demand.',
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    continent: 'Europe',
    addressFormatPath: 'src/data/address_formats/europe/northern_europe/GB.json',
    defaultLanguage: 'en',
    requiredWalletFields: [...COMMON_REQUIRED_FIELDS],
    optionalWalletFields: [...COMMON_OPTIONAL_FIELDS],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: UPS_RUNTIME_CAPABILITY,
    },
    mvpReason: 'Complex postcode formats, dense EC market, and frequent international checkout use.',
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    continent: 'Americas',
    addressFormatPath: 'src/data/address_formats/americas/north_america/CA.json',
    defaultLanguage: 'en',
    requiredWalletFields: [...COMMON_REQUIRED_FIELDS],
    optionalWalletFields: [...COMMON_OPTIONAL_FIELDS],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: UPS_RUNTIME_CAPABILITY,
    },
    mvpReason: 'North America coverage with bilingual and postal-code-sensitive address forms.',
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    continent: 'Oceania',
    addressFormatPath: 'src/data/address_formats/oceania/oceania/AU.json',
    defaultLanguage: 'en',
    requiredWalletFields: [...COMMON_REQUIRED_FIELDS],
    optionalWalletFields: [...COMMON_OPTIONAL_FIELDS],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: UPS_RUNTIME_CAPABILITY,
    },
    mvpReason: 'Oceania launch coverage with English forms and long-distance delivery constraints.',
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  },
  {
    countryCode: 'MX',
    countryName: 'Mexico',
    continent: 'Americas',
    addressFormatPath: 'src/data/address_formats/americas/north_america/MX.json',
    defaultLanguage: 'es',
    requiredWalletFields: [...COMMON_REQUIRED_FIELDS],
    optionalWalletFields: [...COMMON_OPTIONAL_FIELDS],
    carriers: {
      dhl: DHL_EXPRESS_CAPABILITY,
      ups: UPS_RUNTIME_CAPABILITY,
    },
    mvpReason: 'Cross-border North America coverage and Spanish-language EC address flow.',
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  },
  ...ENGLISH_SPEAKING_COUNTRY_EXPANSION.map(englishSpeakingExpansionForm),
  ...MULTILINGUAL_COUNTRY_EXPANSION.map(englishSpeakingExpansionForm),
];

export function buildAddressWalletCarrierCountryFormCatalog(): AddressWalletCarrierCountryFormCatalog {
  return {
    version: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
    productName: 'Address Wallet Carrier Country Forms',
    scope:
      'Ref-only Address Wallet country-form capture for DHL/UPS MVP candidates; carrier service availability is checked at runtime.',
    countries: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS,
    runtimeRules: [
      'Render country-specific wallet forms from local address format metadata before carrier quote or label creation.',
      'Do not treat form presence as proof that DHL or UPS can ship every service to every postal code.',
      'Run carrier capability, rating, and allocation checks server-side before creating labels.',
      'Never send carrier API credentials, proof witnesses, private keys, or unscoped raw address material to browser clients.',
    ],
    nonClaims: [
      'This catalog is not a live DHL/UPS service guarantee.',
      'This catalog is not a carrier rate card, delivery SLA, customs decision, or proof of residence.',
      'Address form completeness is not wallet consent and is not AddressQL validation.',
    ],
  };
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

export function buildAddressWalletCarrierCoverageMatrix(
  catalog = buildAddressWalletCarrierCountryFormCatalog(),
): AddressWalletCarrierCoverageMatrix {
  const countryCodes = uniqueSorted(catalog.countries.map(country => country.countryCode));
  const continentCoverage = catalog.countries.reduce<AddressWalletCarrierCoverageMatrix['continentCoverage']>((coverage, country) => {
    coverage[country.continent] = uniqueSorted([...coverage[country.continent], country.countryCode]);
    return coverage;
  }, {
    Africa: [],
    Americas: [],
    Asia: [],
    Europe: [],
    Oceania: [],
  });

  return {
    version: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
    productName: 'Address Wallet DHL/UPS Coverage Matrix',
    countryCount: catalog.countries.length,
    countryCodes,
    continentCoverage,
    carrierSummaries: (['dhl', 'ups'] satisfies AddressWalletCarrierCode[]).map(carrier => {
      const supportedCountries = catalog.countries.filter(country => Boolean(country.carriers[carrier]));
      return {
        carrier,
        countryCount: supportedCountries.length,
        countryCodes: uniqueSorted(supportedCountries.map(country => country.countryCode)),
        capabilityModes: uniqueSorted(supportedCountries.map(country => country.carriers[carrier].capabilityMode)),
        streetLevelValidationCountryCodes: uniqueSorted(supportedCountries
          .filter(country => country.carriers[carrier].capabilityMode === 'street_level_validation_available')
          .map(country => country.countryCode)),
        serverSideRuntimeChecksRequired: true,
        localFormOnlyBoundary: true,
      };
    }),
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
    nonClaims: [...catalog.nonClaims],
    productionTraffic: false,
  };
}

function buildCarrierFeatureSet(
  carrier: AddressWalletCarrierCode,
  capabilityMode: AddressWalletCarrierCapabilityMode,
): AddressWalletCarrierCountryFeature[] {
  const ratingAvailability: AddressWalletCarrierFeatureAvailability =
    capabilityMode === 'global_express_api_available' ? 'sandbox_contract_required' : 'runtime_carrier_check_required';
  const addressValidationAvailability: AddressWalletCarrierFeatureAvailability =
    carrier === 'ups' && capabilityMode === 'street_level_validation_available'
      ? 'sandbox_contract_required'
      : 'runtime_carrier_check_required';

  return [
    {
      feature: 'countryForm',
      availability: 'local_ready',
      exposedToMerchant: true,
      serverSideOnly: false,
      notes: 'Address Wallet can render the country form from local metadata before any carrier API call.',
    },
    {
      feature: 'recipientIdResolution',
      availability: 'local_ready',
      exposedToMerchant: false,
      serverSideOnly: true,
      notes: 'Recipient IDs can be carried through merchant flows without exposing raw recipient address values.',
    },
    {
      feature: 'walletConsentHandoff',
      availability: 'sandbox_contract_required',
      exposedToMerchant: false,
      serverSideOnly: true,
      notes: 'Address materialization requires wallet consent before carrier handoff.',
    },
    {
      feature: 'getRates',
      availability: ratingAvailability,
      exposedToMerchant: true,
      serverSideOnly: true,
      notes: 'Rates are returned as normalized Hexaship candidates after carrier capability checks.',
    },
    {
      feature: 'createShipment',
      availability: 'sandbox_contract_required',
      exposedToMerchant: true,
      serverSideOnly: true,
      notes: 'Shipment creation must run through the server connector after consent and allocation gates pass.',
    },
    {
      feature: 'createLabel',
      availability: 'sandbox_contract_required',
      exposedToMerchant: true,
      serverSideOnly: true,
      notes: 'Carrier label payloads are normalized to label refs before merchant exposure.',
    },
    {
      feature: 'trackShipment',
      availability: 'sandbox_contract_required',
      exposedToMerchant: true,
      serverSideOnly: true,
      notes: 'Carrier tracking events are normalized to common Hexaship shipment states.',
    },
    {
      feature: 'createReturn',
      availability: 'sandbox_contract_required',
      exposedToMerchant: true,
      serverSideOnly: true,
      notes: 'Returns use a common Hexaship return ref and carrier-specific return adapter behind it.',
    },
    {
      feature: 'pickupRequest',
      availability: 'future',
      exposedToMerchant: false,
      serverSideOnly: true,
      notes: 'Pickup should follow label stability and carrier account approval.',
    },
    {
      feature: 'addressValidation',
      availability: addressValidationAvailability,
      exposedToMerchant: false,
      serverSideOnly: true,
      notes: carrier === 'ups'
        ? 'UPS can provide stronger address validation where supported; do not expose raw validation payloads.'
        : 'DHL validation remains route/service capability driven in this MVP matrix.',
    },
  ];
}

export function buildAddressWalletCarrierCountryFeatureMatrix(
  catalog = buildAddressWalletCarrierCountryFormCatalog(),
): AddressWalletCarrierCountryFeatureMatrix {
  return {
    version: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
    productName: 'Address Wallet DHL/UPS Country Feature Matrix',
    countryCodes: uniqueSorted(catalog.countries.map(country => country.countryCode)),
    carriers: ['dhl', 'ups'],
    rows: catalog.countries.flatMap(country =>
      (['dhl', 'ups'] satisfies AddressWalletCarrierCode[]).map(carrier => {
        const capabilityMode = country.carriers[carrier].capabilityMode;
        return {
          countryCode: country.countryCode,
          carrier,
          capabilityMode,
          features: buildCarrierFeatureSet(carrier, capabilityMode),
          requiredRuntimeChecks: [
            country.carriers[carrier].runtimeCheck,
            'Run Hexaship carrier capability preflight before getRates.',
            'Run wallet consent handoff before createShipment/createLabel.',
          ],
          productionTraffic: false,
          nonClaims: [
            'Country feature presence is not a live DHL/UPS service guarantee.',
            'Runtime carrier checks decide service availability, rate, ETA, label eligibility, pickup, and return support.',
          ],
        };
      }),
    ),
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
    productionTraffic: false,
  };
}

export function validateAddressWalletCarrierCountryFeatureMatrix(
  matrix: AddressWalletCarrierCountryFeatureMatrix,
): string[] {
  const errors: string[] = [];
  if (matrix.version !== ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION) errors.push('version-mismatch');
  if (matrix.productName !== 'Address Wallet DHL/UPS Country Feature Matrix') errors.push('product-name-mismatch');
  if (matrix.productionTraffic !== false) errors.push('production-traffic-not-false');
  if (matrix.rows.length !== matrix.countryCodes.length * matrix.carriers.length) errors.push('row-count-mismatch');
  for (const blocked of ['rawAddress', 'carrierApiKey', 'proofSecret', 'privateKey']) {
    if (!matrix.blockedMaterial.includes(blocked)) errors.push(`missing-blocked-material:${blocked}`);
  }
  for (const row of matrix.rows) {
    const featureIds = new Set(row.features.map(feature => feature.feature));
    for (const feature of ['countryForm', 'recipientIdResolution', 'walletConsentHandoff', 'getRates', 'createShipment', 'createLabel', 'trackShipment', 'createReturn']) {
      if (!featureIds.has(feature as AddressWalletCarrierFeatureId)) errors.push(`missing-feature:${row.countryCode}:${row.carrier}:${feature}`);
    }
    if (row.features.some(feature => feature.feature !== 'countryForm' && !feature.serverSideOnly)) {
      errors.push(`unsafe-client-feature:${row.countryCode}:${row.carrier}`);
    }
    if (!row.requiredRuntimeChecks.some(check => /capability/i.test(check))) {
      errors.push(`missing-capability-runtime-check:${row.countryCode}:${row.carrier}`);
    }
    if (row.productionTraffic !== false) errors.push(`row-production-traffic-not-false:${row.countryCode}:${row.carrier}`);
    if (!row.nonClaims.some(nonClaim => /not a live DHL\/UPS service guarantee/i.test(nonClaim))) {
      errors.push(`missing-service-non-claim:${row.countryCode}:${row.carrier}`);
    }
  }
  return errors;
}

export function selectAddressWalletCarrierCountryForm(input: {
  carrier: AddressWalletCarrierCode;
  countryCode: string;
}): AddressWalletCarrierCountryFormSelection | null {
  const countryCode = input.countryCode.trim().toUpperCase();
  const form = ADDRESS_WALLET_CARRIER_COUNTRY_FORMS.find(candidate => candidate.countryCode === countryCode);
  if (!form || !form.carriers[input.carrier]) return null;

  return {
    version: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
    carrier: input.carrier,
    countryCode,
    form,
    requiredNextAction: form.carriers[input.carrier].capabilityMode === 'runtime_capability_check_required'
      ? 'run_carrier_capability_check'
      : 'render_wallet_country_form',
    safeToStore: ['countryCode', 'recipient_id', 'addressFormVersion', 'carrierCapabilityRef', 'walletConsentRef'],
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
  };
}

export function buildAddressWalletCarrierPreflightPreview(input: {
  carrier: AddressWalletCarrierCode;
  countryCode: string;
  includeCarrierCapabilityRef?: boolean;
}): AddressWalletCarrierPreflightPreview {
  const countryCode = input.countryCode.trim().toUpperCase();
  const selection = selectAddressWalletCarrierCountryForm({ carrier: input.carrier, countryCode });
  const syntheticRefSuffix = countryCode.toLowerCase();
  const carrierCapabilityRef = input.includeCarrierCapabilityRef
    ? `carrier_capability_ref_${input.carrier}_${syntheticRefSuffix}_active`
    : undefined;
  const preflight = preflightAddressWalletCarrierShipment({
    carrier: input.carrier,
    countryCode,
    recipientId: `ship_recipient_synthetic_${syntheticRefSuffix}_active`,
    walletConsentRef: `wallet_consent_ref_${syntheticRefSuffix}_active`,
    parcelProfileRef: `parcel_profile_ref_${syntheticRefSuffix}_small_box_active`,
    carrierCapabilityRef,
    addressFormVersion: `${syntheticRefSuffix}-wallet-form-active-v0.1`,
    submittedFields: ['recipient', 'countryCode', 'postcode', 'state', 'city', 'street'],
  });

  return {
    version: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
    carrier: input.carrier,
    countryCode,
    selection,
    preflight,
    activeNextAction: preflight.requiredNextAction,
    activeSelectionAction: selection?.requiredNextAction ?? 'unsupported_country_or_carrier',
    activeMissingRefs: preflight.missingRefs,
    activeMissingWalletFields: preflight.missingWalletFields,
    capabilityMode: selection?.form.carriers[input.carrier].capabilityMode ?? 'none',
    privateMaterialExposed: false,
    productionTraffic: false,
  };
}

function missingFormFieldsWithAlternatives(requiredFields: string[], submittedFields: Set<string>): string[] {
  return requiredFields.filter(field => {
    if (field === 'street' && submittedFields.has('poBox')) return false;
    return !submittedFields.has(field);
  });
}

function carrierLabelFieldMap(carrier: AddressWalletCarrierCode): Record<string, string> {
  if (carrier === 'dhl') {
    return {
      recipient: 'receiver.contactInformation.contactName',
      countryCode: 'receiver.postalAddress.countryCode',
      postcode: 'receiver.postalAddress.postalCode',
      state: 'receiver.postalAddress.provinceCode',
      city: 'receiver.postalAddress.cityName',
      street: 'receiver.postalAddress.addressLine1',
      houseNumber: 'receiver.postalAddress.addressLine2',
      building: 'receiver.postalAddress.addressLine2',
      unit: 'receiver.postalAddress.addressLine3',
      poBox: 'receiver.postalAddress.addressLine1',
      phone: 'receiver.contactInformation.phone',
    };
  }

  return {
    recipient: 'Shipment.ShipTo.Name',
    countryCode: 'Shipment.ShipTo.Address.CountryCode',
    postcode: 'Shipment.ShipTo.Address.PostalCode',
    state: 'Shipment.ShipTo.Address.StateProvinceCode',
    city: 'Shipment.ShipTo.Address.City',
    street: 'Shipment.ShipTo.Address.AddressLine.0',
    houseNumber: 'Shipment.ShipTo.Address.AddressLine.1',
    building: 'Shipment.ShipTo.Address.AddressLine.1',
    unit: 'Shipment.ShipTo.Address.AddressLine.2',
    poBox: 'Shipment.ShipTo.Address.AddressLine.0',
    phone: 'Shipment.ShipTo.AttentionNameOrPhoneRef',
  };
}

export function buildAddressWalletCarrierLabelTransform(
  input: AddressWalletCarrierLabelTransformInput,
): AddressWalletCarrierLabelTransform | null {
  const selection = selectAddressWalletCarrierCountryForm({ carrier: input.carrier, countryCode: input.countryCode });
  if (!selection) return null;

  const submittedFields = new Set(input.submittedFields);
  const missingWalletFields = missingFormFieldsWithAlternatives(selection.form.requiredWalletFields, submittedFields);
  const normalizedCarrierFields = carrierLabelFieldMap(input.carrier);
  const normalizedPoBoxSpelling = normalizeAddressWalletPoBoxSpelling(input.poBoxSpelling);
  const poBoxUsed = Boolean(input.poBoxUsed || submittedFields.has('poBox') || normalizedPoBoxSpelling);
  const requiredNextAction: AddressWalletCarrierLabelTransform['requiredNextAction'] = missingWalletFields.length > 0
    ? 'run_carrier_label_transform'
    : poBoxUsed
      ? 'run_carrier_capability_check'
      : 'ready_for_createLabel';

  return {
    version: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
    carrier: input.carrier,
    countryCode: selection.countryCode,
    sourceFormMode: 'user_familiar_country_form',
    userEntryPolicy: {
      renderCountryNativeOrder: true,
      doNotAskForCarrierSpecificShape: true,
      carrierShapeGeneratedServerSide: true,
      acceptedPoBoxSpellings: ['P.O. Box', 'PO Box', 'P/O Box'],
    },
    sourceAddressFormatPath: selection.form.addressFormatPath,
    addressFormVersion: `${selection.countryCode.toLowerCase()}-wallet-country-form-${ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION}`,
    userInputFields: [...selection.form.requiredWalletFields, ...selection.form.optionalWalletFields],
    acceptedStreetAlternatives: ['street', 'poBox'],
    normalizedCarrierFields,
    poBoxPolicy: {
      supportedAtFormLevel: true,
      usedInThisTransform: poBoxUsed,
      submittedSpellingAccepted: Boolean(!input.poBoxSpelling || normalizedPoBoxSpelling),
      normalizedSpelling: normalizedPoBoxSpelling ?? undefined,
      labelEligibilityRuntimeCheckRequired: true,
      carrierSpecificWarning: input.carrier === 'ups'
        ? 'UPS P.O. Box handling depends on product, service, and destination; run address validation/rating before label purchase.'
        : 'DHL P.O. Box handling depends on product, service, and destination; run service availability/rating before label purchase.',
    },
    requiredNextAction,
    missingWalletFields,
    serverSideOnly: true,
    rawAddressExposedToMerchant: false,
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
    productionTraffic: false,
    nonClaims: [
      'Users enter addresses in familiar country forms; carrier label fields are generated server-side after wallet consent.',
      'P.O. Box form support is not a live DHL/UPS label eligibility guarantee.',
      'Carrier label transformation maps field descriptors only in fixtures and does not expose raw address values to merchants.',
    ],
  };
}

export function validateAddressWalletCarrierLabelTransform(transform: AddressWalletCarrierLabelTransform): string[] {
  const errors: string[] = [];
  if (transform.version !== ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION) errors.push('version-mismatch');
  if (transform.sourceFormMode !== 'user_familiar_country_form') errors.push('source-form-not-user-familiar');
  if (transform.userEntryPolicy.renderCountryNativeOrder !== true) errors.push('user-entry-policy-missing-native-order');
  if (transform.userEntryPolicy.doNotAskForCarrierSpecificShape !== true) errors.push('user-entry-policy-allows-carrier-shape');
  if (transform.userEntryPolicy.carrierShapeGeneratedServerSide !== true) errors.push('user-entry-policy-not-server-generated');
  for (const spelling of ['P.O. Box', 'PO Box', 'P/O Box'] as const) {
    if (!transform.userEntryPolicy.acceptedPoBoxSpellings.includes(spelling)) {
      errors.push(`missing-po-box-spelling:${spelling}`);
    }
  }
  if (!transform.acceptedStreetAlternatives.includes('poBox')) errors.push('missing-po-box-alternative');
  if (transform.poBoxPolicy.supportedAtFormLevel !== true) errors.push('po-box-not-supported-at-form-level');
  if (transform.poBoxPolicy.submittedSpellingAccepted !== true) errors.push('po-box-submitted-spelling-not-accepted');
  if (transform.poBoxPolicy.labelEligibilityRuntimeCheckRequired !== true) errors.push('po-box-missing-runtime-check');
  if (transform.serverSideOnly !== true) errors.push('transform-not-server-side-only');
  if (transform.rawAddressExposedToMerchant !== false) errors.push('raw-address-exposed-to-merchant');
  if (transform.productionTraffic !== false) errors.push('production-traffic-not-false');
  for (const field of ['recipient', 'countryCode', 'postcode', 'city', 'street', 'poBox']) {
    if (!transform.userInputFields.includes(field)) errors.push(`missing-user-input-field:${field}`);
    if (!transform.normalizedCarrierFields[field]) errors.push(`missing-carrier-field-map:${field}`);
  }
  for (const blocked of ['rawAddress', 'recipientPhone', 'carrierApiKey', 'proofSecret', 'privateKey']) {
    if (!transform.blockedMaterial.includes(blocked)) errors.push(`missing-blocked-material:${blocked}`);
  }
  if (!transform.nonClaims.some(nonClaim => /not a live DHL\/UPS label eligibility guarantee/i.test(nonClaim))) {
    errors.push('missing-po-box-non-claim');
  }
  return errors;
}

function collectRejectedKeys(value: unknown, path: string[] = []): string[] {
  if (value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectRejectedKeys(item, [...path, String(index)]));

  const rejected: string[] = [];
  for (const [key, nested] of Object.entries(value)) {
    const fullPath = [...path, key].join('.');
    if (ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL.includes(key as typeof ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL[number])) {
      rejected.push(fullPath);
    }
    rejected.push(...collectRejectedKeys(nested, [...path, key]));
  }
  return rejected;
}

export function preflightAddressWalletCarrierShipment(
  input: AddressWalletCarrierShipmentPreflightInput,
): AddressWalletCarrierShipmentPreflightResult {
  const selection = selectAddressWalletCarrierCountryForm({ carrier: input.carrier, countryCode: input.countryCode });
  const countryCode = input.countryCode.trim().toUpperCase();
  const rejectedKeys = collectRejectedKeys(input);
  const submittedFields = new Set(input.submittedFields ?? []);
  const missingWalletFields = selection
    ? missingFormFieldsWithAlternatives(selection.form.requiredWalletFields, submittedFields)
    : ['countryCode'];
  const requiredRefs = ['recipientId', 'walletConsentRef', 'parcelProfileRef', 'carrierCapabilityRef'] as const;
  const missingRefs = requiredRefs.filter(ref => !input[ref]);
  const addressFormVersion = input.addressFormVersion ?? ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION;
  let requiredNextAction: AddressWalletCarrierShipmentPreflightResult['requiredNextAction'] = 'render_wallet_country_form';

  if (selection && missingWalletFields.length === 0) {
    requiredNextAction = selection.requiredNextAction === 'run_carrier_capability_check' || !input.carrierCapabilityRef
      ? 'run_carrier_capability_check'
      : 'request_wallet_consent';
  }
  if (selection && missingWalletFields.length === 0 && missingRefs.length === 0 && rejectedKeys.length === 0) {
    requiredNextAction = 'ready_for_hexaship_createShipment';
  }

  return {
    version: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
    ok: Boolean(selection) && missingWalletFields.length === 0 && missingRefs.length === 0 && rejectedKeys.length === 0,
    carrier: input.carrier,
    countryCode,
    addressFormVersion,
    requiredNextAction,
    missingRefs,
    missingWalletFields,
    rejectedKeys,
    safeRefs: {
      recipientId: input.recipientId,
      walletConsentRef: input.walletConsentRef,
      parcelProfileRef: input.parcelProfileRef,
      carrierCapabilityRef: input.carrierCapabilityRef,
    },
    blockedMaterial: [...ADDRESS_WALLET_CARRIER_FORM_BLOCKED_MATERIAL],
    localOnly: true,
    productionTraffic: false,
    nonClaims: [
      'Preflight readiness is not a live DHL/UPS service guarantee.',
      'Preflight readiness is not a label purchase, delivery SLA, customs clearance, or proof of residence.',
      'Address Wallet may resolve scoped delivery data only after wallet consent and server-side carrier handoff.',
    ],
  };
}

export function validateAddressWalletCarrierCountryFormCatalog(catalog: AddressWalletCarrierCountryFormCatalog): string[] {
  const errors: string[] = [];
  const countryCodes = new Set<string>();

  if (catalog.version !== ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION) errors.push('version-mismatch');
  if (!catalog.scope.includes('runtime')) errors.push('missing-runtime-boundary');
  if (catalog.countries.length < 8) errors.push('too-few-mvp-countries');

  for (const country of catalog.countries) {
    if (countryCodes.has(country.countryCode)) errors.push(`duplicate-country:${country.countryCode}`);
    countryCodes.add(country.countryCode);
    if (!/^[A-Z]{2}$/.test(country.countryCode)) errors.push(`invalid-country-code:${country.countryCode}`);
    if (!country.addressFormatPath.endsWith(`${country.countryCode}.json`)) errors.push(`form-path-mismatch:${country.countryCode}`);
    for (const carrier of ['dhl', 'ups'] satisfies AddressWalletCarrierCode[]) {
      if (!country.carriers[carrier]) errors.push(`missing-carrier:${country.countryCode}:${carrier}`);
      if (!country.carriers[carrier]?.runtimeCheck) errors.push(`missing-runtime-check:${country.countryCode}:${carrier}`);
    }
    for (const field of ['recipient', 'countryCode']) {
      if (!country.requiredWalletFields.includes(field)) errors.push(`missing-required-wallet-field:${country.countryCode}:${field}`);
    }
    for (const key of ['rawAddress', 'recipientPhone', 'proofWitness', 'privateKey', 'carrierApiKey']) {
      if (!country.blockedMaterial.includes(key)) errors.push(`missing-blocked-material:${country.countryCode}:${key}`);
    }
  }

  if (!catalog.runtimeRules.some(rule => /server-side/i.test(rule))) errors.push('missing-server-side-rule');
  if (!catalog.nonClaims.some(nonClaim => /not a live DHL\/UPS service guarantee/i.test(nonClaim))) errors.push('missing-service-non-claim');

  return errors;
}
