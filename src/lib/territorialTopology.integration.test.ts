import assert from 'node:assert/strict';
import test from 'node:test';
import { getAGIDCellKey, toAGID16 } from './agid';
import { runAgidCli } from './agidCli';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';

const pin = (lat: number, lon: number) => assessAgidGeography({ kind: 'pin', lat, lon });

test('landlocked states and foreign enclaves on a continent have different political relationships', () => {
  // Independent references: swisstopo's national-border register confirms the two Swiss cases;
  // the municipality's guide documents the Llívia land enclosure.
  // https://www.swisstopo.admin.ch/en/national-border
  // https://llivia.org/files/fulletons_turistics/angles_info_llivia.pdf
  // https://www.gov.za/about-sa/south-africas-provinces
  const points = [
    ['Büsingen', 47.7, 8.68333, 'enclave', 'DE', 'CH'],
    ['Campione on the eastern shore of Lake Lugano', 45.968, 8.972, 'enclave', 'IT', 'CH'],
    ['Llívia', 42.465, 1.980, 'enclave', 'ES', 'FR'],
    ['Nakhchivan', 39.20, 45.41, 'exclave', 'AZ', 'AM'],
    ['Maseru, Lesotho', -29.31, 27.49, 'enclaved-state', 'LS', 'ZA'],
    ['Vatican City', 41.90216, 12.45736, 'enclaved-state', 'VA', 'IT'],
    ['San Marino', 43.9347, 12.4476, 'enclaved-state', 'SM', 'IT'],
  ] as const;
  for (const [name, lat, lon, kind, code, neighbor] of points) {
    const a = pin(lat, lon);
    assert.equal(a.island, undefined, name);
    const t = a.territorialTopology;
    assert.ok(t?.administration, name);
    assert.equal(t.landform, 'mainland', name);
    assert.equal(t.status, 'inside', name);
    assert.equal(t.administration.kind, kind, name);
    assert.equal(t.administration.code, code, name);
    assert.ok(t.administration.neighboringCodes.includes(neighbor), name);
    assert.ok(t.administration.evidenceUrls.length, name);
    assert.equal(a.deliveryRegion, null, name);
  }
  // Both points are near the Italian exclave, but this pin is in the lake.
  const luganoWater = pin(45.9678, 8.9638);
  assert.equal(luganoWater.territorialTopology?.administration, undefined);
  assert.notEqual(luganoWater.territorialTopology?.landform, 'mainland');
  assert.equal(luganoWater.island, undefined);
  const rome = pin(41.890222, 12.492306);
  assert.equal(rome.territorialTopology?.administration, undefined);
});

test('the Dutch N1 counter-enclave, Belgian H1 and the Dutch mainland are distinguishable at Baarle', () => {
  // Independent test coordinates from Kadaster's GM0744 cadastral multipolygon, in WGS84.
  // https://api.pdok.nl/kadaster/brk-bestuurlijke-gebieden/ogc/v1/collections/gemeentegebied/items/f6a469a5-f2f0-53a9-8402-5635437577ef?f=json
  const dutch = pin(51.439542037, 4.922922395);
  const belgian = pin(51.438346371, 4.928257385);
  const surrounding = pin(51.4435, 4.9303);
  assert.equal(dutch.territorialTopology?.administration?.kind, 'counter-enclave');
  assert.equal(dutch.territorialTopology.administration.code, 'NL');
  assert.deepEqual(dutch.regionCandidates, ['NL']);
  assert.equal(belgian.territorialTopology?.administration?.kind, 'enclave');
  assert.equal(belgian.territorialTopology.administration.code, 'BE');
  assert.deepEqual(belgian.regionCandidates, ['BE']);
  assert.equal(surrounding.territorialTopology?.administration, undefined);
  for (const a of [dutch, belgian, surrounding]) assert.equal(a.island, undefined);
  const crossing = assessAgidGeography({kind: 'pin', lat: 51.439542037, lon: 4.922922395,
    method: 'device', accuracyMeters: 500});
  assert.equal(crossing.status, 'needs-confirmation');
  assert.notEqual(crossing.territorialTopology?.status, 'inside');
  assert.deepEqual(crossing.regionCandidates, ['BE', 'NL']);
});

test('landforms and political separation coexist on the same island without assigning surrounding water', () => {
  // UK PCGN's named points for both Malawian exclaves, converted from DMS.
  // https://assets.publishing.service.gov.uk/media/68aee2f02f1856648215588f/Malawi_Toponymic_Factfile.pdf
  for (const [lat, lon] of [[-12.066111111, 34.730555556], [-12.019722222, 34.623611111]]) {
    const a = pin(lat, lon);
    assert.equal(a.territorialTopology?.landform, 'island');
    assert.equal(a.territorialTopology.administration?.code, 'MW');
    assert.ok(a.territorialTopology.administration.neighboringCodes.includes('MZ'));
    assert.deepEqual(a.regionCandidates, ['MW']);
  }
  const lake = pin(-12.04, 34.702);
  assert.equal(lake.territorialTopology?.administration, undefined);
  assert.notEqual(lake.territorialTopology?.landform, 'island');
  assert.equal(lake.island, undefined);

  // All three countries share Borneo. Only Temburong is Brunei's eastern exclave.
  // https://www.bruneitourism.com/wp-content/uploads/2025/03/Brunei-Tourism-Temburong-Brochure-3.pdf
  for (const [lat, lon, owner, isExclave] of [
    [4.56, 115.13, 'BN', true], [4.88, 114.93, 'BN', false],
    [1.55, 110.35, 'MY', false], [-0.48, 117.13, 'ID', false],
  ] as const) {
    const a = pin(lat, lon);
    assert.equal(a.territorialTopology?.landform, 'island');
    assert.deepEqual(a.territorialTopology.sharedIslandCountryCodes, ['BN', 'ID', 'MY']);
    assert.deepEqual(a.island?.countryCodes, [owner]);
    assert.equal(a.territorialTopology.administration?.code, isExclave ? owner : undefined);
    assert.equal(a.deliveryRegion, null);
  }
});

test('the CLI evaluates an existing Llívia cell without rewriting the ID or a recipient selection', async () => {
  const oldId = 'FR02AQQ7CQSW';
  const checked = toAGID16(oldId);
  assert.equal(checked, 'FR02AQQ7CQSW18RG');
  assert.equal(getAGIDCellKey(checked), getAGIDCellKey(oldId));
  const cli = await runAgidCli(['geography', checked, '--json']);
  assert.equal(cli.exitCode, 0, cli.stderr);
  const result = JSON.parse(cli.stdout);
  assert.equal(result.footprint.kind, 'cell');
  assert.equal(result.territorialTopology.administration.code, 'ES');
  assert.deepEqual(result.regionCandidates, ['ES']);
  assert.equal(result.deliveryRegion, null);
  let addressFormatFor = '';
  await resolveAgidLocal({ query: checked, countryCode: 'FR',
    addressFormatResolver: async code => { addressFormatFor = code; return null; } });
  assert.equal(addressFormatFor, 'FR');
});
