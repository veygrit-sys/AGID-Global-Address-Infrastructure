import {
  transliterateArabic,
  transliterateChinese,
  transliterateCyrillic,
  transliterateJapanese,
} from './transliteration';

export type AsianShippingScript =
  | 'arabic'
  | 'cyrillic'
  | 'hangul'
  | 'hebrew'
  | 'indic'
  | 'japanese'
  | 'khmer'
  | 'lao'
  | 'myanmar'
  | 'thaana'
  | 'thai'
  | 'tibetan';

export type AsianShippingTransliterationResult = {
  text: string;
  appliedScripts: AsianShippingScript[];
  incomplete: boolean;
};

const SCRIPT_TESTS: ReadonlyArray<readonly [AsianShippingScript, RegExp]> = [
  ['arabic', /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u],
  ['cyrillic', /[\u0400-\u052f]/u],
  ['hangul', /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/u],
  ['hebrew', /[\u0590-\u05ff]/u],
  ['indic', /[\u0900-\u0dff]/u],
  ['japanese', /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u9fff]/u],
  ['khmer', /[\u1780-\u17ff]/u],
  ['lao', /[\u0e80-\u0eff]/u],
  ['myanmar', /[\u1000-\u109f\uaa60-\uaa7f]/u],
  ['thaana', /[\u0780-\u07bf]/u],
  ['thai', /[\u0e00-\u0e7f]/u],
  ['tibetan', /[\u0f00-\u0fff]/u],
];

const NATIVE_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  '੦': '0', '੧': '1', '੨': '2', '੩': '3', '੪': '4',
  '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9',
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
  '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  '୦': '0', '୧': '1', '୨': '2', '୩': '3', '୪': '4',
  '୫': '5', '୬': '6', '୭': '7', '୮': '8', '୯': '9',
  '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
  '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
  '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
  '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
  '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
  '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4',
  '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
  '໐': '0', '໑': '1', '໒': '2', '໓': '3', '໔': '4',
  '໕': '5', '໖': '6', '໗': '7', '໘': '8', '໙': '9',
  '၀': '0', '၁': '1', '၂': '2', '၃': '3', '၄': '4',
  '၅': '5', '၆': '6', '၇': '7', '၈': '8', '၉': '9',
};

const HANGUL_INITIAL = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp',
  's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
] as const;
const HANGUL_MEDIAL = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
] as const;
const HANGUL_FINAL = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk', 'lm',
  'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't', 't',
  'ng', 't', 't', 'k', 't', 'p', 'h',
] as const;

export function transliterateHangul(text: string) {
  return Array.from(text).map(char => {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0xac00 || code > 0xd7a3) return char;
    const syllable = code - 0xac00;
    const initial = Math.floor(syllable / 588);
    const medial = Math.floor((syllable % 588) / 28);
    const final = syllable % 28;
    return `${HANGUL_INITIAL[initial]}${HANGUL_MEDIAL[medial]}${HANGUL_FINAL[final]}`;
  }).join('');
}

const HEBREW_MAP: Record<string, string> = {
  'א': '', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
  'ז': 'z', 'ח': 'kh', 'ט': 't', 'י': 'y', 'כ': 'kh', 'ך': 'kh',
  'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
  'ע': '', 'פ': 'p', 'ף': 'p', 'צ': 'ts', 'ץ': 'ts', 'ק': 'k',
  'ר': 'r', 'ש': 'sh', 'ת': 't', '׳': "'", '״': '"',
};

export function transliterateHebrew(text: string) {
  return Array.from(text.normalize('NFD'))
    .map(char => {
      if (/[\u0591-\u05bd\u05bf-\u05c7]/u.test(char)) return '';
      return HEBREW_MAP[char] ?? char;
    })
    .join('');
}

