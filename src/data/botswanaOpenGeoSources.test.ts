import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

test('Botswana registry exposes address context without postcode or geometry authority', () => {
  const source = AFRICA_OPEN_GEO_SOURCES['botswanapost-addressing'];
  assert.ok(getAfricaOpenSourceIds('BW').includes(source.id));
  assert.equal(source.kind, 'address');
  assert.equal(source.usage, 'reference');
  assert.match(source.notes, /does not require postal codes.*non-postcode context.*not postal geometry/i);
});

test('Botswana official source catalog fails closed at metadata-only context', () => {
  const source = getOfficialPostalSourcesForCountry('BW').find(item => item.id === 'botswanapost');
  assert.equal(source?.sourceRole, 'context-only');
  assert.equal(source?.validationReadiness, 'metadata-only');
  assert.deepEqual(source?.openSourceIds, ['botswanapost-addressing']);
  assert.match(source?.notes.join(' ') ?? '', /does not require postal codes.*no.*Polygon\/MultiPolygon/i);
});
