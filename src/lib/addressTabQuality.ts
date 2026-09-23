import type { AddressFormat } from '../data/address_formats';
import { assessAddressDisplayQuality } from './addressDisplay';
import type { AddressValidationResult } from './addressValidation';
import {
  getEnglishAddressCircle,
  isEnglishAddressCountry,
  isInternationalShippingEnglishTab,
  normalizeAgidLanguageCode,
} from './languageTabs';

export type AddressTabEnvironment =
  | 'urban'
  | 'rural'
  | 'island'
  | 'remote'
  | 'polar'
  | 'water'
  | 'mountain'
  | 'desert'
  | 'sparse_natural'
  | 'unknown';

export type AddressTabQualityTier = 'stable' | 'good' | 'caution' | 'low' | 'hidden';
export type AddressTabQualityDecision = 'show' | 'warn' | 'reverify' | 'hide';

export type AddressTabQualityScore = {
  tab: string;
  score: number;
  tier: AddressTabQualityTier;
  decision: AddressTabQualityDecision;
  environment: AddressTabEnvironment;
  shouldDisplay: boolean;
  needsReverification: boolean;
  canSkipSecondVerification: boolean;
  reasons: string[];
  components: {
    language: number;
    validation: number;
    display: number;
    source: number;
    geography: number;
    penalty: number;
  };
};

export type AddressTabQualityContext = {
  countryCode?: string | null;
  format?: AddressFormat | null;
  validation?: AddressValidationResult | null;
  details?: Record<string, unknown> | null;
  isSea?: boolean;
  sources?: readonly string[];
  displayTextByTab?: Record<string, string | undefined>;
};

const SMALL_ISLAND_COUNTRIES = new Set([
  'ag', 'ai', 'as', 'aw', 'bb', 'bm', 'bq', 'bs', 'ck', 'cx', 'cc', 'cw',
  'dm', 'fj', 'fm', 'fo', 'gd', 'gl', 'gu', 'ki', 'kn', 'ky', 'lc', 'mf',
  'mh', 'mp', 'ms', 'mu', 'mv', 'nf', 'nr', 'nu', 'pf', 'pn', 'pw', 'sc',
  'sb', 'sx', 'tc', 'tk', 'to', 'tt', 'tv', 'vc', 'vg', 'vi', 'vu', 'ws',
]);

const REMOTE_OR_POLAR_COUNTRIES = new Set([
  'aq', 'bv', 'gs', 'hm', 'io', 'pn', 'sj', 'sj_sva', 'sj_jan', 'tf', 'um',
]);

const BROKEN_DISPLAY_PATTERN =
  /\b(resolving|translating|generating|unavailable|unknown address|address label unavailable)\b/i;

const WATER_TEXT_PATTERN =
  /(?:\b(river|stream|brook|creek|wadi|lake|salt\s*lake|saline\s*lake|pond|reservoir|lagoon|oxbow|bay|gulf|sea|ocean|harbor|harbour|canal|strait|fjord|waterfall|falls|cascade|cataract)\b|水辺|川|河|水路|湖|塩湖|池|貯水池|潟湖|湾|海峡|運河|滝|瀑布)/i;

const WATER_KINDS = new Set([
  'river',
  'lake',
  'pond',
  'bay',
  'water',
  'waterfall',
  'spring',
]);

const ISLAND_TEXT_PATTERN =
  /(?:\b(island|islands|isle|isles|islet|islets|atoll|archipelago|cay|cays|cayo|caye|key|keys|holm|skerry|ait|eyot)\b|島|離島|小島|島嶼|諸島|群島|列島|環礁)/i;

const MOUNTAIN_TEXT_PATTERN =
  /\b(mountain|mount|mt\.?|peak|summit|ridge|volcano|highland|hill|cliff|valley|gorge|canyon|saddle|pass|山地|山岳|山|岳|峰|峠|尾根|火山|高原|丘|崖|谷|峡谷)\b/i;

const DESERT_TEXT_PATTERN =
  /\b(desert|dune|sand|erg|reg|hamada|wadi|arid|砂漠|砂丘|沙漠|沙丘|砂地|乾燥地|ワジ)\b/i;

