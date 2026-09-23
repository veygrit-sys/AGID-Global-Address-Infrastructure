import type { RegistrationAssistanceCandidate, RegistrationFormRecord } from './addressRegistrationAutomation';

export const ADDRESS_DOCUMENT_READING_VERSION = 'address-document-reading-v1';

export type AddressDocumentKind = 'image' | 'pdf' | 'text' | 'unknown';
export type AddressDocumentExtractionStatus = 'ready' | 'needs-review' | 'needs-ocr-engine' | 'empty';
export type AddressDocumentFieldKey =
  | 'recipient'
  | 'organization'
  | 'street'
  | 'city'
  | 'state'
  | 'postcode'
  | 'country'
  | 'phone'
  | 'room'
  | 'floor';

export type AddressDocumentCandidate = {
  field: AddressDocumentFieldKey;
  value: string;
  confidence: number;
  evidence: string;
  source: 'text-layer' | 'file-name' | 'layout-heuristic';
};

export type AddressDocumentReadInput = {
  fileName?: string;
  mimeType?: string;
  text?: string;
  countryHint?: string;
  supportedCountryCodes?: readonly string[];
};

export type AddressDocumentReadResult = {
  version: typeof ADDRESS_DOCUMENT_READING_VERSION;
  status: AddressDocumentExtractionStatus;
  kind: AddressDocumentKind;
  confidence: number;
  extractedText: string;
  patch: Partial<Record<AddressDocumentFieldKey, string>>;
  candidates: AddressDocumentCandidate[];
  warnings: string[];
  sources: string[];
  privacyBoundary: 'device-local-no-upload';
};

const ADDRESS_LABEL_RE = /^(ship\s*to|deliver\s*to|recipient|receiver|consignee|to|name|お届け先|届け先|宛名|受取人|氏名|配送先|住所)[:：]?\s*/i;
const ORGANIZATION_RE = /\b(inc\.?|ltd\.?|llc|gmbh|sarl|s\.a\.|corp\.?|corporation|company|co\.|plc)\b|株式会社|有限会社|合同会社|会社|法人|団体/i;
const PHONE_RE = /(?:tel|phone|mobile|電話|携帯|連絡先)?[:：\s]*(\+?\d[\d\s().-]{6,}\d)/i;
const JP_POSTCODE_RE = /(?:〒\s*)?(\d{3}-?\d{4})/;
const US_POSTCODE_RE = /\b(\d{5}(?:-\d{4})?)\b/;
const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;
const GENERIC_POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}|[A-Z0-9][A-Z0-9 -]{2,10}[A-Z0-9])\b/i;
const STREET_TOKEN_RE = /\b(street|st\.?|road|rd\.?|avenue|ave\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?|way|place|pl\.?|square|sq\.?|route|rue|strasse|straße|via|calle|jalan)\b/i;
const JP_STREET_TOKEN_RE = /(都|道|府|県|市|区|町|村|丁目|番地|番|号|郡|字|大字)/;

function clean(value: unknown) {
  return String(value ?? '').replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanLine(value: string) {
  return clean(value).replace(/^[•*\-–—\s]+/, '').replace(/[;,]+$/, '').trim();
}

function addCandidate(
  candidates: AddressDocumentCandidate[],
  seen: Set<string>,
  candidate: AddressDocumentCandidate,
) {
  const key = `${candidate.field}:${candidate.value.toLowerCase()}`;
  if (!candidate.value || seen.has(key)) return;
  seen.add(key);
  candidates.push(candidate);
}

function splitLines(text: string) {
  return text
    .replace(/\r/g, '\n')
    .split('\n')
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 80);
}

function normalizeCountryCode(value?: string) {
  const code = clean(value).toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : '';
}

function isSupportedCountry(code: string, supportedCountryCodes?: readonly string[]) {
  if (!code) return false;
  if (!supportedCountryCodes?.length) return true;
  return supportedCountryCodes.map(countryCode => normalizeCountryCode(countryCode)).includes(code);
}

export function inferAddressDocumentKind(fileName = '', mimeType = ''): AddressDocumentKind {
  const name = fileName.toLowerCase();
  const type = mimeType.toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/.test(name)) return 'image';
  if (type.startsWith('text/') || /\.(txt|csv|json|md|text)$/.test(name)) return 'text';
  return 'unknown';
}

