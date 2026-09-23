import { getAddressFormat } from '../data/address_formats';
// import { GoogleGenAI } from "@google/genai"; // Gemini removed per user request
import { normalizeEnglishAddressPart } from './addressEnglish';
import { selectAddressLanguageFormat } from './addressFormatRenderer';
import { formatNaturalAddress } from './naturalAddress';
import { resolveEnglishAddressPartOpenSource } from './openSourceAddressResolver';
import { transliterate } from './transliteration';

// --- Address Utilities ---

// In-memory cache for translations to reduce API calls
const translationCache: Record<string, string> = {};

// --- Address Abbreviations for Shipping Labels ---
const SHIPPING_ABBREVIATIONS: Record<string, string> = {
  // Ordered by length descending to match longest phrases first
  "Northwest": "NW",
  "Northeast": "NE",
  "Southwest": "SW",
  "Southeast": "SE",
  "Street": "St",
  "Avenue": "Ave",
  "Boulevard": "Blvd",
  "Road": "Rd",
  "Lane": "Ln",
  "Drive": "Dr",
  "Court": "Ct",
  "Apartment": "Apt",
  "Suite": "Ste",
  "Building": "Bldg",
  "Floor": "Fl",
  "Unit": "Unit",
  "Department": "Dept",
  "Place": "Pl",
  "Square": "Sq",
  "Terrace": "Ter",
  "North": "N",
  "South": "S",
  "East": "E",
  "West": "W"
};

/**
 * Applies common shipping abbreviations to an address string for shipping labels.
 */
export function applyShippingAbbreviations(text: string): string {
  if (!text) return "";
  let result = text;
  Object.entries(SHIPPING_ABBREVIATIONS).forEach(([full, abbr]) => {
    // Match full word with boundaries to avoid mid-word replacements
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    result = result.replace(regex, abbr);
  });

  return result;
}

/**
 * Robust algorithm to convert local address data into an international shipping label (UPU compatible).
 * Standards used:
 * - UPU S42 (International addressing standards)
 * - ISO/IEC 19773:2011 (Address conversion)
 * - Latin transliteration for global machine readability
 */
export async function generateInternationalShippingLabel(details: any, options: { recipient?: string } = {}): Promise<string> {
  if (!details) return "";

  // 1. Core Data Extraction & Enrichment
  const c = details.country_code?.slice(0, 2).toUpperCase() || "";

  // Use English/International as the base language for the algorithm
  const mapping: Record<string, string> = {
    organization: details.building || details.organization || details.amenity || "",
    houseNumber: details.house_number || details.building || "",
    street: details.road || details.street || "",
    suburb: details.suburb || details.neighbourhood || "",
    city: details.city || details.town || details.village || "",
    state: details.state || details.province || details.region || "",
    postcode: details.postcode || (details.plus_code ? details.plus_code.replace(/\+/g, ' ') : ""),
    country: details.country || ""
  };

  // 2. Language Normalization & Transliteration
  // We must ensure Latin script for international sorting.
  Object.keys(mapping).forEach(key => {
    let val = mapping[key];
    if (val && /[^\u0000-\u007F]/.test(val)) {
      // Use local transliteration logic
      mapping[key] = transliterate(val, c.toLowerCase() || 'en');
    }
  });

  // 3. Postal formatting by country (UPU Standard)
  let formatted = "";
  if (options.recipient) {
    formatted += options.recipient.toUpperCase() + "\n";
  }

  // Handle Japan specifically (Big-to-Small in local, Small-to-Big in International)
  if (c === 'JP') {
    // International standard for JP: No/Street, Locality, PREFECTURE, POSTCODE, JAPAN
    const block = details.jp_block || details.block_number;
    const chome = details.jp_chome || details.subdistrict;
    const number = details.jp_number;

    let streetPart = mapping.street;
    if (chome || block || number) {
      streetPart = [chome, block, number].filter(Boolean).join("-") + " " + mapping.street;
    }

    formatted += `${streetPart}\n`;
    formatted += `${mapping.suburb ? mapping.suburb + ", " : ""}${mapping.city}\n`;
    formatted += `${mapping.state.toUpperCase()} ${mapping.postcode}\n`;
  } else {
    // Default Western style (UPU Standard)
    if (mapping.organization) formatted += `${mapping.organization}\n`;
    formatted += `${mapping.houseNumber} ${mapping.street}\n`;
    if (mapping.suburb && mapping.suburb !== mapping.city) formatted += `${mapping.suburb}\n`;
    formatted += `${mapping.city}${mapping.state ? ", " + mapping.state : ""} ${mapping.postcode}\n`;
  }

  // 4. Final Country Line (MUST BE CAPITALIZED for international sorting)
  formatted += mapping.country.toUpperCase();

  // 5. Cleanup & Abbreviations
  let lines = formatted.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Apply abbreviations to street-level lines (usually the 1st or 2nd line after recipient)
  lines = lines.map((line, idx) => {
    if (idx > 0 && idx < lines.length - 1) {
      return applyShippingAbbreviations(line);
    }
    return line;
  });

  // Strict Latin character enforcement (remove remaining non-latin if any)
  return lines
    .map(line => line.replace(/[^\x00-\x7F]/g, ""))
    .join('\n')
    .replace(/,\s*,/g, ',')
    .replace(/^,|,$/g, '')
    .trim();
}

