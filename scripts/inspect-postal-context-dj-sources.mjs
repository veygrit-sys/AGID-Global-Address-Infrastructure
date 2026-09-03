import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DJ_SOURCE_RECEIPTS = [
  ['upu-dji-en.pdf', 248912, 'bdde6a8643c1a9905dd574cce29fbcf776ac5def6c0a628095a4ab47578d9391'],
  ['upu-general.pdf', 631050, 'ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d'],
  ['upu-copyright.html', 93689, '2088b4662caf22bbfcd3272a43a2e16562051aff73bb477c3a8ec15ddc93ce4d'],
  ['upu-africa.zip', 840572, '1db522e2c769a11b3dbc7436945f4a83057239b36e5d9da928cfc14170acb311'],
  ['mcpt-home.html', 177059, 'e2b356bed29e2a7e2f83caa06cb900fc1daf2369f1edcf18168196a2e37096e9'],
  ['mcpt-reglementation.html', 83000, 'af8464b4d1bafc5e587400c45da3851ae6213ec428332281ff9985f6bc62837e'],
  ['mcpt-law-13-1998.pdf', 175659, '43cb9617c3a28e3381d4be1e14dc885f5e8d52fb234f5fd86fb21fc51e4a749f'],
  ['decentralisation-cartographie.html', 91788, '5b3832a0bb94e8a7fa99e0280cccfc122903747e8f5f08c6a2b85a28205f6ac2'],
  ['decentralisation-map.pdf', 6454834, '452577cb5f470193d1e511e07265e9ea092689e9b2f2ef2098dc65aa7ae9b82a'],
];

export function inspectDjSourceDirectory(directory) {
  return DJ_SOURCE_RECEIPTS.map(([file, expectedBytes, expectedSha256]) => {
    const bytes = readFileSync(resolve(directory, file));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== expectedBytes || sha256 !== expectedSha256) throw new Error(`source-drift:${file}`);
    return { file, bytes: bytes.length, sha256 };
  });
}

if (process.argv[1]?.endsWith('inspect-postal-context-dj-sources.mjs')) {
  const directory = process.argv[2];
  if (!directory) throw new Error('usage: inspect-postal-context-dj-sources.mjs <source-directory>');
  const receipts = inspectDjSourceDirectory(directory);
  console.log(JSON.stringify({ countryCode: 'DJ', receipts, totalBytes: receipts.reduce((sum, item) => sum + item.bytes, 0) }, null, 2));
}
