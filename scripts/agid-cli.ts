import { readFileSync } from 'node:fs';

import { runAgidCli } from '../src/lib/agidCli';
import { getServerAddressFormat } from '../src/server/addressFormatFileLoader';

function readStdinIfNeeded(argv: readonly string[]) {
  if (!argv.includes('--stdin')) return undefined;
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const result = await runAgidCli(process.argv.slice(2), {
  stdin: readStdinIfNeeded(process.argv.slice(2)),
  readFile: path => readFileSync(path, 'utf8'),
  addressFormatResolver: countryCode => getServerAddressFormat(countryCode),
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.exitCode;
