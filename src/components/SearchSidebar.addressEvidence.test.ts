import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'SearchSidebar.tsx'), 'utf8');

test('SearchSidebar displays trusted source and fuzzy match evidence for address candidates', () => {
  assert.match(source, /formatSearchSourceLabel/);
  assert.match(source, /OSM \/ OpenStreetMap/);
  assert.match(source, /Administrative data/);
  assert.match(source, /Search match:/);
  assert.match(source, /Source:/);
  assert.match(source, /Match \{formatPublicConfidenceBand\(confidence\)\}/);
  assert.match(source, /getSearchResultConfidence/);
});