const INDIC_BLOCK_BASES = [
  0x0900, 0x0980, 0x0a00, 0x0a80, 0x0b00,
  0x0b80, 0x0c00, 0x0c80, 0x0d00,
] as const;
const INDIC_INDEPENDENT_VOWELS: Record<number, string> = {
  0x04: 'a', 0x05: 'a', 0x06: 'aa', 0x07: 'i', 0x08: 'ii',
  0x09: 'u', 0x0a: 'uu', 0x0b: 'ri', 0x0c: 'li', 0x0d: 'e',
  0x0e: 'e', 0x0f: 'e', 0x10: 'ai', 0x11: 'o', 0x12: 'o',
  0x13: 'o', 0x14: 'au',
};
const INDIC_CONSONANTS: Record<number, string> = {
  0x15: 'k', 0x16: 'kh', 0x17: 'g', 0x18: 'gh', 0x19: 'ng',
  0x1a: 'ch', 0x1b: 'chh', 0x1c: 'j', 0x1d: 'jh', 0x1e: 'ny',
  0x1f: 't', 0x20: 'th', 0x21: 'd', 0x22: 'dh', 0x23: 'n',
  0x24: 't', 0x25: 'th', 0x26: 'd', 0x27: 'dh', 0x28: 'n',
  0x29: 'n', 0x2a: 'p', 0x2b: 'ph', 0x2c: 'b', 0x2d: 'bh',
  0x2e: 'm', 0x2f: 'y', 0x30: 'r', 0x31: 'r', 0x32: 'l',
  0x33: 'l', 0x34: 'l', 0x35: 'v', 0x36: 'sh', 0x37: 'sh',
  0x38: 's', 0x39: 'h',
};
const INDIC_VOWEL_SIGNS: Record<number, string> = {
  0x3e: 'aa', 0x3f: 'i', 0x40: 'ii', 0x41: 'u', 0x42: 'uu',
  0x43: 'ri', 0x44: 'rii', 0x45: 'e', 0x46: 'e', 0x47: 'e',
  0x48: 'ai', 0x49: 'o', 0x4a: 'o', 0x4b: 'o', 0x4c: 'au',
};

function indicBlock(code: number) {
  return INDIC_BLOCK_BASES.find(base => code >= base && code <= base + 0x7f);
}

export function transliterateIndic(text: string) {
  const chars = Array.from(text);
  return chars.map((char, index) => {
    const code = char.codePointAt(0) ?? 0;
    const base = indicBlock(code);
    if (base === undefined) return char;
    const offset = code - base;
    if (NATIVE_DIGITS[char]) return NATIVE_DIGITS[char];
    if (INDIC_INDEPENDENT_VOWELS[offset]) return INDIC_INDEPENDENT_VOWELS[offset];
    if (INDIC_VOWEL_SIGNS[offset]) return INDIC_VOWEL_SIGNS[offset];
    if (offset === 0x01 || offset === 0x02) return 'n';
    if (offset === 0x03) return 'h';
    if (offset === 0x3c || offset === 0x4d || offset === 0x51) return '';
    const consonant = INDIC_CONSONANTS[offset];
    if (!consonant) return char;
    const nextCode = chars[index + 1]?.codePointAt(0) ?? 0;
    const nextOffset = indicBlock(nextCode) === base ? nextCode - base : -1;
    const hasExplicitVowel = Boolean(INDIC_VOWEL_SIGNS[nextOffset]);
    const hasVirama = nextOffset === 0x4d;
    return `${consonant}${hasExplicitVowel || hasVirama ? '' : 'a'}`;
  }).join('');
}

const THAI_MAP: Record<string, string> = {
  'ก': 'k', 'ข': 'kh', 'ฃ': 'kh', 'ค': 'kh', 'ฅ': 'kh', 'ฆ': 'kh',
  'ง': 'ng', 'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch',
  'ญ': 'y', 'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th', 'ฒ': 'th',
  'ณ': 'n', 'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th', 'ธ': 'th',
  'น': 'n', 'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph',
  'ฟ': 'f', 'ภ': 'ph', 'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l',
  'ว': 'w', 'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l',
  'อ': 'o', 'ฮ': 'h', 'ะ': 'a', 'ั': 'a', 'า': 'a', 'ำ': 'am',
  'ิ': 'i', 'ี': 'i', 'ึ': 'ue', 'ื': 'ue', 'ุ': 'u', 'ู': 'u',
  'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai', 'ๅ': 'a',
  '็': '', '่': '', '้': '', '๊': '', '๋': '', '์': '', 'ๆ': '',
};

