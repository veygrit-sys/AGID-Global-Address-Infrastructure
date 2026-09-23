import { resolve } from 'node:path';

import { revokeAddressQlReviewerKey } from '../src/lib/addressQlTrustPolicy';

const args = Object.fromEntries(
  process.argv.slice(2).reduce<Array<[string, string]>>((entries, value, index, values) => {
    if (!value.startsWith('--')) return entries;
    const next = values[index + 1];
    if (!next || next.startsWith('--')) throw new Error(`${value} requires a value`);
    entries.push([value.slice(2), next]);
    return entries;
  }, []),
);

for (const required of ['trust-store', 'key-id', 'revoked-at', 'reason']) {
  if (!args[required]) throw new Error(`--${required} is required`);
}

console.log(JSON.stringify(revokeAddressQlReviewerKey({
  trustStorePath: resolve(args['trust-store']),
  keyId: args['key-id'],
  revokedAt: args['revoked-at'],
  reason: args.reason,
}), null, 2));