export const LANGUAGES = [
  // Global Major
  { code: 'ja', name: '日本語', country: 'Japan', flag: '🇯🇵' },
  { code: 'en-GB', name: 'English (UK)', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'en', name: 'English (US)', country: 'United States', flag: '🇺🇸' },
  { code: 'en-AU', name: 'English (AU)', country: 'Australia', flag: '🇦🇺' },
  { code: 'en-CA', name: 'English (CA)', country: 'Canada', flag: '🇨🇦' },
  { code: 'en-NZ', name: 'English (NZ)', country: 'New Zealand', flag: '🇳🇿' },
  { code: 'en-IE', name: 'English (IE)', country: 'Ireland', flag: '🇮🇪' },
  { code: 'en-ZA', name: 'English (ZA)', country: 'South Africa', flag: '🇿🇦' },
  { code: 'en-IN', name: 'English (IN)', country: 'India', flag: '🇮🇳' },
  { code: 'en-SG', name: 'English (SG)', country: 'Singapore', flag: '🇸🇬' },
  { code: 'en-PH', name: 'English (PH)', country: 'Philippines', flag: '🇵🇭' },
  { code: 'en-JM', name: 'English (JM)', country: 'Jamaica', flag: '🇯🇲' },
  { code: 'en-BS', name: 'English (BS)', country: 'Bahamas', flag: '🇧🇸' },
  { code: 'en-BB', name: 'English (BB)', country: 'Barbados', flag: '🇧🇧' },
  { code: 'en-GY', name: 'English (GY)', country: 'Guyana', flag: '🇬🇾' },
  { code: 'en-TT', name: 'English (TT)', country: 'Trinidad & Tobago', flag: '🇹🇹' },
  { code: 'en-NG', name: 'English (NG)', country: 'Nigeria', flag: '🇳🇬' },
  { code: 'en-GH', name: 'English (GH)', country: 'Ghana', flag: '🇬🇭' },
  { code: 'en-KE', name: 'English (KE)', country: 'Kenya', flag: '🇰🇪' },
  { code: 'en-BZ', name: 'English (BZ)', country: 'Belize', flag: '🇧🇿' },
  { code: 'en-PK', name: 'English (PK)', country: 'Pakistan', flag: '🇵🇰' },
  { code: 'en-BD', name: 'English (BD)', country: 'Bangladesh', flag: '🇧🇩' },
  { code: 'en-LK', name: 'English (LK)', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'en-NP', name: 'English (NP)', country: 'Nepal', flag: '🇳🇵' },
  { code: 'en-MV', name: 'English (MV)', country: 'Maldives', flag: '🇲🇻' },
  { code: 'en-AG', name: 'English (AG)', country: 'Antigua & Barbuda', flag: '🇦🇬' },
  { code: 'en-KN', name: 'English (KN)', country: 'Saint Kitts & Nevis', flag: '🇰🇳' },
  { code: 'en-LC', name: 'English (LC)', country: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'en-VC', name: 'English (VC)', country: 'Saint Vincent', flag: '🇻🇨' },
  { code: 'en-GD', name: 'English (GD)', country: 'Grenada', flag: '🇬🇩' },
  { code: 'en-MY', name: 'English (MY)', country: 'Malaysia', flag: '🇲🇾' },

  // Greater China
  { code: 'zh-Hans', name: '简体中文', country: 'China', flag: '🇨🇳' },
  { code: 'zh-Hant-TW', name: '繁體中文 (台灣)', country: 'Taiwan', flag: '🇹🇼' },
  { code: 'zh-Hant-HK', name: '繁體中文 (香港)', country: 'Hong Kong', flag: '🇭🇰' },
  { code: 'zh-Hant-MO', name: '繁體中文 (澳門)', country: 'Macau', flag: '🇲🇴' },
  { code: 'yue', name: '廣東話 (Cantonese)', country: 'Hong Kong', flag: '🇭🇰' },

  // East Asia
  { code: 'ko', name: '한국어', country: 'South Korea', flag: '🇰🇷' },
  { code: 'ko-KP', name: '조선말', country: 'North Korea', flag: '🇰🇵' },
  { code: 'vi', name: 'Tiếng Việt', country: 'Vietnam', flag: '🇻🇳' },
  { code: 'th', name: 'ไทย', country: 'Thailand', flag: '🇹🇭' },
  { code: 'ms', name: 'Bahasa Melayu', country: 'Malaysia', flag: '🇲🇾' },
  { code: 'id', name: 'Bahasa Indonesia', country: 'Indonesia', flag: '🇮🇩' },
  { code: 'fil', name: 'Filipino', country: 'Philippines', flag: '🇵🇭' },
  { code: 'tl', name: 'Tagalog', country: 'Philippines', flag: '🇵🇭' },
  { code: 'tet', name: 'Tetun', country: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'lo', name: 'ພາສາลาว', country: 'Laos', flag: '🇱🇦' },
  { code: 'km', name: 'ភាសាខ្មែរ', country: 'Cambodia', flag: '🇰🇭' },
  { code: 'my', name: 'ဗမာစာ', country: 'Myanmar', flag: '🇲🇲' },
  { code: 'mn', name: 'Монгол', country: 'Mongolia', flag: '🇲🇳' },
  { code: 'mn-Cyrl', name: 'Монгол кирилл', country: 'Mongolia', flag: '🇲🇳' },

  // Europe
  { code: 'fr', name: 'Français', country: 'France', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', country: 'Germany', flag: '🇩🇪' },
  { code: 'de-CH', name: 'Deutsch (Schweiz)', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'de-AT', name: 'Deutsch (Österreich)', country: 'Austria', flag: '🇦🇹' },
  { code: 'it', name: 'Italiano', country: 'Italy', flag: '🇮🇹' },
  { code: 'es', name: 'Español (España)', country: 'Spain', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', country: 'Portugal', flag: '🇵🇹' },
  { code: 'pt-PT', name: 'Português (Portugal)', country: 'Portugal', flag: '🇵🇹' },
  { code: 'pt-AO', name: 'Português (Angola)', country: 'Angola', flag: '🇦🇴' },
  { code: 'pt-MZ', name: 'Português (Moçambique)', country: 'Mozambique', flag: '🇲🇿' },
  { code: 'pt-CV', name: 'Português (Cabo Verde)', country: 'Cape Verde', flag: '🇨🇻' },
  { code: 'pt-GW', name: 'Português (Guiné-Bissau)', country: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'pt-ST', name: 'Português (São Tomé e Príncipe)', country: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: 'es-GQ', name: 'Español (Guinea Ecuatorial)', country: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ru', name: 'Русский', country: 'Russia', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe', country: 'Turkey', flag: '🇹🇷' },
  { code: 'pl', name: 'Polski', country: 'Poland', flag: '🇵🇱' },
  { code: 'uk', name: 'Українська', country: 'Ukraine', flag: '🇺🇦' },
  { code: 'nl', name: 'Nederlands', country: 'Netherlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', country: 'Sweden', flag: '🇸🇪' },
  { code: 'fi', name: 'Suomi', country: 'Finland', flag: '🇫🇮' },
  { code: 'da', name: 'Dansk', country: 'Denmark', flag: '🇩🇰' },
  { code: 'no', name: 'Norsk', country: 'Norway', flag: '🇳🇴' },
  { code: 'nb', name: 'Norsk bokmål', country: 'Norway', flag: '🇳🇴' },
  { code: 'nn', name: 'Norsk nynorsk', country: 'Norway', flag: '🇳🇴' },
  { code: 'se', name: 'Davvisámegiella', country: 'Sápmi', flag: '🇳🇴' },
  { code: 'hu', name: 'Magyar', country: 'Hungary', flag: '🇭🇺' },
  { code: 'el', name: 'Ελληνικά', country: 'Greece', flag: '🇬🇷' },
  { code: 'is', name: 'Íslenska', country: 'Iceland', flag: '🇮🇸' },
  { code: 'cs', name: 'Čeština', country: 'Czech Republic', flag: '🇨🇿' },
  { code: 'sk', name: 'Slovenčina', country: 'Slovakia', flag: '🇸🇰' },
  { code: 'ro', name: 'Română', country: 'Romania', flag: '🇷🇴' },
  { code: 'bg', name: 'Български', country: 'Bulgaria', flag: '🇧🇬' },
  { code: 'hr', name: 'Hrvatski', country: 'Croatia', flag: '🇭🇷' },
  { code: 'sr', name: 'Српски', country: 'Serbia', flag: '🇷🇸' },
  { code: 'ca', name: 'Català', country: 'Spain', flag: '🇪🇸' },

  // Americas
  { code: 'es-MX', name: 'Español (México)', country: 'Mexico', flag: '🇲🇽' },
  { code: 'es-AR', name: 'Español (Argentina)', country: 'Argentina', flag: '🇦🇷' },
  { code: 'es-CO', name: 'Español (Colombia)', country: 'Colombia', flag: '🇨🇴' },
  { code: 'es-PE', name: 'Español (Perú)', country: 'Peru', flag: '🇵🇪' },
  { code: 'es-VE', name: 'Español (Venezuela)', country: 'Venezuela', flag: '🇻🇪' },
  { code: 'es-CL', name: 'Español (Chile)', country: 'Chile', flag: '🇨🇱' },
  { code: 'es-EC', name: 'Español (Ecuador)', country: 'Ecuador', flag: '🇪🇨' },
  { code: 'es-BO', name: 'Español (Bolivia)', country: 'Bolivia', flag: '🇧🇴' },
  { code: 'es-PY', name: 'Español (Paraguay)', country: 'Paraguay', flag: '🇵🇾' },
  { code: 'es-UY', name: 'Español (Uruguay)', country: 'Uruguay', flag: '🇺🇾' },
  { code: 'es-PA', name: 'Español (Panamá)', country: 'Panama', flag: '🇵🇦' },
  { code: 'es-CR', name: 'Español (Costa Rica)', country: 'Costa Rica', flag: '🇨🇷' },
  { code: 'es-NI', name: 'Español (Nicaragua)', country: 'Nicaragua', flag: '🇳🇮' },
  { code: 'es-HN', name: 'Español (Honduras)', country: 'Honduras', flag: '🇭🇳' },
  { code: 'es-SV', name: 'Español (El Salvador)', country: 'El Salvador', flag: '🇸🇻' },
  { code: 'es-GT', name: 'Español (Guatemala)', country: 'Guatemala', flag: '🇬🇹' },
  { code: 'es-DO', name: 'Español (Rep. Dominicana)', country: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'es-PR', name: 'Español (Puerto Rico)', country: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'es-CU', name: 'Español (Cuba)', country: 'Cuba', flag: '🇨🇺' },
  { code: 'pt-BR', name: 'Português (Brasil)', country: 'Brazil', flag: '🇧🇷' },
  { code: 'qu', name: 'Runasimi (Quechua)', country: 'Andes', flag: '🇵🇪' },
  { code: 'ay', name: 'Aymar aru (Aymara)', country: 'Bolivia / Peru', flag: '🇧🇴' },
  { code: 'gn', name: "Avañe'ẽ (Guarani)", country: 'Paraguay', flag: '🇵🇾' },
  { code: 'ht', name: 'Kreyòl ayisyen', country: 'Haiti', flag: '🇭🇹' },
  { code: 'pap', name: 'Papiamentu', country: 'Aruba / Curaçao / Bonaire', flag: '🇨🇼' },
  { code: 'br', name: 'Brezhoneg', country: 'France', flag: '🇫🇷' },
  { code: 'oc', name: 'Occitan', country: 'France', flag: '🇫🇷' },
  { code: 'co', name: 'Corsu', country: 'France', flag: '🇫🇷' },
  { code: 'ca', name: 'Català', country: 'Spain', flag: '🇪🇸' },
  { code: 'gl', name: 'Galego', country: 'Spain', flag: '🇪🇸' },
  { code: 'eu', name: 'Euskara', country: 'Spain', flag: '🇪🇸' },
  { code: 'sc', name: 'Sardu', country: 'Italy', flag: '🇮🇹' },
  { code: 'fur', name: 'Furlan', country: 'Italy', flag: '🇮🇹' },
  { code: 'cy', name: 'Cymraeg', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'gd', name: 'Gàidhlig', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'lb', name: 'Lëtzebuergesch', country: 'Luxembourg', flag: '🇱🇺' },
  { code: 'rm', name: 'Rumantsch', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'is', name: 'Íslenska', country: 'Iceland', flag: '🇮🇸' },
  { code: 'fo', name: 'Føroyskt', country: 'Faroe Islands', flag: '🇫🇴' },
  { code: 'kl', name: 'Kalaallisut', country: 'Greenland', flag: '🇬🇱' },
  { code: 'ga', name: 'Gaeilge', country: 'Ireland', flag: '🇮🇪' },
  { code: 'gv', name: 'Gaelg', country: 'Isle of Man', flag: '🇮🇲' },
  { code: 'mt', name: 'Malti', country: 'Malta', flag: '🇲🇹' },
  { code: 'wa', name: 'Wallon', country: 'Belgium', flag: '🇧🇪' },
  { code: 'fy', name: 'Frysk', country: 'Netherlands', flag: '🇳🇱' },
  { code: 'lb', name: 'Lëtzebuergesch', country: 'Luxembourg', flag: '🇱🇺' },
  { code: 'rm', name: 'Rumantsch', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'nds', name: 'Plattdüütsch', country: 'Germany', flag: '🇩🇪' },
  { code: 'hsb', name: 'Hornjoserbšćina', country: 'Germany', flag: '🇩🇪' },
  { code: 'dsb', name: 'Dolnoserbšćina', country: 'Germany', flag: '🇩🇪' },
  { code: 'li', name: 'Limburgs', country: 'Netherlands', flag: '🇳🇱' },
  { code: 'vls', name: 'West-Vlaams', country: 'Belgium', flag: '🇧🇪' },
  { code: 'ka', name: 'ქართული', country: 'Georgia', flag: '🇬🇪' },
  { code: 'hy', name: 'Հայერեն', country: 'Armenia', flag: '🇦🇲' },
  { code: 'be', name: 'Беларуская', country: 'Belarus', flag: '🇧🇾' },
  { code: 'ne', name: 'नेपाली', country: 'Nepal', flag: '🇳🇵' },
  { code: 'dz', name: 'རྫོང་ཁ་', country: 'Bhutan', flag: '🇧🇹' },
  { code: 'dv', name: 'ދިވެހި', country: 'Maldives', flag: '🇲🇻' },
  { code: 'sl', name: 'Slovenščina', country: 'Slovenia', flag: '🇸🇮' },
  { code: 'mh', name: 'Kajin M̧ajeļ', country: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'pau', name: 'Belau', country: 'Palau', flag: '🇵🇼' },
  { code: 'na', name: 'Dorerin Naoero', country: 'Nauru', flag: '🇳🇷' },
  { code: 'gil', name: 'Kiribati', country: 'Kiribati', flag: '🇰🇮' },
  { code: 'tvl', name: 'Tuvalu', country: 'Tuvalu', flag: '🇹🇻' },
  { code: 'to', name: 'Lea Faka-Tonga', country: 'Tonga', flag: '🇹🇴' },
  { code: 'sm', name: 'Gagana Sāmoa', country: 'Samoa', flag: '🇼🇸' },
  { code: 'fj', name: 'Vosa Vakaviti', country: 'Fiji', flag: '🇫🇯' },
  { code: 'mi', name: 'Te reo Māori', country: 'New Zealand', flag: '🇳🇿' },
  { code: 'tpi', name: 'Tok Pisin', country: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'bi', name: 'Bislama', country: 'Vanuatu', flag: '🇻🇺' },
  { code: 'pis', name: 'Pijin', country: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'chk', name: 'Chuukese', country: 'Micronesia', flag: '🇫🇲' },
  { code: 'yap', name: 'Yapese', country: 'Micronesia', flag: '🇫🇲' },
  { code: 'rar', name: 'Māori Kūki Airani', country: 'Cook Islands', flag: '🇨🇰' },
  { code: 'crs', name: 'Seselwa', country: 'Seychelles', flag: '🇸🇨' },
  { code: 'mfe', name: 'Morisyen', country: 'Mauritius', flag: '🇲🇺' },
  { code: 'et', name: 'Eesti keel', country: 'Estonia', flag: '🇪🇪' },
  { code: 'lv', name: 'Latviešu valoda', country: 'Latvia', flag: '🇱🇻' },
  { code: 'lt', name: 'Lietuvių kalba', country: 'Lithuania', flag: '🇱🇹' },
  { code: 'sl', name: 'Slovenščina', country: 'Slovenia', flag: '🇸🇮' },
  { code: 'sk', name: 'Slovenčina', country: 'Slovakia', flag: '🇸🇰' },
  { code: 'bg', name: 'Български', country: 'Bulgaria', flag: '🇧🇬' },
  { code: 'hr', name: 'Hrvatski', country: 'Croatia', flag: '🇭🇷' },
  { code: 'sr', name: 'Српски', country: 'Serbia', flag: '🇷🇸' },
  { code: 'sq', name: 'Shqip', country: 'Albania', flag: '🇦🇱' },
  { code: 'mk', name: 'Македонски', country: 'North Macedonia', flag: '🇲🇰' },
  { code: 'bs', name: 'Bosanski', country: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'cnr', name: 'Crnogorski', country: 'Montenegro', flag: '🇲🇪' },
  { code: 'crh', name: 'Qırımtatarca', country: 'Crimea', flag: '🏴' },
  { code: 'la', name: 'Latina', country: 'Vatican City', flag: '🇻🇦' },

  // Middle East & Africa
  { code: 'ar', name: 'العربية', country: 'Arab World', flag: '☪️' },
  { code: 'ar-SA', name: 'العربية (السعودية)', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'ar-EG', name: 'العربية (مصر)', country: 'Egypt', flag: '🇪🇬' },
  { code: 'ar-AE', name: 'العربية (الإمارات)', country: 'UAE', flag: '🇦🇪' },
  { code: 'ar-KW', name: 'العربية (الكويت)', country: 'Kuwait', flag: '🇰🇼' },
  { code: 'ar-QA', name: 'العربية (قطر)', country: 'Qatar', flag: '🇶🇦' },
  { code: 'ar-OM', name: 'العربية (عمان)', country: 'Oman', flag: '🇴🇲' },
  { code: 'ar-BH', name: 'العربية (البحرين)', country: 'Bahrain', flag: '🇧🇭' },
  { code: 'ar-JO', name: 'العربية (الأردن)', country: 'Jordan', flag: '🇯🇴' },
  { code: 'ar-LB', name: 'العربية (لبنان)', country: 'Lebanon', flag: '🇱🇧' },
  { code: 'ar-SY', name: 'العربية (سوريا)', country: 'Syria', flag: '🇸🇾' },
  { code: 'ar-IQ', name: 'العربية (العراق)', country: 'Iraq', flag: '🇮🇶' },
  { code: 'ar-PS', name: 'العربية (فلسطين)', country: 'Palestine', flag: '🇵🇸' },
  { code: 'ar-YE', name: 'العربية (اليمن)', country: 'Yemen', flag: '🇾🇪' },
  { code: 'ar-MA', name: 'العربية (المغرب)', country: 'Morocco', flag: '🇲🇦' },
  { code: 'ar-DZ', name: 'العربية (الجزائر)', country: 'Algeria', flag: '🇩🇿' },
  { code: 'ar-TN', name: 'العربية (تونس)', country: 'Tunisia', flag: '🇹🇳' },
  { code: 'ar-LY', name: 'العربية (ليبيا)', country: 'Libya', flag: '🇱🇾' },
  { code: 'ar-SD', name: 'العربية (السودان)', country: 'Sudan', flag: '🇸🇩' },
  { code: 'fa', name: 'فارسی', country: 'Iran', flag: '🇮🇷' },
  { code: 'fa-AF', name: 'دری (Dari)', country: 'Afghanistan', flag: '🇦🇫' },
  { code: 'he', name: 'עברית', country: 'Israel', flag: '🇮🇱' },
  { code: 'ps', name: 'پښتو', country: 'Afghanistan', flag: '🇦🇫' },
  { code: 'ku', name: 'Kurdî', country: 'Kurdistan', flag: '☀️' },
  { code: 'az', name: 'Azərbaycanca', country: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'sw', name: 'Kiswahili', country: 'Africa', flag: '🇰🇪' },
  { code: 'am', name: 'አማርኛ', country: 'Ethiopia', flag: '🇪🇹' },
  { code: 'aa', name: 'Qafar Af', country: 'Djibouti / Eritrea', flag: '🇩🇯' },
  { code: 'ak', name: 'Akan', country: 'Ghana', flag: '🇬🇭' },
  { code: 'bm', name: 'Bamanankan', country: 'Mali', flag: '🇲🇱' },
  { code: 'bem', name: 'IciBemba', country: 'Zambia', flag: '🇿🇲' },
  { code: 'bci', name: 'Baoulé', country: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'din', name: 'Thuɔŋjäŋ', country: 'South Sudan', flag: '🇸🇸' },
  { code: 'dyu', name: 'Julakan', country: "Côte d'Ivoire / Burkina Faso", flag: '🇨🇮' },
  { code: 'ee', name: 'Eʋegbe', country: 'Togo / Ghana', flag: '🇹🇬' },
  { code: 'fan', name: 'Fang', country: 'Gabon / Equatorial Guinea', flag: '🇬🇦' },
  { code: 'ff', name: 'Fulfulde', country: 'West Africa', flag: '🌍' },
  { code: 'fon', name: 'Fɔ̀ngbè', country: 'Benin', flag: '🇧🇯' },
  { code: 'ha', name: 'Hausa', country: 'Nigeria / Niger', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', country: 'Nigeria', flag: '🇳🇬' },
  { code: 'kea', name: 'Kabuverdianu', country: 'Cape Verde', flag: '🇨🇻' },
  { code: 'ki', name: 'Gĩkũyũ', country: 'Kenya', flag: '🇰🇪' },
  { code: 'kj', name: 'Oshikwanyama', country: 'Namibia / Angola', flag: '🇳🇦' },
  { code: 'kpe', name: 'Kpɛlɛɛ', country: 'Liberia', flag: '🇱🇷' },
  { code: 'kri', name: 'Krio', country: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'lg', name: 'Luganda', country: 'Uganda', flag: '🇺🇬' },
  { code: 'ln', name: 'Lingála', country: 'DR Congo / Congo', flag: '🇨🇩' },
  { code: 'lua', name: 'Tshiluba', country: 'DR Congo', flag: '🇨🇩' },
  { code: 'mg', name: 'Malagasy', country: 'Madagascar', flag: '🇲🇬' },
  { code: 'mos', name: 'Mooré', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'nd', name: 'isiNdebele', country: 'Zimbabwe', flag: '🇿🇼' },
  { code: 'nr', name: 'isiNdebele', country: 'South Africa', flag: '🇿🇦' },
  { code: 'nso', name: 'Sesotho sa Leboa', country: 'South Africa', flag: '🇿🇦' },
  { code: 'ny', name: 'Chichewa', country: 'Malawi', flag: '🇲🇼' },
  { code: 'om', name: 'Afaan Oromoo', country: 'Ethiopia', flag: '🇪🇹' },
  { code: 'rw', name: 'Ikinyarwanda', country: 'Rwanda', flag: '🇷🇼' },
  { code: 'rn', name: 'Ikirundi', country: 'Burundi', flag: '🇧🇮' },
  { code: 'sg', name: 'Sängö', country: 'Central African Republic', flag: '🇨🇫' },
  { code: 'sn', name: 'ChiShona', country: 'Zimbabwe', flag: '🇿🇼' },
  { code: 'so', name: 'Soomaali', country: 'Somalia', flag: '🇸🇴' },
  { code: 'ss', name: 'siSwati', country: 'Eswatini', flag: '🇸🇿' },
  { code: 'st', name: 'Sesotho', country: 'Lesotho', flag: '🇱🇸' },
  { code: 'suk', name: 'Kisukuma', country: 'Tanzania', flag: '🇹🇿' },
  { code: 'sus', name: 'Sosoxui', country: 'Guinea', flag: '🇬🇳' },
  { code: 'swb', name: 'Shikomori', country: 'Comoros / Mayotte', flag: '🇰🇲' },
  { code: 'tem', name: 'Themne', country: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'ti', name: 'ትግርኛ', country: 'Eritrea / Ethiopia', flag: '🇪🇷' },
  { code: 'tig', name: 'Tigre', country: 'Eritrea', flag: '🇪🇷' },
  { code: 'tn', name: 'Setswana', country: 'Botswana', flag: '🇧🇼' },
  { code: 'ts', name: 'XiTsonga', country: 'South Africa / Mozambique', flag: '🇿🇦' },
  { code: 'tw', name: 'Twi', country: 'Ghana', flag: '🇬🇭' },
  { code: 'umb', name: 'Umbundu', country: 'Angola', flag: '🇦🇴' },
  { code: 've', name: 'Tshivenḓa', country: 'South Africa', flag: '🇿🇦' },
  { code: 'vmw', name: 'Emakhuwa', country: 'Mozambique', flag: '🇲🇿' },
  { code: 'wo', name: 'Wolof', country: 'Senegal / Gambia', flag: '🇸🇳' },
  { code: 'yo', name: 'Yorùbá', country: 'Nigeria / Benin', flag: '🇳🇬' },

  // Central Asia
  { code: 'kk', name: 'Қазақ тілі', country: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'uz', name: 'Oʻzbek', country: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'ky', name: 'Кыргызча', country: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'tg', name: 'Тоҷикӣ', country: 'Tajikistan', flag: '🇹🇯' },
  { code: 'tk', name: 'Türkmençe', country: 'Turkmenistan', flag: '🇹🇲' },

  // India (Consolidated Group for screen transition)
  { code: 'hi', name: 'हिन्दी (Hindi)', country: 'India', flag: '🇮🇳' },
  { code: 'as', name: 'অসমীয়া (Assamese)', country: 'India', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', country: 'India', flag: '🇮🇳' },
  { code: 'brx', name: 'बड़ो (Bodo)', country: 'India', flag: '🇮🇳' },
  { code: 'doi', name: 'डोगरी (Dogri)', country: 'India', flag: '🇮🇳' },
  { code: 'kok', name: 'कोंकणी (Konkani)', country: 'India', flag: '🇮🇳' },
  { code: 'ks', name: 'کٲشُر (Kashmiri)', country: 'India', flag: '🇮🇳' },
  { code: 'mai', name: 'मैथिली (Maithili)', country: 'India', flag: '🇮🇳' },
  { code: 'mni', name: 'মৈতৈলোন্ (Manipuri)', country: 'India', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', country: 'India', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', country: 'India', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी (Marathi)', country: 'India', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', country: 'India', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', country: 'India', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', country: 'India', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)', country: 'India', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', country: 'India', flag: '🇮🇳' },
  { code: 'sa', name: 'संस्कृतम् (Sanskrit)', country: 'India', flag: '🇮🇳' },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)', country: 'India', flag: '🇮🇳' },
  { code: 'sd', name: 'سنڌي (Sindhi)', country: 'India', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو (Urdu)', country: 'India', flag: '🇮🇳' },
  { code: 'si', name: 'සිංහල (Sinhala)', country: 'Sri Lanka', flag: '🇱🇰' },

  // South Africa
  { code: 'af', name: 'Afrikaans', country: 'South Africa', flag: '🇿🇦' },
  { code: 'zu', name: 'isiZulu', country: 'South Africa', flag: '🇿🇦' },
  { code: 'xh', name: 'isiXhosa', country: 'South Africa', flag: '🇿🇦' }
];

export const COUNTRY_LANGUAGES: Record<string, string[]> = {
  'jp': ['ja'],
  'us': ['en', 'es'],
  'ca': ['en', 'en-CA', 'fr'],
  'gb': ['en-GB', 'en', 'cy', 'gd'],
  'au': ['en-AU', 'en'],
  'nz': ['en-NZ', 'en', 'mi'],
  'ie': ['en-IE', 'en', 'ga'],
  'cn': ['zh-Hans'],
  'tw': ['zh-Hant-TW'],
  'hk': ['zh-Hant-HK', 'yue', 'en'],
  'mo': ['zh-Hant-MO', 'yue', 'pt-PT'],
  'kr': ['ko'],
  'kp': ['ko'],
  'mn': ['mn', 'en'],
  'fr': ['fr', 'br', 'oc', 'co'],
  'de': ['de', 'nds', 'hsb', 'dsb'],
  'it': ['it', 'sc', 'fur'],
  'es': ['es', 'ca', 'gl', 'eu'],
  'pt': ['pt-PT', 'pt-AO', 'pt-MZ', 'pt-CV', 'pt-GW', 'pt-ST'],
  'br': ['pt-BR'],
  'ao': ['pt-AO'],
  'mz': ['pt-MZ'],
  'cv': ['pt-CV'],
  'gw': ['pt-GW'],
  'st': ['pt-ST'],
  'gq': ['es-GQ'],
  'ru': ['ru'],
  'mx': ['es-MX'],
  'ar': ['es-AR'],
  'cl': ['es-CL'],
  'co': ['es-CO'],
  'pe': ['es-PE'],
  've': ['es-VE'],
  'ec': ['es-EC'],
  'bo': ['es-BO', 'qu', 'ay'],
  'py': ['es-PY', 'gn'],
  'uy': ['es-UY'],
  'pa': ['es-PA'],
  'cr': ['es-CR'],
  'ni': ['es-NI'],
  'hn': ['es-HN'],
  'sv': ['es-SV'],
  'gt': ['es-GT'],
  'do': ['es-DO'],
  'pr': ['es-PR'],
  'cu': ['es-CU'],
  'ht': ['fr', 'ht'],
  'sr': ['nl'],
  'gy': ['en'],
  'gf': ['fr'],
  'bq': ['nl', 'pap', 'en'],
  'aw': ['nl', 'pap', 'en'],
  'cw': ['nl', 'pap', 'en'],
  'sx': ['nl', 'en'],
  'at': ['de-AT', 'de'],
  'ch': ['de-CH', 'de', 'fr', 'it', 'rm'],
  'be': ['nl', 'fr', 'de', 'wa', 'vls'],
  'lu': ['lb', 'fr', 'de'],
  'li': ['de'],
  'nl': ['nl', 'fy', 'li'],
  'ad': ['ca'],
  'mc': ['fr', 'it'],
  'sm': ['it'],
  'va': ['it', 'la'],
  'mt': ['mt', 'en'],
  'mh': ['en', 'mh'],
  'pw': ['en', 'pau'],
  'nr': ['en', 'na'],
  'ki': ['en', 'gil'],
  'tv': ['en', 'tvl'],
  'to': ['en', 'to'],
  'ws': ['en', 'sm'],
  'fj': ['en', 'fj', 'hi'],
  'pg': ['en', 'tpi'],
  'vu': ['bi', 'en', 'fr'],
  'sb': ['en', 'pis'],
  'fm': ['en', 'chk', 'yap'],
  'nf': ['en'],
  'cx': ['en'],
  'cc': ['en'],
  'ck': ['en', 'rar'],
  'tk': ['tkl', 'en'],
  'nu': ['niu', 'en'],
  'pn': ['en'],
  'aq': ['en'],
  'sc': ['en', 'crs', 'fr'],
  'mu': ['en', 'mfe', 'fr'],
  'bb': ['en-BB', 'en'],
  'gd': ['en-GD', 'en'],
  'kn': ['en-KN', 'en'],
  'lc': ['en-LC', 'en'],
  'vc': ['en-VC', 'en'],
  'ag': ['en-AG', 'en'],
  'bs': ['en-BS', 'en'],
  'bz': ['en-BZ', 'en', 'es'],
  'id': ['id'],
  'ph': ['tl', 'en-PH', 'en'],
  'vn': ['vi'],
  'th': ['th'],
  'my': ['ms', 'en-MY', 'en'],
  'sg': ['en-SG', 'en', 'zh-Hans', 'ms', 'ta'],
  'kh': ['km'],
  'la': ['lo'],
  'mm': ['my'],
  'bn': ['ms'],
  'in': ['hi', 'en-IN', 'en', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur'],
  'za': ['en-ZA', 'en', 'af', 'zu', 'xh'],
  'pk': ['ur', 'en-PK', 'en'],
  'bd': ['bn', 'en-BD', 'en'],
  'lk': ['si', 'ta', 'en-LK', 'en'],
  'np': ['ne', 'en-NP', 'en'],
  'bt': ['dz'],
  'mv': ['dv', 'en-MV', 'en'],
  'af': ['ps', 'fa'],
  'tr': ['tr'],
  'ir': ['fa', 'az', 'ku'],
  'az': ['az'],
  'il': ['he', 'ar-SA', 'en'],
  'km': ['fr', 'ar'],
  'dj': ['fr', 'ar'],
  'er': ['ti', 'en'],
  'et': ['am', 'en'],
  'ke': ['en', 'sw'],
  'mg': ['fr'],
  'mw': ['en', 'ny'],
  'rw': ['en', 'fr', 'sw'],
  'so': ['so', 'ar', 'en'],
  'ss': ['en'],
  'tz': ['sw', 'en'],
  'ug': ['en', 'sw'],
  'zm': ['en', 'bem'],
  'kz': ['kk', 'ru'],
  'uz': ['uz', 'ru'],
  'kg': ['ky', 'ru'],
  'tj': ['tg', 'ru'],
  'tm': ['tk', 'ru'],
  'gr': ['el'],
  'cy': ['el', 'tr'],
  'ro': ['ro'],
  'bg': ['bg'],
  'hr': ['hr'],
  'ba': ['bs', 'hr', 'sr'],
  'rs': ['sr'],
  'me': ['sr', 'sq'],
  'mk': ['mk', 'sq'],
  'al': ['sq'],
  'pl': ['pl'],
  'cz': ['cs'],
  'sk': ['sk'],
  'hu': ['hu'],
  'si': ['sl'],
  'ee': ['et', 'ru'],
  'lv': ['lv', 'ru'],
  'lt': ['lt', 'ru'],
  'ua': ['uk', 'ru'],
  'by': ['be', 'ru'],
  'md': ['ro', 'ru'],
  'ge': ['ka'],
  'am': ['hy'],
  'is': ['is'],
  'dk': ['da'],
};

export const BIG_TO_SMALL_COUNTRIES = ['jp', 'cn', 'tw', 'hk', 'mo', 'kr', 'kp', 'vn', 'hu', 'mn'];

const JP_PREFECTURES: Record<string, { ja: string, en: string }> = {
  'JP-01': { ja: '北海道', en: 'Hokkaido' },
  'JP-02': { ja: '青森県', en: 'Aomori' },
  'JP-03': { ja: '岩手県', en: 'Iwate' },
  'JP-04': { ja: '宮城県', en: 'Miyagi' },
  'JP-05': { ja: '秋田県', en: 'Akita' },
  'JP-06': { ja: '山形県', en: 'Yamagata' },
  'JP-07': { ja: '福島県', en: 'Fukushima' },
  'JP-08': { ja: '茨城県', en: 'Ibaraki' },
  'JP-09': { ja: '栃木県', en: 'Tochigi' },
  'JP-10': { ja: '群馬県', en: 'Gunma' },
  'JP-11': { ja: '埼玉県', en: 'Saitama' },
  'JP-12': { ja: '千葉県', en: 'Chiba' },
  'JP-13': { ja: '東京都', en: 'Tokyo' },
  'JP-14': { ja: '神奈川県', en: 'Kanagawa' },
  'JP-15': { ja: '新潟県', en: 'Niigata' },
  'JP-16': { ja: '富山県', en: 'Toyama' },
  'JP-17': { ja: '石川県', en: 'Ishikawa' },
  'JP-18': { ja: '福井県', en: 'Fukui' },
  'JP-19': { ja: '山梨県', en: 'Yamanashi' },
  'JP-20': { ja: '長野県', en: 'Nagano' },
  'JP-21': { ja: '岐阜県', en: 'Gifu' },
  'JP-22': { ja: '静岡県', en: 'Shizuoka' },
  'JP-23': { ja: '愛知県', en: 'Aichi' },
  'JP-24': { ja: '三重県', en: 'Mie' },
  'JP-25': { ja: '滋賀県', en: 'Shiga' },
  'JP-26': { ja: '京都府', en: 'Kyoto' },
  'JP-27': { ja: '大阪府', en: 'Osaka' },
  'JP-28': { ja: '兵庫県', en: 'Hyogo' },
  'JP-29': { ja: '奈良県', en: 'Nara' },
  'JP-30': { ja: '和歌山県', en: 'Wakayama' },
  'JP-31': { ja: '鳥取県', en: 'Tottori' },
  'JP-32': { ja: '島根県', en: 'Shimane' },
  'JP-33': { ja: '岡山県', en: 'Okayama' },
  'JP-34': { ja: '広島県', en: 'Hiroshima' },
  'JP-35': { ja: '山口県', en: 'Yamaguchi' },
  'JP-36': { ja: '徳島県', en: 'Tokushima' },
  'JP-37': { ja: '香川県', en: 'Kagawa' },
  'JP-38': { ja: '愛媛県', en: 'Ehime' },
  'JP-39': { ja: '高知県', en: 'Kochi' },
  'JP-40': { ja: '福岡県', en: 'Fukuoka' },
  'JP-41': { ja: '佐賀県', en: 'Saga' },
  'JP-42': { ja: '長崎県', en: 'Nagasaki' },
  'JP-43': { ja: '熊本県', en: 'Kumamoto' },
  'JP-44': { ja: '大分県', en: 'Oita' },
  'JP-45': { ja: '宮崎県', en: 'Miyazaki' },
  'JP-46': { ja: '鹿児島県', en: 'Kagoshima' },
  'JP-47': { ja: '沖縄県', en: 'Okinawa' }
};

export function normalizeAddressText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u3000\s]+/g, " ") // Full-width space to half-width
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // Full-width alphanumeric to half-width
    .trim();
}

// --- Japanese Romaji Transliteration Helper ---

/**
 * Fast, heuristic transliteration for Japanese addresses to Romaji.
 * Used as an instant fallback while AI translation loads.
 */
export function fastJapaneseTransliterate(text: string): string {
  if (!text || !/[\u3040-\u30ff\u4e00-\u9faf]/.test(text)) return text;
  return transliterate(text, 'ja');
}
async function normalizeEnglishOutputPart(
  value: string,
  countryCode: string,
  options: { isHighPrecision?: boolean; preferOpenSourceAliases?: boolean },
) {
  const shouldPreferOpenSource = options.preferOpenSourceAliases ?? options.isHighPrecision ?? false;
  if (!shouldPreferOpenSource) return normalizeEnglishAddressPart(value, countryCode);

  const resolved = await resolveEnglishAddressPartOpenSource(value, countryCode, {
    fallback: normalizeEnglishAddressPart,
  });
  return resolved.value;
}

export async function formatAddress(details: any, lang: string = 'local', options: { shipping?: boolean, isHighPrecision?: boolean, forceDomestic?: boolean, preferOpenSourceAliases?: boolean } = {}): Promise<string> {
  if (!details) return "";

  const naturalAddress = formatNaturalAddress(details);
  if (naturalAddress) return naturalAddress;

  const c = details.country_code?.slice(0, 2).toUpperCase();
  const formatDef = await (c ? getAddressFormat(c) : Promise.resolve(null));

  // Determine which specification to use from JSON
  let currentSpec: any = null;
  let selectedSpecIsEnglish = false;

  if (formatDef) {
    const selected = selectAddressLanguageFormat(
      formatDef,
      options.forceDomestic && lang === 'en' ? 'en_domestic' : lang,
    );
    if (selected) {
      currentSpec = selected.spec;
      selectedSpecIsEnglish = selected.isEnglish;
    }
  }

  // Fallback if no JSON spec found (legacy logic)
  if (!currentSpec && !formatDef) {
    const isBigToSmall = BIG_TO_SMALL_COUNTRIES.includes(c?.toLowerCase() || "");


    if (isBigToSmall && lang !== 'en' && !options.forceDomestic === false) {
       // ... existing legacy big-to-small logic ...
    }
    // For brevity of this edit, I will focus on the JSON-based logic which is the priority
  }

  if (currentSpec) {
    let formatted = currentSpec.addressFormat;
    const isTargetEn = selectedSpecIsEnglish || lang === 'en' || lang === 'international' || lang === 'intl_en' || lang === 'carrier' || lang === 'en_domestic';

    // Map details to format keys
    const mapping: Record<string, string> = {};
    const keys = [
      'postcode', 'state', 'city', 'district', 'subdistrict', 'suburb',
      'street', 'road', 'houseNumber', 'organization', 'poi', 'country'
    ];

    for (const key of keys) {
      let val = "";
      if (key === 'postcode') val = details.postcode || "";
      else if (key === 'state') val = details.state || details.province || details.region || "";
      else if (key === 'city') val = details.city || details.town || details.village || "";
      else if (key === 'district') val = details.city_district || details.district || details.county || "";
      else if (key === 'subdistrict') val = details.subdistrict || details.suburb || details.neighbourhood || "";
      else if (key === 'suburb') val = details.suburb || details.hamlet || "";
      else if (key === 'street') val = details.road || details.street || "";
      else if (key === 'road') val = details.road || details.street || "";
      else if (key === 'houseNumber') val = details.house_number || details.building || "";
      else if (key === 'organization') val = details.building || details.organization || details.amenity || "";
      else if (key === 'poi') val = details.amenity || details.shop || details.tourism || "";
      else if (key === 'country') val = details.country || "";

      // Quality Romanization: If target is English, transliterate any non-latin values if they aren't translated
      if (isTargetEn && val && (/[^\u0000-\u007F]/.test(val) || c === 'IN' || c === 'ZA')) {
        const normalized = await normalizeEnglishOutputPart(val, c || '', options);
        val = normalized || transliterate(val, (c || 'en').toLowerCase());
      }
      mapping[key] = val;
    }

      // [CRITICAL] Information Integrity: Special refinement for Japan Address Components
      if (c === 'JP') {
        const block = details.city_block || details.block_number;
        const chome = details.jp_chome || details.subdistrict || details.quarter;

        if (chome && !mapping.subdistrict.includes(chome)) {
          mapping.subdistrict = mapping.subdistrict ? `${chome} ${mapping.subdistrict}` : chome;
        }
        if (block && !mapping.street.includes(block)) {
          mapping.street = mapping.street ? `${mapping.street} ${block}` : block;
        }

        // Refine prefecture name based on target language
        if (details['ISO3166-2-lvl4'] && JP_PREFECTURES[details['ISO3166-2-lvl4']]) {
          mapping.state = isTargetEn
            ? JP_PREFECTURES[details['ISO3166-2-lvl4']].en
            : JP_PREFECTURES[details['ISO3166-2-lvl4']].ja;
        }

        // Special rule for Japan: Domestic format should NOT include country name
        if (!isTargetEn) {
          mapping.country = "";
        }
      }

      // Replace placeholders
      Object.entries(mapping).forEach(([key, value]) => {
        formatted = formatted.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      // Handle the "Domestic vs International" country rule globally
      // If native language is selected and it's not 'en', usually country name is omitted in domestic rules.
      // But we respect the JSON format string. If it has {{country}}, it stays unless we manually cleared it above.
      // User says: "Domestic don't need country notation. Only International needs it."
      const countryLangs = COUNTRY_LANGUAGES[c?.toLowerCase() || ""] || [];
      const isActuallyNative = countryLangs.includes(lang) && lang !== 'en';
      if (isActuallyNative) {
        formatted = formatted.replace(/{{country}}/g, "");
      }

      // Cleanup
      let result = formatted
        .split('\n')
        .map(line => line.replace(/,\s*,/g, ',').replace(/^\s*,|,?\s*$/g, '').trim())
        .filter(line => line.length > 0 && line !== ',')
        .join('\n')
        .replace(/[ \t]+/g, ' ');

      if (isTargetEn) {
        // Final Latin-only cleanup for strict English output
        result = result
          .split('\n')
          .map(line => line.replace(/[\u0590-\u05FF\u0600-\u06FF\u0E00-\u0E7F]/g, '').trim())
          .map(line => line.replace(/,\s*,/g, ',').replace(/^,|,$/g, '').replace(/[ \t]+/g, ' ').trim())
          .filter(Boolean)
          .join('\n')
          .trim();
      }

      if (options.shipping && isTargetEn) {
        result = applyShippingAbbreviations(result);
      }
      return result;
    }

  // Final fallback (existing logic slightly simplified)
  const isBigToSmall = BIG_TO_SMALL_COUNTRIES.includes(c?.toLowerCase() || "");
  const parts = {
    poi: details.amenity || details.shop || "",
    country: details.country || "",
    postcode: details.postcode || "",
    state: details.state || details.province || "",
    city: details.city || details.town || "",
    suburb: details.suburb || details.neighbourhood || "",
    road: details.road || details.street || "",
    house: details.house_number || ""
  };

  const isTargetEn = lang === 'en' || lang === 'international';
  if (isTargetEn) {
     for (const k of Object.keys(parts)) {
       const key = k as keyof typeof parts;
       if (parts[key] && /[^\u0000-\u007F]/.test(parts[key])) {
         const normalized = await normalizeEnglishOutputPart(parts[key], c || '', options);
         parts[key] = normalized || transliterate(parts[key], (c || 'en').toLowerCase());
       }
     }
  }

  if (isTargetEn && lang === 'international') {
    const streetLine = parts.house && parts.road ? `${parts.house} ${parts.road}` : (parts.house || parts.road);
    const cityLine = [parts.suburb, parts.city].filter(Boolean).join(', ');
    const regionLine = [parts.state, parts.postcode].filter(Boolean).join(' ');
    const countryLine = parts.country ? parts.country.toUpperCase() : '';

    return [parts.poi, streetLine, cityLine, regionLine, countryLine]
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n')
      .replace(/,\s*,/g, ',')
      .replace(/^,|,$/g, '')
      .trim();
  }

  if (isBigToSmall && !isTargetEn) {
    const ordered = [parts.postcode, parts.state, parts.city, parts.suburb, parts.road, parts.house, parts.poi].filter(Boolean);
    const separator = (lang === 'ja' || lang === 'zh-Hans' || lang === 'ko') ? "" : " ";
    return ordered.join(separator);
  } else {
    const ordered = [parts.poi, parts.house && parts.road ? `${parts.house} ${parts.road}` : (parts.house || parts.road), parts.suburb, parts.city, parts.state, parts.postcode, parts.country].filter(Boolean);
    return ordered.join(", ");
  }
}

// --- Translation Engine (Open Source) ---
async function performTranslation(text: string, target: string): Promise<string | null> {
  const normalizedText = text.trim();
  if (!normalizedText) return null;

  // Cache check
  const cacheKey = `${normalizedText}_${target}`;
  if (translationCache[cacheKey]) return translationCache[cacheKey];

  const { translateWithOpenSource } = await import('./openSourceTranslation');
  const translated = await translateWithOpenSource({
    text: normalizedText,
    target,
    timeoutMs: 3000,
  });

  if (translated?.translatedText) {
    translationCache[cacheKey] = translated.translatedText;
    return translated.translatedText;
  }

  return null;
}

/**
 * Open Source high-precision address translation & transliteration
 */
export async function translateAddressOpenSource(text: string, target: string, details?: any, isHighPrecision?: boolean): Promise<string> {
  // If we have structured details, try to format them first
  if (details && !isHighPrecision) {
    return await formatAddress(details, target, { isHighPrecision: false });
  }

  const sourceText = text.trim();
  if (!sourceText) return "";

  // 1. Basic Transliteration (Local Logic)
  let processedText = sourceText;
  if (target === 'en' || target === 'international') {
    // Try local transliteration first for common scripts
    processedText = transliterate(sourceText, 'ja'); // Try Japan specifically if it looks like it
    if (processedText === sourceText) {
       // If no change, try a general run through translation if needed
    }
  }

  // 2. Open Source Translation API (Heuristic Fallback)
  try {
    if (sourceText.startsWith('{') && sourceText.endsWith('}')) {
      const parsed = JSON.parse(sourceText);
      return await formatAddress(parsed, target, { isHighPrecision: false });
    }
  } catch (e) {}

  if (target !== 'local') {
    const hasNonLatin = /[^\u0000-\u007F]/.test(processedText);
    const isTargetNonLatin = ['ja', 'ko', 'zh-Hans', 'zh-Hant', 'ru'].includes(target);

    if (hasNonLatin || isTargetNonLatin) {
      const translated = await performTranslation(processedText, target);
      if (translated) processedText = translated;
    }
  }

  if (target === 'en') {
    // Final Latin-only cleanup for English
    processedText = processedText.replace(/[^\u0000-\u017F\s,.-]/g, '').trim();
    processedText = processedText.replace(/\s+/g, ' ').trim();
  }

  return processedText;
}
