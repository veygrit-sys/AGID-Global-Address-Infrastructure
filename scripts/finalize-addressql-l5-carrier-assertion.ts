import {
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

import {
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
for (const required of ['payload', 'signature', 'output']) {
  if (!args[required]) throw new Error(`--${required} is required`);
}

function boundedText(path: string, maximum: number, label: string) {
  const absolutePath = resolve(path);
  const stats = statSync(absolutePath);
  if (!stats.isFile() || stats.size <= 0 || stats.size > maximum) {
    throw new Error(`${label} must be a bounded regular file`);
  }
  return readFileSync(absolutePath, 'utf8');
}

const payloadText = boundedText(args.payload, 64 * 1024, 'L5 assertion payload');
const unsigned = JSON.parse(payloadText) as Omit<
  AddressQlL5CarrierAssertion,
  'signature'
>;
if (buildAddressQlL5CarrierAssertionPayload(unsigned) !== payloadText) {
  throw new Error('L5 assertion payload is not canonical');
}
const signature = boundedText(args.signature, 1024, 'L5 assertion signature').trim();
if (
  !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)
  || Buffer.from(signature, 'base64').length !== 64
) {
  throw new Error('L5 assertion signature must be a 64-byte Base64 value');
}
const outputPath = resolve(args.output);
writeFileSync(outputPath, `${JSON.stringify({
  ...unsigned,
  signature,
}, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });

console.log(JSON.stringify({
  status: 'ok',
  outputPath,
  carrierId: unsigned.carrierId,
  assertionId: unsigned.assertionId,
  containsRawAddress: false,
  containsRecipientData: false,
  containsPrivateKey: false,
}, null, 2));
