export const PRIVATE_MATERIAL_BODY_ERROR = 'private_material_not_allowed';

const PRIVATE_MATERIAL_BODY_KEYS = new Set([
  'privatekey',
  'private_key',
  'proofsecret',
  'proof_secret',
  'rawwitness',
  'raw_witness',
  'proofwitness',
  'proof_witness',
  'rawrecipient',
  'raw_recipient',
  'rawaddress',
  'raw_address',
]);

export function containsPrivateMaterialBodyKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsPrivateMaterialBodyKey);
  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) => PRIVATE_MATERIAL_BODY_KEYS.has(key.toLowerCase()) || containsPrivateMaterialBodyKey(child),
  );
}

export function assertNoPrivateMaterialBodyKeys(value: unknown): void {
  if (containsPrivateMaterialBodyKey(value)) throw new TypeError(PRIVATE_MATERIAL_BODY_ERROR);
}
