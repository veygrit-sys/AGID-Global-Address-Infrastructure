import { resolve } from 'node:path';

import { registerAddressQlReviewerKey } from '../src/lib/addressQlTrustPolicy';

const args = Object.fromEntries(
  process.argv.slice(2).reduce<Array<[string, string]>>((entries, value, index, values) => {
    if (!value.startsWith('--')) return entries;
    const next = values[index + 1];
    if (!next || next.startsWith('--')) throw new Error(`${value} requires a value`);
    entries.push([value.slice(2), next]);
    return entries;
  }, []),
);

for (const required of [
  'trust-store',
  'key-id',
  'reviewer-id',
  'public-key',
  'valid-from',
  'valid-until',
  'added-at',
]) {
  if (!args[required]) throw new Error(`--${required} is required`);
}

console.log(JSON.stringify(registerAddressQlReviewerKey({
  trustStorePath: resolve(args['trust-store']),
  keyId: args['key-id'],
  reviewerId: args['reviewer-id'],
  publicKeyPath: resolve(args['public-key']),
  validFrom: args['valid-from'],
  validUntil: args['valid-until'],
  addedAt: args['added-at'],
  ...(args.replaces ? { replacesKeyId: args.replaces } : {}),
  ...(args['minimum-signatures']
    ? { minimumSignatures: Number(args['minimum-signatures']) }
    : {}),
}), null, 2));
