import { AOID_PRIVATE_FIELDS } from './constants';
import { clean } from './helpers';

function looksLikeRawPrivatePayload(value: string) {
  if (/^\s*[\[{]/.test(value)) return true;
  const privateFieldPattern = new RegExp(`"?(?:${AOID_PRIVATE_FIELDS.join('|')})"?\\s*:`, 'i');
  return privateFieldPattern.test(value);
}

export function isOpaqueEncryptedPayload(value: unknown): value is string {
  const payload = clean(value);
  return payload.length >= 24 && !looksLikeRawPrivatePayload(payload);
}
