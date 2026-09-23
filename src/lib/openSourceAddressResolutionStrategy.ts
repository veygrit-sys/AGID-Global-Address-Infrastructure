import { normalizeRegistrationAddressLanguage } from './addressRegistrationState';

export type OpenSourceAddressResolutionStepKind =
  | 'postal-api'
  | 'postal-dataset'
  | 'geodata'
  | 'space-agency-geodata'
  | 'machine-translation'
  | 'transliteration'
  | 'format-rules'
  | 'dictionary-fallback';

export type OpenSourceAddressResolutionStep = {
  id: string;
  kind: OpenSourceAddressResolutionStepKind;
  label: string;
  priority: number;
  networked: boolean;
  openSourceOrFree: boolean;
  dictionaryDependent: boolean;
};

export type OpenSourceAddressResolutionPipelineInput = {
  countryCode?: string;
  hasPostcode?: boolean;
  hasCoordinates?: boolean;
  sourceLanguage?: string;
  targetLanguage?: string;
  hasCustomTranslator?: boolean;
  needsNaturalGeographyContext?: boolean;
  sparseOrRemoteArea?: boolean;
};

export type OpenSourceTranslationPriorityInput = {
  hasCustomTranslator: boolean;
  fieldKey: string;
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

const ADDRESS_TEXT_FIELDS = new Set([
  'recipient',
  'name',
  'organization',
  'building',
  'company',
  'street',
  'road',
  'suburb',
  'neighborhood',
  'neighbourhood',
  'district',
  'ward',
  'city',
  'town',
  'village',
  'state',
  'province',
  'region',
  'locality',
  'landmark',
]);

const NON_ADDRESS_TRANSLATION_FIELDS = new Set([
  'country',
  'postcode',
  'postalCode',
  'zip',
  'phone',
  'agid',
  'aoid',
  'houseNumber',
  'house_number',
  'unit',
  'floor',
  'room',
]);

const BASE_STEPS = {
  officialPostalApi: {
    id: 'official-postal-api',
    kind: 'postal-api',
    label: 'Official or free postal-code API',
    networked: true,
    openSourceOrFree: true,
    dictionaryDependent: false,
  },
  openPostalDataset: {
    id: 'open-postal-dataset',
    kind: 'postal-dataset',
    label: 'Open postal-code dataset',
    networked: true,
    openSourceOrFree: true,
    dictionaryDependent: false,
  },
  openGeodata: {
    id: 'open-geodata',
    kind: 'geodata',
    label: 'OSM / Overture / GeoNames / national open geodata',
    networked: true,
    openSourceOrFree: true,
    dictionaryDependent: false,
  },
  spaceAgencyGeodata: {
    id: 'space-agency-open-geodata',
    kind: 'space-agency-geodata',
    label: 'NASA / ESA / Copernicus / JAXA open Earth-observation sources',
    networked: true,
    openSourceOrFree: true,
    dictionaryDependent: false,
  },
  openSourceTranslation: {
    id: 'open-source-translation-api',
    kind: 'machine-translation',
    label: 'LibreTranslate or Argos Translate compatible API',
    networked: true,
    openSourceOrFree: true,
    dictionaryDependent: false,
  },
  openSourceTransliteration: {
    id: 'open-source-transliteration',
    kind: 'transliteration',
    label: 'Open romanization/transliteration rules',
    networked: false,
    openSourceOrFree: true,
    dictionaryDependent: false,
  },
  localFormatRules: {
    id: 'local-format-rules',
    kind: 'format-rules',
    label: 'Country address format rules',
    networked: false,
    openSourceOrFree: true,
    dictionaryDependent: false,
  },
  localDictionaryFallback: {
    id: 'local-dictionary-fallback',
    kind: 'dictionary-fallback',
    label: 'Local alias dictionary fallback',
    networked: false,
    openSourceOrFree: false,
    dictionaryDependent: true,
  },
} satisfies Record<string, Omit<OpenSourceAddressResolutionStep, 'priority'>>;

function normalizeAddressLanguage(language: string | null | undefined) {
  return normalizeRegistrationAddressLanguage(language);
}

function needsInternationalEnglish(input: OpenSourceAddressResolutionPipelineInput) {
  const target = normalizeAddressLanguage(input.targetLanguage);
  const source = normalizeAddressLanguage(input.sourceLanguage);
  if (input.hasCustomTranslator) return false;
  if (target !== 'en') return false;
  if (source === 'en' || source === 'en_domestic') return false;
  return true;
}

export function buildOpenSourceAddressResolutionPipeline(
  input: OpenSourceAddressResolutionPipelineInput = {},
): OpenSourceAddressResolutionStep[] {
  const steps: Omit<OpenSourceAddressResolutionStep, 'priority'>[] = [];

  if (input.hasPostcode) {
    steps.push(BASE_STEPS.officialPostalApi, BASE_STEPS.openPostalDataset);
  }
  if (input.hasCoordinates) {
    steps.push(BASE_STEPS.openGeodata);
    if (input.needsNaturalGeographyContext || input.sparseOrRemoteArea) {
      steps.push(BASE_STEPS.spaceAgencyGeodata);
    }
  }
  if (needsInternationalEnglish(input)) {
    steps.push(BASE_STEPS.openSourceTranslation, BASE_STEPS.openSourceTransliteration);
  }

  steps.push(BASE_STEPS.localFormatRules, BASE_STEPS.localDictionaryFallback);

  return steps.map((step, index) => ({ ...step, priority: index + 1 }));
}

export function shouldUseOpenSourceTranslationBeforeLocalFallback(input: OpenSourceTranslationPriorityInput) {
  if (input.hasCustomTranslator) return false;
  if (NON_ADDRESS_TRANSLATION_FIELDS.has(input.fieldKey)) return false;
  if (!ADDRESS_TEXT_FIELDS.has(input.fieldKey)) return false;

  const text = input.text.trim();
  if (!text) return false;
  if (/^[\d\s\-+/.,#]+$/.test(text)) return false;

  return needsInternationalEnglish({
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    hasCustomTranslator: input.hasCustomTranslator,
  });
}
