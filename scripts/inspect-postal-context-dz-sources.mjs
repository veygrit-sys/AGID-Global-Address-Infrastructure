import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DZ_SOURCE_RECEIPTS = [
  ['upu-dza-en.pdf', 93430, '9be861e4fbc48cc6a39cf00adc7b2231079a64e1dd1a63f49ef86763b5f36533'],
  ['upu-general.pdf', 631050, 'ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d'],
  ['upu-copyright.html', 110431, '13c651e3970f83f28b6b6b70f450eaf2d0767172ae74254f1c19132e949cd2e0'],
  ['interior-rna.html', 204293, 'feac2ac2d8826d3016552630354d1cfc5b898640217d2fcc92fd510904e9cd96'],
  ['mpt-decree-19-258.pdf', 111842, 'd031b21ee0f92adcba87eba3610f404b610e5bd7cfdd5fcdc8b3534eb0879bd2'],
];

export function inspectDzSourceDirectory(directory) {
  return DZ_SOURCE_RECEIPTS.map(([file, expectedBytes, expectedSha256]) => {
    const bytes = readFileSync(resolve(directory, file));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== expectedBytes || sha256 !== expectedSha256) throw new Error(`source-drift:${file}`);
    return { file, bytes: bytes.length, sha256 };
  });
}

if (process.argv[1]?.endsWith('inspect-postal-context-dz-sources.mjs')) {
  const directory = process.argv[2];
  if (!directory) throw new Error('usage: inspect-postal-context-dz-sources.mjs <source-directory>');
  const receipts = inspectDzSourceDirectory(directory);
  console.log(JSON.stringify({ countryCode: 'DZ', receipts, totalBytes: receipts.reduce((sum, item) => sum + item.bytes, 0) }, null, 2));
}
