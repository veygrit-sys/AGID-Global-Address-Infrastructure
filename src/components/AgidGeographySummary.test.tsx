import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { encodeAGID16 } from '../lib/agid';
import { assessAgidGeography, type AgidGeographicAssessment, type AgidGeographyInput } from '../lib/geographicAssessment';
import { AgidGeographySummary } from './AgidGeographySummary';

function render(input: AgidGeographyInput, locale: 'en' | 'ja' = 'en') {
  return renderToStaticMarkup(<AgidGeographySummary assessment={assessAgidGeography(input)} locale={locale} />);
}

test('the map distinguishes a selected point from a border-straddling ID cell and device fix', () => {
  const lat = -28.9086745, lon = 28.988132;
  const point = render({ kind: 'pin', lat, lon });
  assert.match(point, /Selected point/);
  assert.match(point, /Lesotho/);
  assert.doesNotMatch(point, /South Africa/);
  const cell = render({ kind: 'cell', id: encodeAGID16(lat, lon).id });
  assert.match(cell, /AGID cell/);
  assert.match(cell, /Lesotho \/ South Africa/);
  assert.match(cell, /Confirm the region locally/);
  const device = render({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 10 }, 'ja');
  assert.match(device, /測位誤差の半径 10 m/);
  assert.match(device, /レソト \/ 南アフリカ/);
});

test('unassessed points have no regional claim and missing device accuracy is explicit', () => {
  const result = render({ kind: 'pin', lat: 48.85, lon: 2.35, method: 'device' }, 'ja');
  assert.match(result, /測位精度は不明/);
  assert.match(result, /詳細な境界データがありません/);
  assert.doesNotMatch(result, /国・地域の候補|フランス|陸地|水域/);
});

test('the map credits the boundary provider at an administrative enclave', () => {
  const result = render({ kind: 'pin', lat: 47.7, lon: 8.68333 });
  assert.match(result, /Germany/);
  assert.match(result, /Federal Office of Topography swisstopo/);
});

function renderIsland(island: NonNullable<AgidGeographicAssessment['island']>, locale = 'en') {
  const assessment: AgidGeographicAssessment = {
    status: 'mapped', surface: 'land', regionCandidates: ['RU'], sources: [],
    footprint: { kind: 'manual-pin', radiusMeters: 0 }, boundaryAllowanceMeters: 0,
    deliveryRegion: null, island,
  };
  return renderToStaticMarkup(<AgidGeographySummary assessment={assessment} locale={locale} />);
}

test('the Japan display shows its stated basis and source without a competing legacy country', () => {
  const result = renderIsland({
    status: 'japan-position', territory: 'takeshima', countryCodes: ['JP'],
    source: 'MOFA', version: 'test', relation: 'inside', evidenceUrls: ['https://www.mofa.go.jp/mofaj/area/takeshima/index.html'],
  }, 'ja');
  assert.match(result, /竹島/);
  assert.match(result, /日本政府の領土見解に基づく表示/);
  assert.match(result, />日本</);
  assert.doesNotMatch(result, /ロシア|韓国|国・地域の候補/);
  assert.match(result, /href="https:\/\/www\.mofa\.go\.jp\/mofaj\/area\/takeshima\/index\.html"/);
});

test('the UI distinguishes mapped territories, sovereigns and group-level claims', () => {
  const mapped = renderIsland({
    status: 'mapped', countryCodes: ['GL'], sovereignCodes: ['DK'], source: 'map', version: 'test', relation: 'inside',
  });
  assert.match(mapped, /Mapped country or territory.*Greenland/);
  assert.match(mapped, /Sovereign state in map source.*Denmark/);
  const disputed = renderIsland({
    status: 'disputed', territory: 'Spratly Islands', countryCodes: [],
    claimantCodes: ['CN','VN'], claimScope: 'island-group', source: 'map', version: 'test', relation: 'inside',
  });
  assert.match(disputed, /Competing claims/);
  assert.match(disputed, /Claimants to all or part of the island group/);
  assert.match(disputed, /China \/ Vietnam/);
  assert.doesNotMatch(disputed, /Russia|Mapped country or territory|Administration in source/);
  const unresolved = renderIsland({
    status: 'unresolved', countryCodes: [], source: 'map', version: 'test', relation: 'inside',
  }, 'ja');
  assert.match(unresolved, /要確認/);
  assert.doesNotMatch(unresolved, /ロシア|地図上の国・地域/);
});

