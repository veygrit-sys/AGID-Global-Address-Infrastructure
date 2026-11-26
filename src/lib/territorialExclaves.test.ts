import assert from 'node:assert/strict';
import test from 'node:test';
import { matchTerritorialAdministration as admin, matchTerritorialExclave as match,
  queryTerritorialExclavePolygons, territorialExclaveFeatures } from './territorialExclaves';

test('island exclaves require land on the named physical component', () => {
  const controls = [
    ['temburong', 'BN', '9', 4.71, 115.08],
    ['oecusse', 'TL', '51', -9.24, 124.36],
    ['likoma', 'MW', '187546', -12.066111111, 34.730555556],
    ['chizumulu', 'MW', '188043', -12.019722222, 34.623611111],
  ] as const;
  for (const [id, code, gshhgId, lat, lon] of controls) {
    const hit = match(lat, lon);
    assert.equal(hit?.id, id);
    assert.equal(hit.code, code);
    assert.equal(hit.physicalDomain, 'island');
    assert.equal(hit.gshhgPhysicalId, gshhgId);
    assert.equal(hit.relation, 'inside');
  }
  for (const [lat, lon] of [[-12.03,34.67],[-12.0,34.72],[4.99,115.16],[45.968,8.961]]) {
    assert.equal(match(lat,lon), undefined, 'island belts and mapped lakes have no land-territory assignment');
    assert.equal(admin(lat,lon), undefined);
  }
});

test('Baarle cadastral parcels keep the Dutch counter-enclaves and the separate Dutch enclave distinct', () => {
  assert.equal(match(51.43954203707092, 4.922922395476215)?.id, 'baarle-counter');
  assert.equal(match(51.43834637, 4.92825739)?.id, 'baarle-hertog');
  assert.equal(match(51.41202, 4.87088)?.id, 'baarle-n8');
  assert.equal(match(51.4119, 4.869), undefined);
  assert.deepEqual(admin(51.4119, 4.869)?.codes, ['BE']);
  assert.deepEqual(admin(42.464, 1.951)?.codes, ['FR']);
  const groups = [...queryTerritorialExclavePolygons([4.75,51.36,5.02,51.49])];
  const count = (id: string) => groups.filter(group => group.feature.id === id).length;
  assert.deepEqual([count('baarle-hertog'),count('baarle-counter'),count('baarle-n8')], [22,7,1]);
  assert.equal([...queryTerritorialExclavePolygons([364.75,51.36,365.02,51.49])].length, groups.length);
  const shape = groups.find(group => group.feature.id === 'baarle-counter')!;
  const [x,y] = shape.rings[0][0];
  assert.equal(match(y,x)?.relation, 'boundary');
  assert.deepEqual(admin(y,x)?.codes, ['BE','NL']);
});

test('samples distinguish coastal exclaves, land enclaves, sovereign enclaved states and ordinary host land', () => {
  for (const [id,code,kind,lat,lon] of [
    ['llivia','ES','enclave',42.4708,1.973739], ['campione','IT','enclave',45.97,8.972],
    ['buesingen','DE','enclave',47.7,8.68333], ['madha','OM','enclave',25.28,56.31],
    ['nahwa','AE','counter-enclave',25.276,56.281], ['musandam','OM','coastal-exclave',25.995335,56.302664],
    ['nakhchivan','AZ','exclave',39.319766,45.518797], ['kaliningrad','RU','coastal-exclave',54.70,20.5],
    ['cabinda','AO','coastal-exclave',-5.081129,12.254928], ['alaska-mainland','US','coastal-exclave',61.216,-149.9],
    ['point-roberts','US','coastal-exclave',48.9868,-123.056], ['sokh','UZ','enclave',40.03413,71.07716],
    ['shohimardon','UZ','enclave',39.97778,71.81018], ['vorukh','TJ','enclave',39.83061,70.61891],
    ['lolazor','TJ','enclave',40.06743,69.54598], ['sarvan','TJ','enclave',40.95972,70.62357],
    ['san-marino','SM','enclaved-state',43.94,12.46], ['vatican','VA','enclaved-state',41.903939,12.453185],
    ['lesotho','LS','enclaved-state',-29.62406,28.17487],
  ] as const) {
    const hit = match(lat,lon);
    assert.deepEqual([hit?.id,hit?.code,hit?.kind,hit?.physicalDomain], [id,code,kind,'mainland']);
    assert.deepEqual(hit.boundaryCodes, [code]);
    assert.ok(hit.evidenceUrls.length);
  }
  // Kodiak Island, a GSHHG island inside a coarse Alaska outline, former Barak, Nepal, Dutch mainland.
  for (const [lat,lon] of [[57.7,-152.5],[60.610903,-164.80564600617583],[40.6667,72.7667],
    [27.7172,85.324],[52.37,4.9],[Number.NaN,0],[90.1,0]]) assert.equal(match(lat,lon),undefined);
  assert.equal(territorialExclaveFeatures.filter(f => f.kind === 'enclaved-state').length, 3);
});

test('points on a multi-country perimeter report only countries proven on the exact shared edge', () => {
  for (const [lat, lon, expected] of [
    [39.5649323,45.8030879,['AM','AZ']], [39.308591,45.1106995,['AZ','IR']], [39.6843217,44.801511,['AZ','TR']],
    [-4.43558235,12.862393,['AO','CG']], [-4.8472265,12.812563,['AO','CD']],
    [54.8030045,22.8742798,['LT','RU']], [54.3228435,21.439893,['PL','RU']], [59.4569405,-136.4417575,['CA','US']],
  ] as const) {
    assert.equal(match(lat,lon)?.relation,'boundary');
    assert.deepEqual(admin(lat,lon)?.codes,expected);
  }
  const island = [...queryTerritorialExclavePolygons([34.705,-12.11,34.76,-12.03])].find(p => p.feature.id==='likoma')!;
  const [x,y] = island.rings[0][0];
  assert.deepEqual(admin(y,x)?.codes,['MW'], 'a shore in Mozambican lake waters is not a land border with Mozambique');
});