const SPARSE_NATURAL_TEXT_PATTERN =
  /(?:\b(grassland|prairie|steppe|savanna|heath|scrub|shrubland|tundra|taiga|plain|plateau|basin|badlands?|wilderness|wasteland|moorland|moor|salt\s*flat|salt\s*pan|playa|dry\s*lake|bare\s*rock|scree|shingle|mudflat|fell|forest|woodland|wetland|marsh|swamp|bog|fen|glacier|ice\s*shelf|ice\s*field|ice\s*cap|ice\s*sheet|snowfield|cave|valley|gorge|canyon|reef)\b|草原|ステップ|サバンナ|荒地|荒野|荒原|塩原|塩湖|干上がった湖|裸地|湿地|沼地|森林|森|氷河|氷原|氷床|氷帽|洞窟|谷|峡谷|礁)/i;

const SPARSE_NATURAL_KINDS = new Set([
  'dryland',
  'grassland',
  'forest',
  'wetland',
  'beach',
  'cave',
  'valley',
  'glacier',
  'reef',
  'spring',
  'natural',
]);

const ADDRESS_SCRIPT_PATTERN =
  /[A-Za-zÀ-ž\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff\u0370-\u03ff\u0590-\u05ff\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u0e00-\u0e7f]/;

function clean(value: unknown) {
  return String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasAny(details: Record<string, unknown>, keys: string[]) {
  return keys.some(key => clean(details[key]));
}

function joinedSearchText(details: Record<string, unknown>, displayText: string) {
  return [
    displayText,
    details.display_name,
    details.name,
    details.type,
    details.class,
    details.category,
    details.natural,
    details.water,
    details.waterway,
    details.river,
    details.stream,
    details.canal,
    details.waterfall,
    details.lake,
    details.reservoir,
    details.salt_lake,
    details.lagoon,
    details.oxbow,
    details.pond,
    details.place,
    details.island,
    details.islet,
    details.archipelago,
    details.island_group,
    details.atoll,
    details.cay,
    details.key,
    details.mountain,
    details.mountain_name,
    details.desert,
    details.dune,
    details.dryland,
    details.wilderness,
    details.salt_lake,
    details.salt_flat,
    details.salt_pan,
    details.dry_lake,
    details.badlands,
    details.bare_rock,
    details.scree,
    details.shingle,
    details.grassland,
    details.steppe,
    details.savanna,
    details.scrub,
    details.heath,
    details.tundra,
    details.forest,
    details.wetland,
    details.beach,
    details.cave,
    details.valley,
    details.glacier,
    details.ice_field,
    details.reef,
    details.spring,
    details.natural_feature,
    details.map_feature_name,
    details.map_feature_kind,
    details.landcover,
    details.landuse,
  ].map(clean).filter(Boolean).join(' ');
}

export function classifyAddressTabEnvironment({
  countryCode,
  details,
  isSea,
  displayText = '',
}: {
  countryCode?: string | null;
  details?: Record<string, unknown> | null;
  isSea?: boolean;
  displayText?: string;
}): AddressTabEnvironment {
  const code = clean(countryCode).toLowerCase();
  const data = details || {};
  const searchText = joinedSearchText(data, displayText);
  const lat = numberOrNull(data.lat ?? data.latitude);
  const mapKind = clean(data.map_feature_kind).toLowerCase();

  if (
    isSea ||
    hasAny(data, ['water', 'waterway', 'river', 'stream', 'canal', 'waterfall', 'lake', 'salt_lake', 'reservoir', 'lagoon', 'oxbow', 'pond']) ||
    WATER_KINDS.has(mapKind) ||
    WATER_TEXT_PATTERN.test(searchText)
  ) {
    return 'water';
  }
  if (code === 'aq' || (lat !== null && lat <= -60)) return 'polar';
  if (
    SMALL_ISLAND_COUNTRIES.has(code) ||
    mapKind === 'island' ||
    hasAny(data, ['island', 'islet', 'archipelago', 'island_group', 'atoll', 'cay', 'key']) ||
    ISLAND_TEXT_PATTERN.test(searchText)
  ) {
    return 'island';
  }
  if (
    hasAny(data, ['mountain', 'mountain_name']) ||
    mapKind === 'mountain' ||
    MOUNTAIN_TEXT_PATTERN.test(searchText)
  ) {
    return 'mountain';
  }
  if (
    hasAny(data, ['desert', 'dune']) ||
    mapKind === 'desert' ||
    DESERT_TEXT_PATTERN.test(searchText)
  ) {
    return 'desert';
  }
  if (
    hasAny(data, [
      'dryland',
      'wilderness',
      'salt_flat',
      'salt_pan',
      'dry_lake',
      'badlands',
      'bare_rock',
      'scree',
      'shingle',
      'grassland',
      'steppe',
      'savanna',
      'scrub',
      'heath',
      'tundra',
      'forest',
      'wetland',
      'beach',
      'cave',
      'valley',
      'glacier',
      'ice_field',
      'reef',
      'spring',
    ]) ||
    SPARSE_NATURAL_KINDS.has(mapKind) ||
    SPARSE_NATURAL_TEXT_PATTERN.test(searchText)
  ) {
    return 'sparse_natural';
  }
  if (REMOTE_OR_POLAR_COUNTRIES.has(code)) return 'remote';
  if (hasAny(data, ['city', 'town', 'suburb', 'neighbourhood', 'building', 'house_number'])) return 'urban';
  if (hasAny(data, ['village', 'hamlet', 'farm', 'locality']) || (hasAny(data, ['road']) && !hasAny(data, ['city', 'town']))) {
    return 'rural';
  }

  return 'unknown';
}

function languageScore(tab: string, countryCode: string, format?: AddressFormat | null) {
  const normalizedTab = normalizeAgidLanguageCode(tab);
  const base = normalizedTab === 'en_domestic' ? 'en_domestic' : normalizeAgidLanguageCode(normalizedTab);
  const officialLanguages = new Set(
    (format?.addressRules?.languages || []).map(language => normalizeAgidLanguageCode(language.code))
  );
  const hasDomesticFormat = Boolean(
    format?.domestic?.[base] ||
    Object.keys(format?.domestic || {}).some(code => normalizeAgidLanguageCode(code) === base)
  );

  if (base === 'en_domestic') {
    if (!isEnglishAddressCountry(countryCode)) return 10;
    const circle = getEnglishAddressCircle(countryCode);
    return circle === 'inner' ? 22 : 18;
  }

  if (base === 'en' || isInternationalShippingEnglishTab(base)) {
    if (isEnglishAddressCountry(countryCode)) return 20;
    return format?.english ? 17 : 14;
  }

  if (officialLanguages.has(base) || hasDomesticFormat) return 22;
  if (!officialLanguages.size) return 14;
  return 8;
}

function validationScore(validation?: AddressValidationResult | null) {
  if (!validation) return 8;

  const modeScore: Record<AddressValidationResult['quality']['mode'], number> = {
    'postal-verified': 25,
    'geo-verified': 23,
    'no-postal-code': 22,
    'partial-postal': 12,
    'manual-required': 6,
  };

  return Math.max(modeScore[validation.quality.mode], Math.round(validation.score * 25));
}

function sourceScore(sources: readonly string[], validation?: AddressValidationResult | null, format?: AddressFormat | null) {
  const allSources = new Set([
    ...sources.map(clean).filter(Boolean),
    ...(validation?.checkedWith || []).map(clean).filter(Boolean),
    ...(format?.openSourceIds || []).map(clean).filter(Boolean),
    ...(format?.addressRules?.openSourceIds || []).map(clean).filter(Boolean),
  ]);
  let score = Math.min(12, allSources.size * 3);
  for (const source of allSources) {
    if (/openaddresses|geonames|osm|nominatim|official|postal/i.test(source)) score += 2;
  }
  return Math.min(15, score);
}

function geographyScore(environment: AddressTabEnvironment, validation?: AddressValidationResult | null, details?: Record<string, unknown> | null) {
  const hasGeoAnchor = Boolean(
    numberOrNull(details?.lat ?? details?.latitude) !== null ||
    numberOrNull(details?.lon ?? details?.lng ?? details?.longitude) !== null ||
    clean(details?.plus_code)
  );
  const verified = validation?.status === 'verified';

  if (environment === 'urban') return verified ? 13 : 9;
  if (environment === 'island') return hasGeoAnchor || verified ? 12 : 7;
  if (environment === 'polar') return hasGeoAnchor || verified ? 12 : 6;
  if (environment === 'mountain') return hasGeoAnchor || verified ? 11 : 6;
  if (environment === 'desert') return hasGeoAnchor || verified ? 10 : 5;
  if (environment === 'sparse_natural') return hasGeoAnchor || verified ? 10 : 5;
  if (environment === 'rural') return hasGeoAnchor || verified ? 10 : 6;
  if (environment === 'water') return hasGeoAnchor ? 8 : 4;
  if (environment === 'remote') return hasGeoAnchor || verified ? 9 : 5;
  return hasGeoAnchor ? 8 : 5;
}

function displayScore(displayText: string, validation?: AddressValidationResult | null) {
  const assessed = assessAddressDisplayQuality(displayText, {
    missingRequiredFields: validation?.missingRequiredFields,
  });
  const structuralParts = displayText
    .split(/\r?\n|,/)
    .map(clean)
    .filter(part => ADDRESS_SCRIPT_PATTERN.test(part));
  const structuralScore = Math.min(20, structuralParts.length * 6 + (displayText.length >= 24 ? 4 : 0));

  if (validation?.status === 'verified') {
    return Math.max(Math.round(assessed.score * 20), structuralScore);
  }

  return Math.round(Math.max(assessed.score * 20, structuralScore * 0.7));
}

function penaltyScore({
  tab,
  validation,
  displayText,
  environment,
}: {
  tab: string;
  validation?: AddressValidationResult | null;
  displayText: string;
  environment: AddressTabEnvironment;
}) {
  let penalty = 0;
  const normalizedTab = normalizeAgidLanguageCode(tab);

  if (!clean(displayText) || BROKEN_DISPLAY_PATTERN.test(displayText)) penalty += 30;
  if (validation?.postalCodeValid === false) penalty += 20;
  penalty += Math.min(20, (validation?.missingRequiredFields.length || 0) * 7);
  penalty += Math.min(12, (validation?.warnings.length || 0) * 3);

  if (
    normalizedTab === 'en' &&
    validation?.status !== 'verified' &&
    (
      environment === 'rural' ||
      environment === 'island' ||
      environment === 'remote' ||
      environment === 'polar' ||
      environment === 'mountain' ||
      environment === 'desert' ||
      environment === 'sparse_natural'
    )
  ) {
    penalty += 6;
  }

  return penalty;
}

function qualityTier(score: number, displayIsBroken: boolean): AddressTabQualityTier {
  if (displayIsBroken || score < 35) return 'hidden';
  if (score < 55) return 'low';
  if (score < 70) return 'caution';
  if (score < 85) return 'good';
  return 'stable';
}

function decisionForTier(tier: AddressTabQualityTier): AddressTabQualityDecision {
  if (tier === 'hidden') return 'hide';
  if (tier === 'low') return 'reverify';
  if (tier === 'caution') return 'warn';
  return 'show';
}

function buildReasons({
  score,
  tab,
  countryCode,
  validation,
  environment,
  displayText,
}: {
  score: number;
  tab: string;
  countryCode: string;
  validation?: AddressValidationResult | null;
  environment: AddressTabEnvironment;
  displayText: string;
}) {
  const reasons: string[] = [];
  if (!clean(displayText) || BROKEN_DISPLAY_PATTERN.test(displayText)) reasons.push('display text is unresolved');
  if (validation?.postalCodeValid === false) reasons.push('postal code failed country rule validation');
  if (validation?.missingRequiredFields.length) {
    reasons.push(`missing required fields: ${validation.missingRequiredFields.join(', ')}`);
  }
  if (validation?.status === 'partial') reasons.push(validation.quality.reason);
  if (
    environment === 'rural' ||
    environment === 'island' ||
    environment === 'remote' ||
    environment === 'polar' ||
    environment === 'mountain' ||
    environment === 'desert' ||
    environment === 'sparse_natural'
  ) {
    reasons.push(`${environment} address context needs stronger geospatial evidence when confidence is low`);
  }
  if (normalizeAgidLanguageCode(tab) === 'en' && !isEnglishAddressCountry(countryCode)) {
    reasons.push('international English tab depends on address-format conversion');
  }
  if (score >= 85 && reasons.length === 0) reasons.push('stable country, language, source, and display evidence');
  return Array.from(new Set(reasons));
}

export function scoreAddressTabQuality(
  tab: string,
  context: AddressTabQualityContext,
): AddressTabQualityScore {
  const countryCode = clean(context.countryCode || context.format?.countryCode).toLowerCase();
  const validation = context.validation;
  const displayText = clean(context.displayTextByTab?.[tab]);
  const displayQuality = assessAddressDisplayQuality(displayText, {
    country: clean(context.details?.country),
    countryCode,
    missingRequiredFields: validation?.missingRequiredFields,
  });
  const environment = classifyAddressTabEnvironment({
    countryCode,
    details: context.details,
    isSea: context.isSea,
    displayText,
  });

  const components = {
    language: languageScore(tab, countryCode, context.format),
    validation: validationScore(validation),
    display: displayScore(displayText, validation),
    source: sourceScore(context.sources || [], validation, context.format),
    geography: geographyScore(environment, validation, context.details),
    penalty: penaltyScore({
      tab,
      validation,
      displayText,
      environment,
    }),
  };
  const score = clampScore(
    components.language +
      components.validation +
      components.display +
      components.source +
      components.geography -
      components.penalty
  );
  const displayIsBroken = !displayText || BROKEN_DISPLAY_PATTERN.test(displayText) || displayQuality.isWeak && score < 45;
  const tier = qualityTier(score, displayIsBroken);
  const decision = decisionForTier(tier);
  const needsReverification =
    decision === 'reverify' ||
    decision === 'hide' ||
    (decision === 'warn' && validation?.status !== 'verified');
  const canSkipSecondVerification =
    score >= 85 &&
    decision === 'show' &&
    validation?.status === 'verified' &&
    validation.postalCodeValid !== false &&
    !validation.missingRequiredFields.length &&
    !displayQuality.isWeak;

  return {
    tab,
    score,
    tier,
    decision,
    environment,
    shouldDisplay: decision !== 'hide',
    needsReverification,
    canSkipSecondVerification,
    reasons: buildReasons({
      score,
      tab,
      countryCode,
      validation,
      environment,
      displayText,
    }),
    components,
  };
}

export function scoreAddressTabs(
  tabs: readonly string[],
  context: AddressTabQualityContext,
): Record<string, AddressTabQualityScore> {
  return Object.fromEntries(tabs.map(tab => [tab, scoreAddressTabQuality(tab, context)]));
}

export function selectVisibleAddressTabs(
  tabs: readonly string[],
  qualityByTab: Record<string, AddressTabQualityScore>,
) {
  const visible = tabs.filter(tab => qualityByTab[tab]?.shouldDisplay !== false);
  if (visible.length > 0) return visible;

  const fallback = [...tabs].sort((a, b) => (qualityByTab[b]?.score ?? 0) - (qualityByTab[a]?.score ?? 0))[0];
  return fallback ? [fallback] : [];
}

export function describeAddressTabQuality(quality: AddressTabQualityScore) {
  if (quality.decision === 'hide') return 'Low confidence address tab hidden from normal display.';
  if (quality.decision === 'reverify') return 'Address tab needs re-verification.';
  if (quality.decision === 'warn') return 'Address tab confidence is limited.';
  return 'Address tab confidence is stable.';
}