const LAO_MAP: Record<string, string> = {
  'ກ': 'k', 'ຂ': 'kh', 'ຄ': 'kh', 'ງ': 'ng', 'ຈ': 'ch', 'ສ': 's',
  'ຊ': 's', 'ຍ': 'ny', 'ດ': 'd', 'ຕ': 't', 'ຖ': 'th', 'ທ': 'th',
  'ນ': 'n', 'ບ': 'b', 'ປ': 'p', 'ຜ': 'ph', 'ຝ': 'f', 'ພ': 'ph',
  'ຟ': 'f', 'ມ': 'm', 'ຢ': 'y', 'ຣ': 'r', 'ລ': 'l', 'ວ': 'w',
  'ຫ': 'h', 'ອ': 'o', 'ຮ': 'h', 'ະ': 'a', 'ັ': 'a', 'າ': 'a',
  'ິ': 'i', 'ີ': 'i', 'ຶ': 'ue', 'ື': 'ue', 'ຸ': 'u', 'ູ': 'u',
  'ເ': 'e', 'ແ': 'ae', 'ໂ': 'o', 'ໃ': 'ai', 'ໄ': 'ai',
  '່': '', '້': '', '໊': '', '໋': '', '໌': '',
};

const KHMER_MAP: Record<string, string> = {
  'ក': 'k', 'ខ': 'kh', 'គ': 'k', 'ឃ': 'kh', 'ង': 'ng',
  'ច': 'ch', 'ឆ': 'chh', 'ជ': 'ch', 'ឈ': 'chh', 'ញ': 'nh',
  'ដ': 'd', 'ឋ': 'th', 'ឌ': 'd', 'ឍ': 'th', 'ណ': 'n',
  'ត': 't', 'ថ': 'th', 'ទ': 't', 'ធ': 'th', 'ន': 'n',
  'ប': 'b', 'ផ': 'ph', 'ព': 'p', 'ភ': 'ph', 'ម': 'm',
  'យ': 'y', 'រ': 'r', 'ល': 'l', 'វ': 'v', 'ឝ': 'sh',
  'ឞ': 'sh', 'ស': 's', 'ហ': 'h', 'ឡ': 'l', 'អ': 'a',
  'ា': 'a', 'ិ': 'i', 'ី': 'i', 'ឹ': 'ue', 'ឺ': 'ue',
  'ុ': 'u', 'ូ': 'u', 'ួ': 'ua', 'ើ': 'aeu', 'ឿ': 'uea',
  'ៀ': 'ie', 'េ': 'e', 'ែ': 'ae', 'ៃ': 'ai', 'ោ': 'ao',
  'ៅ': 'au', 'ំ': 'm', 'ះ': 'h', 'ៈ': 'a', '្': '',
};

const MYANMAR_MAP: Record<string, string> = {
  'က': 'k', 'ခ': 'kh', 'ဂ': 'g', 'ဃ': 'gh', 'င': 'ng',
  'စ': 's', 'ဆ': 'hs', 'ဇ': 'z', 'ဈ': 'z', 'ည': 'ny',
  'ဋ': 't', 'ဌ': 'ht', 'ဍ': 'd', 'ဎ': 'dh', 'ဏ': 'n',
  'တ': 't', 'ထ': 'ht', 'ဒ': 'd', 'ဓ': 'dh', 'န': 'n',
  'ပ': 'p', 'ဖ': 'ph', 'ဗ': 'b', 'ဘ': 'bh', 'မ': 'm',
  'ယ': 'y', 'ရ': 'y', 'လ': 'l', 'ဝ': 'w', 'သ': 'th',
  'ဟ': 'h', 'ဠ': 'l', 'အ': 'a', 'ါ': 'a', 'ာ': 'a',
  'ိ': 'i', 'ီ': 'i', 'ု': 'u', 'ူ': 'u', 'ေ': 'e',
  'ဲ': 'ae', 'ံ': 'n', '့': '', 'း': '', '္': '', '်': '',
  'ျ': 'y', 'ြ': 'y', 'ွ': 'w', 'ှ': 'h',
};

