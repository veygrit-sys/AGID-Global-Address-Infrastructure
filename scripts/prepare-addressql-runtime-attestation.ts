import { resolve } from 'node:path';

import { prepareAddressQlRuntimeAttestation } from '../src/lib/addressQlRuntimeAttestationWorkflow';

type Arguments = {
  configPath: string;
  adapterId: string;
  keyId: string;
  outputPath: string;
  trustStorePath?: string;
  now?: string;
};

function parseArguments(values: readonly string[]): Arguments {
  const output: Partial<Arguments> = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const next = values[index + 1];
    if (![
      '--config',
      '--adapter',
      '--key-id',
      '--output',
      '--trust-store',
      '--now',
    ].includes(value)) {
      throw new Error(`unsupported argument: ${value}`);
    }
    if (!next) throw new Error(`${value} requires a value`);
    if (value === '--config') output.configPath = next;
    if (value === '--adapter') output.adapterId = next;
    if (value === '--key-id') output.keyId = next;
    if (value === '--output') output.outputPath = next;
    if (value === '--trust-store') output.trustStorePath = next;
    if (value === '--now') output.now = next;
    index += 1;
  }
  if (
    !output.configPath
    || !output.adapterId
    || !output.keyId
    || !output.outputPath
  ) {
    throw new Error('--config, --adapter, --key-id, and --output are required');
  }
  return output as Arguments;
}

const args = parseArguments(process.argv.slice(2));
console.log(JSON.stringify(prepareAddressQlRuntimeAttestation({
  ...args,
  configPath: resolve(args.configPath),
  outputPath: resolve(args.outputPath),
  ...(args.trustStorePath
    ? { trustStorePath: resolve(args.trustStorePath) }
    : {}),
}), null, 2));
