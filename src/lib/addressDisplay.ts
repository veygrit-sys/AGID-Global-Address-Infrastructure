import { isEnglishAddressCountry, isInternationalShippingEnglishTab } from './languageTabs';

const cleanAddressLine = (line: string) =>
  line
    .normalize('NFKC')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/^[,，、]\s*/g, '')
    .replace(/,\s*$/g, '')
    .trim();

export function shouldPreserveAddressDisplayLines(tab: string, countryCode = '') {
  const country = countryCode.trim().toLowerCase();
  const isInternationalEnglishTab =
    tab === 'en' && country.length > 0 && !isEnglishAddressCountry(country);

  return isInternationalEnglishTab || isInternationalShippingEnglishTab(tab) || tab === 'shipping_label';
}

export function formatAddressDisplayText(address: string, options: { tab: string; countryCode?: string }) {
  const lines = address
    .split(/\r?\n/)
    .map(cleanAddressLine)
    .filter(Boolean);

  if (shouldPreserveAddressDisplayLines(options.tab, options.countryCode)) {
    return lines.join('\n');
  }

  return lines
    .join(', ')
    .replace(/,\s*,/g, ',')
    .replace(/^[,，、]\s*/g, '')
    .replace(/,\s*$/g, '')
    .trim();
}

const meaningfulTextPattern =
  /[A-Za-zÀ-ž\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff\u0370-\u03ff\u0590-\u05ff\u0600-\u06ff\u0750-\u077f\u07c0-\u07ff\u08a0-\u08ff\u0e00-\u0e7f\u1200-\u137f\u2d30-\u2d7f\ua500-\ua63f\u{1e900}-\u{1e95f}]/u;

const compactEastAsianAddressSignals = [
  /〒\s*\d{3}-?\d{4}/,
  /[\u3400-\u9fff]{1,8}[都道府県]/,
  /[\u3400-\u9fff]{1,12}[市区區町村]/,
  /[\uac00-\ud7af]{1,12}(특별시|광역시|자치시|자치도|도|시|군|구)/,
  /[\u3400-\u9fff]{1,12}(町|丁目|番地|号|號|路|街|道|大街)/,
  /[\uac00-\ud7af0-9]{1,16}(대로|로|길)/,
  /\d{1,4}[-－]\d{1,4}(?:[-－]\d{1,4})?/,
  /[\u3400-\u9fff]{2,}(ビル|センター|庁舎|館|駅|公園|学校|病院|中心|大廈|大厦|大樓|大楼|碼頭|码头|車站|车站|學校|学校|醫院|医院)/,
  /[\uac00-\ud7af]{2,}(빌딩|센터|청사|관|역|공원|학교|병원)/,
];

const embeddedAddressStructureSignals = [
  /\b(?:region|province|prefecture|governorate|emirate|state|departamento|provincia|estado)\b/i,
  /\b(?:city|municipality|town|village|harbor|harbour|port|oasis|municipio)\b/i,
  /\b(?:district|county|ward|quarter|neighbou?rhood|subdistrict|parish|canton|commune|borough|barrio|colonia|comuna|corregimiento|partido|parroquia)\b/i,
  /\b(?:road|street|avenue|lane|drive|way|boulevard|route|highway|expressway|track|trail|pass|feeder|quay|embankment|promenade|square|plaza|platz|piazza|plein|canal|avenida|carretera|camino|estrada|rodovia|travessa|wharf|jetty|landing|causeway|navigation\s+route|marine\s+route)\b/i,
  /\b(?:building|tower|center|centre|terminal|station|market|field\s+post|health\s+post|post|hall|customs|castle|museum|shelter|camp|clinic|lodge|research\s+station|polar\s+base|field\s+base|ice\s+runway|handoff\s+point|anchorage|pier|marina)\b/i,
  /\b(?:island|isla|islet|archipelago|island\s+group|outer\s+island|atoll|cay|key|reef|reef\s+pass|lagoon|coral|volcanic|volcano|coastal|costa|playa|marine|sea|ocean|gulf|gulf\s+stream|channel|shelf|marginal\s+sea|sargasso|transatlantic|monsoon|dhow|anchorage|arctic|antarctic|polar|southern\s+ocean|sea\s+ice|pack\s+ice|ice\s+shelf|shelf\s+ice|polynya|ice\s+floe|mountain|valley|highland|desert|steppe|dryland|savanna|grassland|reserve|conservancy|rainforest|jungle|selva|pampas|llanos|andes|amazon|patagonia|altiplano|river|canal|lake|glacier|icefield|forest|wetland|heritage|border|riverside|waterfront|fjord|strait|bay)\b/i,
];

const normalizeComparable = (value: unknown) =>
  String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();

function splitAddressParts(address: string) {
  return address
    .split(/\r?\n|,/)
    .map(cleanAddressLine)
    .filter(Boolean);
}

export function assessAddressDisplayQuality(
  address: string,
  options: { country?: string; countryCode?: string; missingRequiredFields?: string[] } = {}
) {
  const parts = splitAddressParts(address);
  const country = normalizeComparable(options.country);
  const countryCode = normalizeComparable(options.countryCode);

  const meaningfulParts = parts.filter(part => {
    const comparable = normalizeComparable(part);
    if (!comparable) return false;
    if (country && comparable === country) return false;
    if (countryCode && comparable === countryCode) return false;
    if (/^\d+[a-z]?$/.test(comparable)) return false;
    return meaningfulTextPattern.test(part);
  });

  const hasStreetLikePart = parts.some(part =>
    /\b(street|st|road|rd|avenue|ave|lane|ln|drive|dr|way|route|highway|expressway|track|trail|pass|feeder|quay|embankment|promenade|square|plaza|platz|piazza|plein|canal|wharf|jetty|landing|causeway|navigation\s+route|marine\s+route|avenida|carretera|camino|estrada|rodovia|travessa|rue|straße|strasse|calle|carrer|via|rua|ulica|prospekt|boulevard|passeig|gade|gate|väg|vag|vei|tie)\b/i.test(part) ||
    /[\u3040-\u30ff\u3400-\u9fff](通|町|丁目|番地|号|路|街|道|大街)/.test(part) ||
    /[\uac00-\ud7af](대로|로|길)/.test(part)
  );
  const compactSignalCount = new Set(
    parts.flatMap(part =>
      compactEastAsianAddressSignals
        .map((pattern, index) => pattern.test(part) ? index : -1)
        .filter(index => index >= 0)
    )
  ).size;
  const embeddedSignalCount = new Set(
    parts.flatMap(part =>
      embeddedAddressStructureSignals
        .map((pattern, index) => pattern.test(part) ? index : -1)
        .filter(index => index >= 0)
    )
  ).size;

  const missingRequiredCount = options.missingRequiredFields?.length ?? 0;
  const score = Math.max(
    0,
    Math.min(
      1,
      meaningfulParts.length * 0.28 +
        (hasStreetLikePart ? 0.22 : 0) +
        Math.min(0.3, compactSignalCount * 0.08) +
        Math.min(0.2, embeddedSignalCount * 0.05) +
        (parts.length >= 2 ? 0.12 : 0) -
        missingRequiredCount * 0.12
    )
  );

  return {
    score: Math.round(score * 100) / 100,
    isWeak: meaningfulParts.length === 0 || (meaningfulParts.length <= 1 && !hasStreetLikePart && missingRequiredCount > 0),
    meaningfulParts,
  };
}