const THAANA_MAP: Record<string, string> = {
  'ހ': 'h', 'ށ': 'sh', 'ނ': 'n', 'ރ': 'r', 'ބ': 'b', 'ޅ': 'lh',
  'ކ': 'k', 'އ': '', 'ވ': 'v', 'މ': 'm', 'ފ': 'f', 'ދ': 'dh',
  'ތ': 'th', 'ލ': 'l', 'ގ': 'g', 'ޏ': 'gn', 'ސ': 's',
  'ޑ': 'd', 'ޒ': 'z', 'ޓ': 't', 'ޔ': 'y', 'ޕ': 'p',
  'ޖ': 'j', 'ޗ': 'ch', 'ޘ': 'tt', 'ޙ': 'hh', 'ޚ': 'kh',
  'ަ': 'a', 'ާ': 'aa', 'ި': 'i', 'ީ': 'ee', 'ު': 'u',
  'ޫ': 'oo', 'ެ': 'e', 'ޭ': 'ey', 'ޮ': 'o', 'ޯ': 'oa', 'ް': '',
};

const TIBETAN_MAP: Record<string, string> = {
  'ཀ': 'k', 'ཁ': 'kh', 'ག': 'g', 'ང': 'ng', 'ཅ': 'ch',
  'ཆ': 'chh', 'ཇ': 'j', 'ཉ': 'ny', 'ཏ': 't', 'ཐ': 'th',
  'ད': 'd', 'ན': 'n', 'པ': 'p', 'ཕ': 'ph', 'བ': 'b',
  'མ': 'm', 'ཙ': 'ts', 'ཚ': 'tsh', 'ཛ': 'dz', 'ཝ': 'w',
  'ཞ': 'zh', 'ཟ': 'z', 'འ': '', 'ཡ': 'y', 'ར': 'r',
  'ལ': 'l', 'ཤ': 'sh', 'ས': 's', 'ཧ': 'h', 'ཨ': 'a',
  'ི': 'i', 'ུ': 'u', 'ེ': 'e', 'ོ': 'o', '྄': '', '་': ' ',
  '།': '.', '༔': '.',
};

function transliterateWithMap(text: string, map: Readonly<Record<string, string>>) {
  return Array.from(text).map(char => NATIVE_DIGITS[char] ?? map[char] ?? char).join('');
}

export function containsAsianDestinationScript(text: string) {
  return SCRIPT_TESTS.some(([, pattern]) => pattern.test(text));
}

export function transliterateAsianShippingText(
  input: unknown,
  context: { countryCode?: string; language?: string } = {},
): AsianShippingTransliterationResult {
  const source = String(input ?? '').normalize('NFKC');
  const appliedScripts = SCRIPT_TESTS
    .filter(([, pattern]) => pattern.test(source))
    .map(([script]) => script);

  let text = Array.from(source)
    .map(char => NATIVE_DIGITS[char] ?? char)
    .join('');
  text = transliterateHangul(text);
  text = transliterateHebrew(text);
  text = transliterateIndic(text);
  text = transliterateWithMap(text, THAI_MAP);
  text = transliterateWithMap(text, LAO_MAP);
  text = transliterateWithMap(text, KHMER_MAP);
  text = transliterateWithMap(text, MYANMAR_MAP);
  text = transliterateWithMap(text, THAANA_MAP);
  text = transliterateWithMap(text, TIBETAN_MAP);
  if (
    context.countryCode?.toUpperCase() === 'SG'
    && /[\u3400-\u9fff]/u.test(text)
  ) {
    text = transliterateChinese(text);
  } else {
    text = transliterateJapanese(text);
  }
  text = transliterateCyrillic(text);
  text = transliterateArabic(text);
  text = text
    .replace(/[’`]/g, "'")
    .replace(/'(?=\s|$|[.,])/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    text,
    appliedScripts,
    incomplete: containsAsianDestinationScript(text),
  };
}
