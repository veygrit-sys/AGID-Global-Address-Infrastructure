import { resolve } from 'node:path';

import { prepareAddressQlRuntimeRelease } from '../src/lib/addressQlRuntimeReleaseLedger';

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
  'config',
  'release-id',
  'sequence',
  'created-at',
  'valid-from',
  'valid-until',
  'output',
]) {
  if (!args[required]) throw new Error(`--${required} is required`);
}

console.log(JSON.stringify(prepareAddressQlRuntimeRelease({
  configPath: resolve(args.config),
  releaseId: args['release-id'],
  sequence: Number(args.sequence),
  previousReleaseDigest: args['previous-release-digest'] || null,
  createdAt: args['created-at'],
  validFrom: args['valid-from'],
  validUntil: args['valid-until'],
  minimumSignatures: args['minimum-signatures']
    ? Number(args['minimum-signatures'])
    : 2,
  outputPath: resolve(args.output),
}), null, 2));
