import {
  createHash,
} from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
  buildAddressQlL5CarrierAssertionPayload,
  type AddressQlL5CarrierAssertion,
} from '../src/lib/addressQlDeliveryPointDecision';

const values = process.argv.slice(2);
const args: Record<string, string> = {};
for (let index = 0; index < values.length; index += 2) {
  const key = values[index];
  const value = values[index + 1];
  if (!key?.startsWith('--') || !value) {
    throw new Error('arguments require --name value pairs');
  }
  args[key.slice(2)] = value;
}
for (const required of [
  'assertion-id',
  'carrier-id',
  'key-id',
  'country-code',
  'delivery-point-commitment',
  'service-level',
  'decision',
  'source-version',
  'evidence-digest',
  'assessed-at',
  'expires-at',
  'output',
]) {
  if (!args[required]) throw new Error(`--${required} is required`);
}

const payload = buildAddressQlL5CarrierAssertionPayload({
  version: ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
  assertionId: args['assertion-id'],
  carrierId: args['carrier-id'],
  keyId: args['key-id'],
  countryCode: args['country-code'],
  deliveryPointCommitment: args['delivery-point-commitment'],
  serviceLevel: args['service-level'],
  decision: args.decision as AddressQlL5CarrierAssertion['decision'],
  sourceVersion: args['source-version'],
  evidenceDigest: args['evidence-digest'],
  assessedAt: args['assessed-at'],
  expiresAt: args['expires-at'],
});
const outputPath = resolve(args.output);
writeFileSync(outputPath, payload, { encoding: 'utf8', flag: 'wx' });

console.log(JSON.stringify({
  status: 'ok',
  version: ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
  outputPath,
  payloadDigest: `sha256:${createHash('sha256').update(payload).digest('hex')}`,
  containsRawAddress: false,
  containsRecipientData: false,
  containsPrivateKey: false,
}, null, 2));
