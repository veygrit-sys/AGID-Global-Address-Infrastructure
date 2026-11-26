import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import scope from '../../scripts/data/europe-frontiers/scope.json';
import treaties from '../../scripts/data/europe-frontiers/treaty-coordinates.json';
import { encodeAGID16, getAGIDCellKey } from './agid';
import { europeanFrontierCatalog, europeanFrontiersTouching, frontiersForRegion } from './europeFrontierAtlas';
import { assessAgidGeographyWithFrontiers as assess } from './geographicAssessment';
import { unpackMapLine } from './packedMapRing';

const pin = (lat: number, lon: number) => assess({kind:'pin',lat,lon});

test('all 129 independently listed neighbour pairs and complete source editions are present',async () => {
  const catalog = await europeanFrontierCatalog();
  const pairs = new Set(catalog.filter(f => f.source === 'lsib' || ['demarcation','signed-agreement'].includes(f.kind)).map(f => f.codes.join('-')));
  assert.equal(scope.expectedLandPairs.length,129);
  for (const pair of scope.expectedLandPairs) assert.ok(pairs.has(pair), pair);
  assert.equal(catalog.length,588);
  assert.equal(new Set(catalog.map(f => f.id)).size,catalog.length);
  assert.equal(catalog.filter(f => f.source==='lsib').length,140);
  assert.equal(catalog.filter(f => f.source==='vliz').length,377);
  for (const code of ['dk','GL','ca']) assert.ok((await frontiersForRegion(code)).some(f => f.id==='tartupaluk-2022'));
  for (const code of ['FR','NL','MF','SX']) assert.ok((await frontiersForRegion(code)).some(f => f.id==='saint-martin-2023' && f.vertices===392));
  assert.ok((await frontiersForRegion('FR')).some(f => f.codes.join('-')==='BR-GF'));
  assert.ok((await frontiersForRegion('GB')).some(f => f.codes.join('-')==='CY-XD' && f.parts===5));
  assert.ok((await frontiersForRegion('ES')).some(f => f.codes.join('-')==='ES-MA' && f.parts===3));
  assert.ok((await frontiersForRegion('PT')).some(f => f.name==='Portuguese claim' && !f.codes.length));
  assert.ok((await frontiersForRegion('SE')).some(f => f.codes.includes('DK') && f.kind==='water-line'));
  await assert.rejects(() => frontiersForRegion('Denmark'));
});

test('all 588 source features are reachable via the local two-degree index',async () => {
  const directory = new URL('../data/europe-frontiers/',import.meta.url);
  const catalog = await europeanFrontierCatalog();
  const seen = new Set<number>();
  for (const file of (await readdir(directory)).filter(f => f.startsWith('lines-'))) {
    const blocks: [number,number[],string,number,number][] = JSON.parse(await readFile(new URL(file,directory),'utf8'));
    for (const [id,,path] of blocks) {
      if (seen.has(id)) continue;
      const [raw,y] = unpackMapLine(path,1e7)[0];
      const x = raw-360*Math.floor((raw+180)/360);
      const hits = await europeanFrontiersTouching([x,y,x,y],(a,b,c,d) => Math.hypot(a-x,b-y)<1e-7 || Math.hypot(c-x,d-y)<1e-7);
      assert.ok(hits.some(f => f.id===catalog[id].id),catalog[id].id);
      seen.add(id);
    }
  }
  assert.equal(seen.size,catalog.length);
});

test('two surveyed Vennbahn pins in one cell resolve separately and nearby nonintersecting cells do too',async () => {
  const lat = 50.59735;
  const keys = new Set<string | null>();
  for (const [lon,code] of [[6.24838,'DE'],[6.248406,'BE']] as const) {
    const id = encodeAGID16(lat,lon).id;
    keys.add(getAGIDCellKey(id));
    assert.deepEqual((await pin(lat,lon)).regionCandidates,[code]);
    const cell = await assess({kind:'cell',id});
    assert.deepEqual(cell.regionCandidates,['BE','DE']);
    assert.equal(cell.deliveryRegion,null);
  }
  assert.equal(keys.size,1);
  for (const [id,code] of [['BE0GZ02AW49Y1R3K','BE'],['DE0GZ02AW4BZ1AAT','DE']]) {
    assert.deepEqual((await assess({kind:'cell',id})).regionCandidates,[code]);
  }
  assert.deepEqual((await pin(50.754283,6.021017)).regionCandidates,['BE','DE','NL']);
});

test('points on either side of the Eurode building and a measured disk use the national survey',async () => {
  const east = {lat:50.86257601026518,lon:6.081068095697813};
  assert.deepEqual((await pin(50.862574589487885,6.081011332508476)).regionCandidates,['NL']);
  assert.deepEqual((await pin(east.lat,east.lon)).regionCandidates,['DE']);
  assert.deepEqual((await pin(50.86257529987997,6.08103971410257)).regionCandidates,['DE','NL']);
  const disk = await assess({kind:'pin',method:'device',...east,accuracyMeters:5});
  assert.deepEqual(disk.regionCandidates,['DE','NL']);
  assert.equal(disk.deliveryRegion,null);
  assert.equal((await assess({kind:'pin',method:'device',...east})).frontierSearch,'unknown-accuracy');
  assert.equal((await assess({kind:'pin',...east,accuracyMeters:550000})).frontierSearch,'large-footprint');
});

test('Cypriot enclaves, their neighbour, Mareterra, its marina and a joint river remain distinct',async () => {
  for (const [lat,lon,code] of [[35.01867,33.7424,'CY'],[34.99131,33.78150,'CY'],[35.024,33.75,'XD'],[43.7405556,7.4316667,'MC']] as const) {
    const result=await pin(lat,lon);
    assert.equal(result.surface,'land');
    assert.deepEqual(result.regionCandidates,[code]);
    assert.deepEqual((await assess({kind:'cell',id:encodeAGID16(lat,lon).id})).regionCandidates,[code]);
  }
  const marina=await pin(43.74065,7.4309);
  assert.equal(marina.surface,'water');
  assert.deepEqual(marina.regionCandidates,[]);
  const joint=await pin(49.538,6.36321759062701);
  assert.equal(joint.administrativeArea?.joint,true);
  assert.deepEqual(joint.administrativeArea?.codes,['DE','LU']);
  assert.equal(joint.deliveryRegion,null);
});

test('371 inland signed markers preserve both Saint-Martin codes, and a maritime treaty contributes no land candidates',async () => {
  // Annex A markers 10–380 lie at least 150 m inside the GSHHG full-resolution land outline.
  const inland=treaties.saintMartin.slice(9,380);
  assert.equal(inland.length,371);
  for (const [lon,lat] of inland) {
    const result=await pin(lat,lon);
    assert.deepEqual(result.regionCandidates,['MF','SX']);
    assert.ok(result.frontiers?.some(f => f.id==='saint-martin-2023'));
  }
  const [lon,lat]=treaties.tartupaluk[1];
  assert.ok((await pin(lat,lon)).frontiers?.some(f => f.id==='tartupaluk-2022' && f.codes.join('-')==='CA-GL'));
  const marine=await pin(35.73694444,12.46472222);
  const record=marine.frontiers?.find(f => f.id==='vliz-1190');
  assert.equal(record?.classification,'Treaty');
  assert.deepEqual(record?.searchCodes,['IT','TN']);
  assert.equal(marine.surface,'water');
  assert.deepEqual(marine.regionCandidates,[]);
  assert.equal(marine.deliveryRegion,null);
});
