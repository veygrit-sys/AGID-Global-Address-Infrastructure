export const NO_RAW_ADDRESS_RELEASE_SCAN_VERSION = 'no-raw-address-release-scan-v1';

export type NoRawAddressFindingSeverity = 'warning' | 'error';

export type NoRawAddressFinding = {
  severity: NoRawAddressFindingSeverity;
  code: string;
  line: number;
  excerpt: string;
};

export type NoRawAddressScanResult = {
  valid: boolean;
  version: typeof NO_RAW_ADDRESS_RELEASE_SCAN_VERSION;
  findings: NoRawAddressFinding[];
};

const PRIVATE_FIELD_KEY_RE = /["']?(rawAddress|addressText|inputAddress|addressLine|addressLines|streetAddress|buildingName|deliveryInstructions|recipientName|phoneNumber|unitNumber|roomNumber|floorNumber|accessCode|proofCode|privateProofSalt|credentialSecret|ownerPrivateKey|rawAgid|rawAoid|rawWaybillId|agidSCiphertext|agidSPlaintext|decryptedAgid|qrPayload|nfcPayload|rawPayload|privateKey|secret|witness)["']?\s*[:=]\s*["']([^"']{3,})["']/i;
const PRECISE_COORDINATE_PAIR_RE = /["']?(lat|latitude)["']?\s*[:=]\s*(-?\d{1,2}\.\d{5,})[\s\S]{0,80}["']?(lng|lon|longitude)["']?\s*[:=]\s*(-?\d{1,3}\.\d{5,})/i;
const PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?){2,4}\d{3,4}/;
const AGIDS_PAYLOAD_RE = /\bAGIDS1-[A-Z2-7]{24,}\b/;
const NFC_WRAPPED_PAYLOAD_RE = /\bagid:nfc:%7B/i;
const JAPAN_POSTAL_WITH_ADDRESS_RE = /\b\d{3}-\d{4}\b.{0,40}(丁目|番地|号室|マンション|アパート|ビル)/;

const SAFE_VALUE_RE = /^(redacted|example|synthetic|dummy|test|sample|placeholder|<[^>]+>|REDACTED|XXXX|AGID-XXXX)/i;

function lineNumberAt(text: string, index: number) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function excerptAt(text: string, index: number) {
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + 120);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function pushFinding(
  findings: NoRawAddressFinding[],
  text: string,
  index: number,
  code: string,
  severity: NoRawAddressFindingSeverity = 'error',
) {
  findings.push({
    severity,
    code,
    line: lineNumberAt(text, index),
    excerpt: excerptAt(text, index),
  });
}

export function scanNoRawAddressReleaseText(text: string): NoRawAddressScanResult {
  const findings: NoRawAddressFinding[] = [];

  for (const match of text.matchAll(new RegExp(PRIVATE_FIELD_KEY_RE, 'gi'))) {
    const value = match[2]?.trim() ?? '';
    if (!SAFE_VALUE_RE.test(value)) {
      pushFinding(findings, text, match.index ?? 0, `private-field-value:${match[1]}`);
    }
  }

  for (const match of text.matchAll(new RegExp(PRECISE_COORDINATE_PAIR_RE, 'gi'))) {
    pushFinding(findings, text, match.index ?? 0, 'precise-coordinate-pair');
  }

  for (const match of text.matchAll(new RegExp(AGIDS_PAYLOAD_RE, 'g'))) {
    pushFinding(findings, text, match.index ?? 0, 'agid-s-ciphertext-public-sample');
  }

  for (const match of text.matchAll(new RegExp(NFC_WRAPPED_PAYLOAD_RE, 'gi'))) {
    pushFinding(findings, text, match.index ?? 0, 'nfc-wrapped-payload-public-sample');
  }

  for (const match of text.matchAll(new RegExp(JAPAN_POSTAL_WITH_ADDRESS_RE, 'g'))) {
    pushFinding(findings, text, match.index ?? 0, 'postal-code-with-detailed-address');
  }

  for (const match of text.matchAll(new RegExp(PHONE_RE, 'g'))) {
    const excerpt = excerptAt(text, match.index ?? 0);
    if (!/(version|v0\.1|2026|100,000|400,000|50,000|25,000|5,000|0-100|10,000|30,000|900,000|4\.5|7:1)/i.test(excerpt)) {
      pushFinding(findings, text, match.index ?? 0, 'phone-like-number', 'warning');
    }
  }

  return {
    valid: findings.every(finding => finding.severity !== 'error'),
    version: NO_RAW_ADDRESS_RELEASE_SCAN_VERSION,
    findings,
  };
}