test('map search applies the Japanese display to external hits while preserving recipient-saved text', async () => {
  const { mapSearchDisplayResults } = await import('../lib/islandSearchDisplay');
  const external = { display_name: 'External country label', lat: '25.74416667', lon: '123.46805556' };
  const saved = { ...external, display_name: 'My delivery instructions', source: 'local_qrs' };
  const [mapped, personal] = mapSearchDisplayResults([external, saved], 'ja');
  assert.match(mapped.display_name, /尖閣諸島 · 日本/);
  assert.doesNotMatch(mapped.display_name, /External country label/);
  assert.equal(personal, saved);
});

test('local-pack discovery is restricted to explicit loopback origins', async () => {
  const { isLoopbackMap } = await import('./LocalIslandPackLookup');
  for (const host of ['localhost','127.0.0.1','[::1]']) assert.ok(isLoopbackMap('http:', host));
  for (const host of ['map.veygrit.com','localhost.example.org','192.168.1.12']) assert.equal(isLoopbackMap('https:',host),false);
  assert.equal(isLoopbackMap('file:', 'localhost'),false);
});

test('saved map references and QR cards apply the island policy to the original geographic footprint', async () => {
  const { decodeAgidToResult, deviceAgidSelection } = await import('../lib/agidSelection');
  const { selectedIslandReference } = await import('../lib/islandSearchDisplay');
  const japanCell = decodeAgidToResult('JP0AH6C6T5CM1F8J')!;
  const falklands = decodeAgidToResult('000M601WEDQ51E6Y')!;
  assert.equal(selectedIslandReference(japanCell, 'ja'), '尖閣諸島 · 日本');
  assert.match(selectedIslandReference(falklands, 'en')!, /Falkland.*Competing territorial claims/);
  const uncertain = deviceAgidSelection({ latitude: japanCell.lat, longitude: japanCell.lon, accuracy: NaN });
  assert.equal(selectedIslandReference(uncertain, 'en'), 'Senkaku Islands · Japan · Confirm the location');
});

test('ordinary Japanese offshore islands use the national names in search, cards and saved pins', async () => {
  const { selectedIslandReference, mapSearchDisplayResults } = await import('../lib/islandSearchDisplay');
  const { deviceAgidSelection, decodeAgidToResult } = await import('../lib/agidSelection');
  for (const [lat, lon, name] of [
    [20.425255,136.069763,'沖ノ鳥島'], [24.289194,153.980548,'南鳥島'], [27.245431,140.880136,'西之島'],
  ] as const) {
    const pin = encodeAGID16(lat, lon);
    assert.equal(selectedIslandReference({ ...pin, regionName:'External provider', prefix:'00' }, 'ja'), `${name} · 日本`);
    const hit = { lat:String(lat), lon:String(lon), display_name:'External provider' };
    const saved = { ...hit, display_name:'Recipient-specified address', source:'local_qrs' };
    const results = mapSearchDisplayResults([hit,saved], 'ja');
    assert.ok(results[0].display_name.startsWith(`${name} · 日本 · `));
    assert.equal(results[1], saved);
  }
  const cell = decodeAgidToResult('JP05FQ810RNS1BRM')!;
  assert.equal(selectedIslandReference(cell, 'en'), 'Minamitorishima · Japan');
  const uncertain = deviceAgidSelection({ latitude:20.425255, longitude:136.069763, accuracy:10 });
  assert.equal(selectedIslandReference(uncertain, 'ja'), '沖ノ鳥島 · 中心点の島は日本 · 位置を要確認');
  const water = { lat:'20.4252', lon:'136.075', display_name:'Marine feature' };
  const unrelated = { lat:'64.1466', lon:'-21.9426', display_name:'Reykjavík' };
  assert.deepEqual(mapSearchDisplayResults([water,unrelated], 'ja'), [water,unrelated]);
});
