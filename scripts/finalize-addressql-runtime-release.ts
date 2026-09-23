import { resolve } from 'node:path';

import { finalizeAddressQlRuntimeRelease } from '../src/lib/addressQlRuntimeReleaseLedger';

const values = process.argv.slice(2);
const args: Record<string, string> = {};
const signatures: Array<{ keyId: string; signaturePath: string }> = [];
for (let index = 0; index < values.length; index += 2) {
  const key = values[index];
  const value = values[index + 1];
  if (!key?.startsWith('--') || !value) throw new Error('arguments require --name value pairs');
  if (key === '--signature') {
    const separator = value.indexOf('=');
    if (separator <= 0) throw new Error('--signature must be key-id=path');
    signatures.push({
      keyId: value.slice(0, separator),
      signaturePath: resolve(value.slice(separator + 1)),
    });
  } else {
    args[key.slice(2)] = value;
  }
}
for (const required of ['config', 'payload', 'trust-store', 'output']) {
  if (!args[required]) throw new Error(`--${required} is required`);
}

console.log(JSON.stringify(finalizeAddressQlRuntimeRelease({
  configPath: resolve(args.config),
  payloadPath: resolve(args.payload),
  trustStorePath: resolve(args['trust-store']),
  signatures,
  outputPath: resolve(args.output),
  ...(args.now ? { now: args.now } : {}),
}), null, 2));