export function extractPrintableTextFromBinary(buffer: ArrayBuffer, limit = 12000) {
  const bytes = new Uint8Array(buffer);
  const fragments: string[] = [];
  let run = '';

  const flush = () => {
    const value = cleanLine(run);
    if (value.length >= 4) fragments.push(value);
    run = '';
  };

  for (let index = 0; index < bytes.length && fragments.join('\n').length < limit; index += 1) {
    const byte = bytes[index];
    const printable = byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126);
    if (printable) {
      run += byte === 10 || byte === 13 ? '\n' : String.fromCharCode(byte);
    } else {
      flush();
    }
  }
  flush();

  return fragments.join('\n').slice(0, limit);
}

function findPostcode(lines: readonly string[], countryHint: string) {
  const regexes = [
    countryHint === 'JP' ? JP_POSTCODE_RE : null,
    countryHint === 'US' ? US_POSTCODE_RE : null,
    JP_POSTCODE_RE,
    US_POSTCODE_RE,
    UK_POSTCODE_RE,
    GENERIC_POSTCODE_RE,
  ].filter(Boolean) as RegExp[];

  for (const line of lines) {
    for (const regex of regexes) {
      if (regex === GENERIC_POSTCODE_RE && lineLooksLikeStreet(line)) continue;
      const match = line.match(regex);
      const value = clean(match?.[1]);
      if (value && /[0-9]/.test(value)) return value.toUpperCase();
    }
  }
  return '';
}

