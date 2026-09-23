export type AddressTranslationMode =
  | 'identity'
  | 'english'
  | 'script-conversion'
  | 'direct-native'
  | 'english-pivot';

export type AddressTranslationRoute<
  TTopology extends string,
  TAlgorithm extends string,
> = {
  mode: AddressTranslationMode;
  sourceTopology: TTopology;
  targetTopology: TTopology;
  pivotLanguage?: 'en';
  algorithm: TAlgorithm | 'script-conversion' | 'same-topology-mt';
};

export type AddressFieldTranslator = (input: {
  text: string;
  target: string;
  source?: string;
}) => Promise<string | null>;

export function chooseCommonAddressTranslationRoute<
  TTopology extends string,
  TAlgorithm extends string,
>(options: {
  sourceLanguage: string;
  targetLanguage: string;
  sourceTopology: TTopology;
  targetTopology: TTopology;
  englishAlgorithm: TAlgorithm;
  englishTopology: TTopology;
  scriptConversion?: boolean;
  directNative?: boolean;
}): AddressTranslationRoute<TTopology, TAlgorithm> {
  const {
    sourceLanguage,
    targetLanguage,
    sourceTopology,
    targetTopology,
    englishAlgorithm,
    englishTopology,
    scriptConversion = false,
    directNative = false,
  } = options;

  if (sourceLanguage === targetLanguage) {
    return {
      mode: 'identity',
      sourceTopology,
      targetTopology,
      algorithm: 'same-topology-mt',
    };
  }

  if (targetLanguage === 'en') {
    return {
      mode: 'english',
      sourceTopology,
      targetTopology: englishTopology,
      pivotLanguage: 'en',
      algorithm: englishAlgorithm,
    };
  }

  if (scriptConversion) {
    return {
      mode: 'script-conversion',
      sourceTopology,
      targetTopology,
      algorithm: 'script-conversion',
    };
  }

  if (sourceLanguage === 'en') {
    return {
      mode: 'english-pivot',
      sourceTopology: englishTopology,
      targetTopology,
      pivotLanguage: 'en',
      algorithm: englishAlgorithm,
    };
  }

  if (directNative || sourceTopology === targetTopology) {
    return {
      mode: 'direct-native',
      sourceTopology,
      targetTopology,
      algorithm: 'same-topology-mt',
    };
  }

  return {
    mode: 'english-pivot',
    sourceTopology,
    targetTopology,
    pivotLanguage: 'en',
    algorithm: englishAlgorithm,
  };
}

function cleanedTranslation(text: string | null | undefined) {
  const translated = String(text ?? '').trim();
  return translated || null;
}

const NON_ENGLISH_ADDRESS_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}\p{Script=Gujarati}\p{Script=Gurmukhi}\p{Script=Oriya}\p{Script=Sinhala}\p{Script=Thai}\p{Script=Lao}\p{Script=Myanmar}\p{Script=Khmer}\p{Script=Ethiopic}\p{Script=Armenian}\p{Script=Georgian}\p{Script=Tibetan}\p{Script=Thaana}]/u;

function isUsableEnglishAddressText(text: string) {
  return Boolean(cleanedTranslation(text)) && !NON_ENGLISH_ADDRESS_SCRIPT.test(text);
}

function shouldUseEnglishTranslatorFallbackForField(fieldKey: string | undefined) {
  if (!fieldKey) return true;
  const normalized = fieldKey.toLowerCase();
  if (/(recipient|phone|email|postcode|postal|zip|country|agid|code)/.test(normalized)) return false;
  return [
    'address',
    'street',
    'road',
    'avenue',
    'lane',
    'city',
    'town',
    'village',
    'suburb',
    'state',
    'province',
    'region',
    'prefecture',
    'district',
    'county',
    'municipality',
    'commune',
    'ward',
    'neighborhood',
    'locality',
    'building',
    'organization',
    'company',
    'landmark',
    'poi',
    'amenity',
    'shop',
    'office',
    'tourism',
    'island',
    'islet',
    'archipelago',
    'atoll',
    'cay',
    'key',
    'river',
    'stream',
    'canal',
    'waterfall',
    'lake',
    'reservoir',
    'lagoon',
    'pond',
    'bay',
    'water',
    'mountain',
    'desert',
    'dryland',
    'wilderness',
    'salt_lake',
    'ice_field',
    'grassland',
    'forest',
    'wetland',
    'cave',
    'valley',
    'glacier',
    'natural_feature',
    'area',
    'quarter',
    'block',
    'department',
  ].some(term => normalized.includes(term));
}

export async function translateAddressFieldByRoute<TRoute extends { mode: AddressTranslationMode }>(options: {
  text: string;
  route: TRoute;
  fieldKey?: string;
  sourceLanguage: string;
  targetLanguage: string;
  normalizeEnglish: (text: string) => string;
  translator?: AddressFieldTranslator;
  translatorSourceLanguage?: string;
  normalizeEnglishIdentity?: boolean;
  convertScript?: (text: string) => string;
}): Promise<{ text: string; route: TRoute } | null> {
  const {
    text,
    route,
    fieldKey,
    sourceLanguage,
    targetLanguage,
    normalizeEnglish,
    translator,
    translatorSourceLanguage,
    normalizeEnglishIdentity = false,
    convertScript,
  } = options;

  if (route.mode === 'identity') {
    if (normalizeEnglishIdentity && sourceLanguage === 'en' && targetLanguage === 'en') {
      return { text: normalizeEnglish(text) || text, route };
    }
    return { text, route };
  }

  if (route.mode === 'english') {
    const english = normalizeEnglish(text);
    if (isUsableEnglishAddressText(english)) return { text: english, route };
    if (!translator || !shouldUseEnglishTranslatorFallbackForField(fieldKey)) return null;

    const translated = await translator({ text, source: sourceLanguage, target: 'en' });
    const clean = cleanedTranslation(translated);
    return clean ? { text: clean, route } : null;
  }

  if (route.mode === 'script-conversion') {
    const converted = convertScript?.(text);
    return converted ? { text: converted, route } : null;
  }

  if (!translator) return null;

  if (route.mode === 'direct-native') {
    const translated = await translator({ text, source: sourceLanguage, target: targetLanguage });
    const clean = cleanedTranslation(translated);
    return clean ? { text: clean, route } : null;
  }

  if (sourceLanguage === 'en') {
    const translated = await translator({
      text,
      source: translatorSourceLanguage || 'en',
      target: targetLanguage,
    });
    const clean = cleanedTranslation(translated);
    return clean ? { text: clean, route } : null;
  }

  const english = normalizeEnglish(text);
  if (!english) return null;
  const translated = await translator({ text: english, source: 'en', target: targetLanguage });
  const clean = cleanedTranslation(translated);
  return clean ? { text: clean, route } : null;
}
