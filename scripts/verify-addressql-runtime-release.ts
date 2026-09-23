import { resolve } from 'node:path';

import { verifyAddressQlRuntimeRelease } from '../src/lib/addressQlRuntimeReleaseLedger';

const values = process.argv.slice(2);
const args: Record<string, string> = {};
let advanceState = false;
for (let index = 0; index < values.length; index += 1) {
  const key = values[index];
  if (key === '--advance-state') {
    advanceState = true;
    continue;
  }
  if (!key.startsWith('--') || !values[index + 1]) {
    throw new Error('arguments require --name value pairs');
  }
  args[key.slice(2)] = values[index + 1];
  index += 1;
}
for (const required of ['config', 'ledger', 'trust-store', 'state']) {
  if (!args[required]) throw new Error(`--${required} is required`);
}

console.log(JSON.stringify(verifyAddressQlRuntimeRelease({
  configPath: resolve(args.config),
  ledgerPath: resolve(args.ledger),
  trustStorePath: resolve(args['trust-store']),
  statePath: resolve(args.state),
  ...(args.now ? { now: args.now } : {}),
  advanceState,
}), null, 2));
