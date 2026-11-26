import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAGID, encodeAGID16, getAGIDCellKey } from './agid';
import { assessAgidGeography as assess, reviewedAddressNeedsConfirmation } from './geographicAssessment';
import { resolveAgidLocal } from './agidLocalResolver';

test('the Egypt–Libya–Sudan junction retains three candidates on a pin, a device fix and both cell formats', () => {
  for (const input of [{kind:'pin',lat:22,lon:25}, {kind:'pin',lat:22,lon:25,accuracyMeters:20},
    {kind:'cell',id:encodeAGID(22,25).id}, {kind:'cell',id:encodeAGID16(22,25).id}] as const) {
    const r = assess(input);
    assert.equal(r.surface,'land');
    assert.equal(r.status,'needs-confirmation');
    assert.deepEqual(r.regionCandidates,['EG','LY','SD']);
    assert.equal(r.deliveryRegion,null);
  }
  for (const [lat, lon, code] of [[22.04,24.9,'LY'],[22.04,25.1,'EG'],[21.96,25.1,'SD'],
    [-22,21.03,'BW'],[-22,20.97,'NA']] as const) {
    const r = assess({kind:'pin',lat,lon});
    assert.equal(r.status,'mapped');
    assert.deepEqual(r.regionCandidates,[code]);
    assert.equal(encodeAGID16(lat,lon).prefix,code);
    assert.equal(r.borderNotices,undefined);
    assert.equal(reviewedAddressNeedsConfirmation(r), false);
  }
});

test('nine continental territories retain their own status and never select a postal country', async () => {
  for (const [id,lat,lon,codes] of [
    ['western-sahara',27.15,-13.20,['EH','MA']], ['abyei',9.595,28.435,['SD','SS']],
    ['halaib',22.8,35.65,['EG','SD']], ['bir-tawil',21.9,33.8,[]], ['ilemi',4.9,35.1,['KE','SS']],
    ['somaliland',9.5624,44.077,['SLND','SO']], ['ceuta',35.89,-5.315,['ES','MA']],
    ['melilla',35.29,-2.946,['ES','MA']], ['koalou',11.01,.94,['BF','BJ']],
  ] as const) {
    for (const input of [{kind:'pin',lat,lon},{kind:'pin',lat,lon,method:'device',accuracyMeters:8},
      {kind:'cell',id:encodeAGID16(lat,lon).id}] as const) {
      const r=assess(input);
      assert.deepEqual(r.regionCandidates,codes,id);
      assert.deepEqual(r.borderNotices?.map(n=>n.id),[id],id);
      assert.match(r.borderNotices[0].url,/^https:\/\//);
      assert.equal(r.status,'needs-confirmation');
      assert.equal(r.deliveryRegion,null);
    }
    const requested: string[]=[];
    await resolveAgidLocal({coordinates:{lat,lon},addressFormatResolver:async c=>{requested.push(c);return null;}});
    assert.deepEqual(requested,[],id);
  }
});

test('the stored Sudanese/South Sudanese prefix does not silently choose an address form', async () => {
  for (const old of ['SS02WFSA86KG','SS02WFSA86KG1NNN']) {
    assert.equal(getAGIDCellKey(old),getAGIDCellKey(encodeAGID16(9.595,28.435)));
    const called: string[]=[];
    const resolver=async (c:string)=>{called.push(c);return null;};
    const resolved=await resolveAgidLocal({query:old,addressFormatResolver:resolver});
    assert.equal(resolved.agidId,old);
    assert.deepEqual(called,[]);
    await resolveAgidLocal({query:old,countryCode:'SS',addressFormatResolver:resolver});
    assert.deepEqual(called,['SS']);
  }
});

test('three border rivers keep the water and individual dry banks separate', () => {
  for (const [lat,lon,code] of [[-17.789375,25.274417,'ZM'],[-17.808417,25.268375,'ZW'],
    [16.512583,-15.8125,'MR'],[16.501375,-15.814625,'SN'],[-4.309208,15.279042,'CD'],[-4.290833,15.265,'CG'],
    [-17.801125,25.278042,null],[16.504042,-15.805458,null],[-4.301458,15.269917,null]] as const) {
    for (const input of [{kind:'pin',lat,lon}, {kind:'cell',id:encodeAGID16(lat,lon).id}] as const) {
      const r=assess(input);
      assert.deepEqual(r.regionCandidates,code ? [code] : []);
      assert.equal(r.status,'mapped');
      assert.equal(r.surface,code ? 'land':'water');
      assert.equal(r.deliveryRegion,null);
    }
    assert.equal(encodeAGID(lat,lon).regionCode,code ?? 'INLAND_WATER');
  }
});

test('a wider device radius adds only the dry countries it reaches', () => {
  function countries(lat: number, lon: number, accuracyMeters: number) {
    return assess({ kind: 'pin', lat, lon, method: 'device', accuracyMeters }).regionCandidates;
  }
  assert.deepEqual(countries(-22, 21.0005, 15), ['BW']);
  assert.deepEqual(countries(-22, 21.0005, 1000), ['BW', 'NA']);
  assert.deepEqual(countries(22.0004, 25.0004, 12), ['EG']);
  assert.deepEqual(countries(22.0004, 25.0004, 150), ['EG', 'LY', 'SD']);
  assert.deepEqual(countries(16.504042, -15.805458, 100), []);
  assert.deepEqual(countries(16.504042, -15.805458, 320), ['MR', 'SN']);
});

test('a third neighbour at a territorial boundary and its status record have different meanings', () => {
  const west = assess({ kind: 'pin', lat: 21.788671, lon: -13.046214 });
  assert.deepEqual(west.borderNotices?.[0].codes, ['EH', 'MA']);
  assert.deepEqual(west.regionCandidates, ['EH', 'MA', 'MR']);
  assert.equal(west.deliveryRegion, null);
  const birTawilEdge = assess({ kind: 'pin', lat: 21.8814035, lon: 34.0416485 });
  assert.deepEqual(birTawilEdge.borderNotices?.[0].codes, []);
  assert.deepEqual(birTawilEdge.regionCandidates, ['SD']);
  assert.equal(birTawilEdge.status, 'needs-confirmation');
});

test('inconclusive physical evidence at a border keeps adjacent countries for context without issuing an address country', async () => {
  for (const [lat, lon, countries] of [[-9.4680515, 21.8260365, ['AO', 'CD']],
    [-17.79111, 25.2625, ['BW', 'ZM']]] as const) {
    const pin = assess({ kind: 'pin', lat, lon });
    assert.deepEqual(pin.adjacentRegions, countries);
    assert.equal(pin.surface, 'unknown');
    assert.ok(reviewedAddressNeedsConfirmation(pin));
    assert.deepEqual(pin.regionCandidates, []);
    assert.equal(pin.deliveryRegion, null);
    const requested: string[] = [];
    await resolveAgidLocal({coordinates: { lat, lon }, addressFormatResolver: async c => { requested.push(c); return null; }});
    assert.deepEqual(requested, []);
  }
});
