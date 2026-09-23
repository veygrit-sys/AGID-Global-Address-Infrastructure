import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPlaylistCommerceCoverageTable } from '../src/lib/playlistCommercePresentationMap';

const DOC_PATH = join(process.cwd(), 'docs/product/playlist-commerce-diagrams.md');
const SECTION_HEADING = '## 13. Implementation Coverage Table';

export function buildPlaylistCommerceCoverageSection() {
  return `${SECTION_HEADING}

This table keeps the diagram deck connected to the tested widget, SDK
contracts, checkout fixture, webhook fixtures, and safe non-claim boundaries.
When a diagram is changed, update the corresponding implementation evidence
instead of letting the slide become a standalone claim.

${renderPlaylistCommerceCoverageTable()}
`;
}

export function syncPlaylistCommerceCoverageTable(markdown: string) {
  const start = markdown.indexOf(SECTION_HEADING);
  if (start === -1) throw new Error(`Missing section: ${SECTION_HEADING}`);

  const prefix = markdown.slice(0, start).trimEnd();
  return `${prefix}\n\n${buildPlaylistCommerceCoverageSection()}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const shouldWrite = process.argv.includes('--write');
  const current = readFileSync(DOC_PATH, 'utf8');
  const next = syncPlaylistCommerceCoverageTable(current);

  if (shouldWrite) {
    writeFileSync(DOC_PATH, next);
    console.log(`Updated ${DOC_PATH}`);
  } else if (current !== next) {
    console.error('Playlist Commerce coverage table is out of sync. Run with --write.');
    process.exit(1);
  } else {
    console.log('Playlist Commerce coverage table is in sync.');
  }
}
