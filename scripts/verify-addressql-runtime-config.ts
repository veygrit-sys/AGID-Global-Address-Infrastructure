import { resolve } from 'node:path';

import {
  inspectAddressQlPostalDataFile,
  loadAddressQlRuntimeConfig,
} from '../src/lib/addressQlRuntimeConfig';

type Arguments = {
  configPath: string | null;
  dataPath: string | null;
  trustStorePath: string | null;
  allowConformanceAdapters: boolean;
  now?: string;
};

function parseArguments(values: readonly string[]): Arguments {
  const output: Arguments = {
    configPath: null,
    dataPath: null,
    trustStorePath: null,
    allowConformanceAdapters: false,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--allow-conformance') {
      output.allowConformanceAdapters = true;
      continue;
    }
    if (['--config', '--data', '--trust-store', '--now'].includes(value)) {
      const next = values[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === '--config') output.configPath = next;
      if (value === '--data') output.dataPath = next;
      if (value === '--trust-store') output.trustStorePath = next;
      if (value === '--now') output.now = next;
      index += 1;
      continue;
    }
    throw new Error(`unsupported argument: ${value}`);
  }
  if (Boolean(output.configPath) === Boolean(output.dataPath)) {
    throw new Error('exactly one of --config or --data is required');
  }
  return output;
}

const args = parseArguments(process.argv.slice(2));
if (args.dataPath) {
  console.log(JSON.stringify({
    status: 'ok',
    version: 'addressql-postal-data-inspection-v1',
    ...inspectAddressQlPostalDataFile(resolve(args.dataPath)),
    privacy: {
      containsRawAddress: false,
      containsRecipientData: false,
      printsPostalCodes: false,
    },
  }, null, 2));
  process.exit(0);
}
const loaded = loadAddressQlRuntimeConfig({
  configPath: resolve(args.configPath!),
  ...(args.trustStorePath
    ? { trustStorePath: resolve(args.trustStorePath) }
    : {}),
  allowConformanceAdapters: args.allowConformanceAdapters,
  ...(args.now ? { now: args.now } : {}),
});

console.log(JSON.stringify({
  status: 'ok',
  version: 'addressql-runtime-config-verification-v1',
  ...loaded.diagnostics,
  privacy: {
    containsRawAddress: false,
    containsRecipientData: false,
    printsPostalCodes: false,
  },
}, null, 2));
