import {
  readFileSync,
  statSync,
} from 'node:fs';
import { resolve } from 'node:path';

import {
  loadAddressQlDeliveryPointVerifier,
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
for (const required of ['trust-store', 'request']) {
  if (!args[required]) throw new Error(`--${required} is required`);
}

const requestPath = resolve(args.request);
const stats = statSync(requestPath);
if (!stats.isFile() || stats.size <= 0 || stats.size > 256 * 1024) {
  throw new Error('L5 request must be a bounded regular file');
}
const request = JSON.parse(readFileSync(requestPath, 'utf8')) as unknown;
const verifier = loadAddressQlDeliveryPointVerifier(
  resolve(args['trust-store']),
  args.now ? { now: args.now } : {},
);
console.log(JSON.stringify(verifier.assess(request), null, 2));