function lineLooksLikeStreet(line: string) {
  if (JP_STREET_TOKEN_RE.test(line) && /\d|丁目|番地|番|号/.test(line)) return true;
  if (STREET_TOKEN_RE.test(line) && /\d/.test(line)) return true;
  if (/^\d+[A-Z]?\s+[\p{L}\p{M}0-9 .'-]+$/u.test(line) && line.length >= 8) return true;
  return false;
}

function parseCityStateFromLines(lines: readonly string[], postcode: string) {
  const postcodeLineIndex = postcode
    ? lines.findIndex(line => line.toUpperCase().includes(postcode.toUpperCase()))
    : -1;
  const nearby = postcodeLineIndex >= 0 ? lines[postcodeLineIndex] : lines.find(line => line.includes(','));
  if (!nearby) return {};

  const withoutPostcode = cleanLine(nearby.replace(postcode, '').replace(JP_POSTCODE_RE, '').replace(US_POSTCODE_RE, ''));
  if (!withoutPostcode) return {};
  if (JP_STREET_TOKEN_RE.test(withoutPostcode)) return {};

  const parts = withoutPostcode.split(',').map(cleanLine).filter(Boolean);
  if (parts.length >= 2) {
    return {
      city: parts[0],
      state: parts[1].replace(/\b[A-Z]{2}\b\s*$/i, '').trim() || parts[1],
    };
  }

  const tokens = withoutPostcode.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2 && tokens.length <= 5) {
    return { city: tokens.slice(0, -1).join(' '), state: tokens.at(-1) };
  }
  return {};
}

function fieldPatch(candidates: readonly AddressDocumentCandidate[]) {
  const patch: Partial<Record<AddressDocumentFieldKey, string>> = {};
  for (const candidate of [...candidates].sort((a, b) => b.confidence - a.confidence)) {
    if (!patch[candidate.field]) patch[candidate.field] = candidate.value;
  }
  return patch;
}

function statusFor(kind: AddressDocumentKind, extractedText: string, patch: Partial<Record<AddressDocumentFieldKey, string>>) {
  if (!extractedText) return kind === 'image' || kind === 'pdf' ? 'needs-ocr-engine' : 'empty';
  if (patch.street || (patch.postcode && (patch.city || patch.state))) return 'ready';
  return Object.keys(patch).length ? 'needs-review' : 'empty';
}

function confidenceFor(candidates: readonly AddressDocumentCandidate[], patch: Partial<Record<AddressDocumentFieldKey, string>>) {
  let score = 0.18;
  if (patch.street) score += 0.34;
  if (patch.postcode) score += 0.2;
  if (patch.city || patch.state) score += 0.12;
  if (patch.recipient) score += 0.08;
  if (patch.phone) score += 0.04;
  score += Math.min(0.12, candidates.length * 0.02);
  return Math.min(0.96, Number(score.toFixed(2)));
}

export function readAddressDocument(input: AddressDocumentReadInput): AddressDocumentReadResult {
  const kind = inferAddressDocumentKind(input.fileName, input.mimeType);
  const countryHint = normalizeCountryCode(input.countryHint);
  const warnings: string[] = [];
  const extractedText = clean(input.text).slice(0, 12000);
  const lines = splitLines(input.text || '');
  const candidates: AddressDocumentCandidate[] = [];
  const seen = new Set<string>();

  if (countryHint && isSupportedCountry(countryHint, input.supportedCountryCodes)) {
    addCandidate(candidates, seen, {
      field: 'country',
      value: countryHint,
      confidence: 0.92,
      evidence: 'Selected registration country is used as a bounded country hint.',
      source: 'layout-heuristic',
    });
  }

  const postcode = findPostcode(lines, countryHint);
  if (postcode) {
    addCandidate(candidates, seen, {
      field: 'postcode',
      value: postcode,
      confidence: 0.9,
      evidence: `Detected postal code token "${postcode}".`,
      source: 'text-layer',
    });
  }

  lines.forEach((line, index) => {
    const phone = line.match(PHONE_RE)?.[1];
    if (phone) {
      addCandidate(candidates, seen, {
        field: 'phone',
        value: clean(phone),
        confidence: 0.78,
        evidence: `Detected phone-like token on line ${index + 1}.`,
        source: 'text-layer',
      });
    }

    if (ORGANIZATION_RE.test(line)) {
      addCandidate(candidates, seen, {
        field: 'organization',
        value: line.replace(ADDRESS_LABEL_RE, ''),
        confidence: 0.72,
        evidence: `Detected organization marker on line ${index + 1}.`,
        source: 'layout-heuristic',
      });
    }

    if (lineLooksLikeStreet(line)) {
      addCandidate(candidates, seen, {
        field: 'street',
        value: line.replace(ADDRESS_LABEL_RE, ''),
        confidence: 0.84,
        evidence: `Detected street/address pattern on line ${index + 1}.`,
        source: 'layout-heuristic',
      });
    }

    if (ADDRESS_LABEL_RE.test(line) && lines[index + 1] && !lineLooksLikeStreet(lines[index + 1])) {
      addCandidate(candidates, seen, {
        field: 'recipient',
        value: lines[index + 1],
        confidence: 0.64,
        evidence: `Detected recipient label before line ${index + 2}.`,
        source: 'layout-heuristic',
      });
    }
  });

  const unlabeledRecipient = lines.find((line, index) => {
    if (index > 4) return false;
    if (ADDRESS_LABEL_RE.test(line) || ORGANIZATION_RE.test(line) || lineLooksLikeStreet(line)) return false;
    if (line.match(PHONE_RE) || line.includes(postcode)) return false;
    return line.length >= 3 && line.length <= 48;
  });
  if (unlabeledRecipient) {
    addCandidate(candidates, seen, {
      field: 'recipient',
      value: unlabeledRecipient.replace(ADDRESS_LABEL_RE, ''),
      confidence: 0.52,
      evidence: 'Early non-address line is treated as a recipient candidate.',
      source: 'layout-heuristic',
    });
  }

  const cityState = parseCityStateFromLines(lines, postcode);
  if (cityState.city) {
    addCandidate(candidates, seen, {
      field: 'city',
      value: cityState.city,
      confidence: 0.58,
      evidence: 'Parsed city from a postal-code or comma-separated locality line.',
      source: 'layout-heuristic',
    });
  }
  if (cityState.state) {
    addCandidate(candidates, seen, {
      field: 'state',
      value: cityState.state,
      confidence: 0.52,
      evidence: 'Parsed state/region from a postal-code or comma-separated locality line.',
      source: 'layout-heuristic',
    });
  }

  if (!extractedText && kind === 'image') warnings.push('image-ocr-worker-not-configured');
  if (!extractedText && kind === 'pdf') warnings.push('pdf-text-layer-or-ocr-required');
  if (extractedText && kind === 'pdf' && !candidates.length) warnings.push('pdf-text-layer-found-but-no-address-pattern');

  const patch = fieldPatch(candidates);
  const status = statusFor(kind, extractedText, patch);
  const confidence = confidenceFor(candidates, patch);

  return {
    version: ADDRESS_DOCUMENT_READING_VERSION,
    status,
    kind,
    confidence: status === 'needs-ocr-engine' || status === 'empty' ? 0 : confidence,
    extractedText,
    patch,
    candidates,
    warnings,
    sources: Array.from(new Set(candidates.map(candidate => candidate.source))),
    privacyBoundary: 'device-local-no-upload',
  };
}

export function addressDocumentResultToAssistanceCandidate<T extends RegistrationFormRecord>(
  result: AddressDocumentReadResult,
): RegistrationAssistanceCandidate<T> | null {
  if (!Object.keys(result.patch).length) return null;
  const evidence = result.candidates
    .slice(0, 5)
    .map(candidate => `${candidate.field}: ${candidate.evidence}`);

  return {
    id: `document-ai:${result.kind}:${result.confidence}:${result.candidates.length}`,
    source: 'document-ai',
    label: 'Local document address reading',
    confidence: result.confidence,
    patch: result.patch,
    evidence,
    requiresUserReview: true,
  };
}
