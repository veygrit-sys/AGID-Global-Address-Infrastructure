import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packPointResult, type PackHit } from '../../scripts/national-island-supplement';
import { encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';

type LandControl = [place: string, lat: number, lon: number, code: string, form: 'mainland' | 'island'];
type WaterControl = [place: string, lat: number, lon: number, basin: string];
const land: LandControl[] = [
  // SENATUR's Alto Paraná tourism plan gives 25°35′32.1″S 54°35′47.8″W
  // for the Paraguayan landmark. The three independent monuments are on separate banks.
  ['Presidente Franco border monument', -25.59225, -54.59661111, 'PY', 'mainland'],
  ['Puerto Iguazú border monument', -25.59476, -54.59076, 'AR', 'mainland'],
  ['Foz do Iguaçu border monument', -25.590153, -54.590249, 'BR', 'mainland'],
  ['Isla Martín García airfield', -34.18222, -58.24694, 'AR', 'island'],
  ['Isla Timoteo Domínguez', -34.1796294, -58.2557995, 'UY', 'island'],
  ['Tierra del Fuego, Chile', -53.320, -68.6085, 'CL', 'island'],
  ['Tierra del Fuego, Argentina', -53.320, -68.6040, 'AR', 'island'],
  ['Rivera', -30.898, -55.538, 'UY', 'mainland'],
  ['Santana do Livramento', -30.894, -55.533, 'BR', 'mainland'],
  ['Florianópolis, Ilha de Santa Catarina', -27.592, -48.563, 'BR', 'island'],
  ['Florianópolis, mainland bank', -27.590, -48.579, 'BR', 'mainland'],
  ['San Miguel south bank', 0.244, -76.870, 'EC', 'mainland'],
  ['San Miguel north bank', 0.253, -76.869, 'CO', 'mainland'],
  ['Macará north bank', -4.3905, -79.9605, 'EC', 'mainland'],
  ['La Tina south bank', -4.3955, -79.9685, 'PE', 'mainland'],
  ['Zapaleri, Argentina', -22.813, -67.174, 'AR', 'mainland'],
  ['Zapaleri, Bolivia', -22.807, -67.185, 'BO', 'mainland'],
  ['Zapaleri, Chile', -22.820, -67.185, 'CL', 'mainland'],
  ['Galápagos, Santa Cruz', -0.494, -90.284, 'EC', 'island'],
  ['Galápagos, Baltra', -0.476, -90.274, 'EC', 'island'],
  ['Desaguadero west bank', -16.5835, -69.0417, 'PE', 'mainland'],
  ['Desaguadero east bank', -16.5835, -69.031, 'BO', 'mainland'],
  ['Taquile near the village', -15.767, -69.6885, 'PE', 'island'],
  ['Isla del Sol near Yumani', -16.032, -69.153, 'BO', 'island'],
  ['Leticia', -4.220, -69.940, 'CO', 'mainland'],
  ['Tabatinga', -4.227, -69.937, 'BR', 'mainland'],
  // Ferry customs buildings independently georeferenced at Moleson Creek and South Drain.
  ['Moleson Creek', 5.78059, -57.17125, 'GY', 'mainland'],
  ['South Drain', 5.74972, -57.135, 'SR', 'mainland'],
  ['Albina, Maroni', 5.4965, -54.057, 'SR', 'mainland'],
  ['Saint-Laurent-du-Maroni', 5.494, -54.0328, 'GF', 'mainland'],
  ['French Guiana bank, Oyapock', 3.86, -51.829, 'GF', 'mainland'],
  ['Amapá bank, Oiapoque', 3.855, -51.821, 'BR', 'mainland'],
  ['Casuarito on the Orinoco', 5.682, -67.64209, 'CO', 'mainland'],
  ['Puerto Ayacucho bank', 5.683, -67.626, 'VE', 'mainland'],
  // CNES specifies the three islands individually, in Atlantic waters off Kourou.
  ['Île Royale', 5.2877, -52.590, 'GF', 'island'],
  ['Île Saint-Joseph', 5.2806, -52.5829, 'GF', 'island'],
  ['Île du Diable', 5.29534, -52.58292, 'GF', 'island'],
  // Airport reference points from DECEA SBFN and DGAC Chile SCIR.
  ['Fernando de Noronha runway', -3.854722222, -32.428333333, 'BR', 'island'],
  ['Gran Roque, village', 11.948, -66.678, 'VE', 'island'],
  ['Robinson Crusoe runway', -33.66583333, -78.92916667, 'CL', 'island'],
];
const water: WaterControl[] = [
  ['Atlantic off Fernando de Noronha', -3.839, -32.432, 'SATL'],
  ['Pacific off Robinson Crusoe', -33.657, -78.944, 'SEPC'],
  ['Caribbean off Gran Roque', 11.9415, -66.665, 'CARB'],
  ['Río de la Plata east of Martín García', -34.1794167, -58.24175, 'INLAND_WATER'],
  ['Florianópolis channel', -27.590, -48.570, 'SATL'],
  ['Iguaçu and Paraná river confluence', -25.592, -54.593, 'INLAND_WATER'],
  ['San Miguel River', 0.249875, -76.869125, 'INLAND_WATER'],
  ['Desaguadero River', -16.583625, -69.035375, 'INLAND_WATER'],
  ['Lake Titicaca off Taquile', -15.767, -69.709, 'INLAND_WATER'],
  ['Lake Titicaca off Yumani', -16.0350, -69.14108, 'INLAND_WATER'],
  ['Amazon channel at Santa Rosa', -4.220, -69.9505, 'INLAND_WATER'],
  ['Corentyne at the ferry crossing', 5.752, -57.146, 'INLAND_WATER'],
  ['Maroni between mainland banks', 5.495, -54.047, 'INLAND_WATER'],
  ['Oyapock near the international bridge', 3.8538, -51.827, 'INLAND_WATER'],
  ['Orinoco between Casuarito and Puerto Ayacucho', 5.679, -67.635, 'INLAND_WATER'],
  ['Atlantic between Royale and Saint-Joseph', 5.2827, -52.5895, 'NATL'],
  // Galápagos National Park resolution 000081, §10, regulated anchoring water.
  ['Canal de Itabaca anchorage', -0.49166, -90.2903, 'SEPC'],
];

test('surveyed South American mainland and islands return the country at the pin in both formats', () => {
  for (const [place, lat, lon, code, form] of land) {
    for (const encoder of [encodeAGID, encodeAGID16]) {
      const current = encoder(lat, lon);
      assert.equal(current.regionCode, code, place);
      assert.equal(current.prefix, code, place);
      assert.equal(current.isSea, false, place);
    }
    for (const result of [
      assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 3 }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id }),
    ]) {
      assert.equal(result.surface, 'land', place);
      assert.equal(result.status, 'mapped', place);
      assert.deepEqual(result.regionCandidates, [code], place);
      assert.equal(result.territorialTopology?.landform, form, place);
      assert.equal(result.deliveryRegion, null, place);
      assert.ok(result.sources.some(source => source.source.startsWith('south-america-review+')), place);
      if (form === 'island') {
        assert.deepEqual(result.island?.countryCodes, [code], place);
        assert.deepEqual(result.island?.sovereignCodes, [code === 'GF' ? 'FR' : code], place);
      } else {
        assert.equal(result.island, undefined, place);
      }
    }
  }
});

test('surveyed South American rivers, lakes and ocean channels carry the proper water region without an address country', async () => {
  for (const [place, lat, lon, basin] of water) {
    assert.equal(getRegionInfo(lat, lon).prefix, basin, place);
    for (const encoder of [encodeAGID, encodeAGID16]) assert.equal(encoder(lat, lon).isSea, true, place);
    for (const result of [assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id })]) {
      assert.equal(result.surface, 'water', place);
      assert.equal(result.status, 'mapped', place);
      assert.deepEqual(result.regionCandidates, [], place);
      assert.equal(result.island, undefined, place);
      assert.equal(result.territorialTopology, undefined, place);
      assert.equal(result.deliveryRegion, null, place);
    }
    const called: string[] = [];
    await resolveAgidLocal({ coordinates: { lat, lon }, addressFormatResolver: async c => { called.push(c); return null; } });
    assert.deepEqual(called, [], place);
  }
});

test('legacy Paraguay-prefixed IDs for the Argentine border monument retain their cell and resolve to the Argentine address form', async () => {
  const current = encodeAGID16(-25.59476, -54.59076);
  // Issued by 9686a94 before the two adjoining riverbanks were resolved.
  for (const old of ['PY0FWDPWYNBV', 'PY0FWDPWYNBV1TJE']) {
    assert.equal(getAGIDCellKey(old), getAGIDCellKey(current));
    const called: string[] = [];
    const resolved = await resolveAgidLocal({ query: old, addressFormatResolver: async c => { called.push(c); return null; } });
    assert.equal(resolved.agidId, old);
    assert.deepEqual(called, ['AR']);
  }
});

test('a coarse optional pack cannot restore land in the river or an unrelated owner on an offshore island', () => {
  const other: PackHit = { islandId: 'fixture:coarse-neighbour', kind: 'ocean-island', codes: ['PE'],
    source: 'fixture', version: '1', relation: 'inside' };
  for (const raw of [null, other]) {
    const island = packPointResult(-3.854722222, -32.428333333, raw, !raw, true);
    assert.deepEqual(island.island?.countryCodes, ['BR']);
    assert.equal(island.physicalIslandId, undefined);
    const river = packPointResult(-25.592, -54.593, raw, !raw, true);
    assert.equal(river.island, null);
    assert.equal(river.territorialTopology, null);
    assert.equal(river.deliveryRegion, null);
  }
});

test('Falkland Islands / Islas Malvinas keep the registered territorial claim policy', () => {
  const result = assessAgidGeography({ kind: 'pin', lat: -51.694, lon: -57.852 });
  assert.equal(result.island?.status, 'disputed');
  assert.deepEqual(result.island.countryCodes, []);
  assert.deepEqual(result.island.claimantCodes, ['AR', 'GB']);
  assert.deepEqual(result.regionCandidates, []);
  assert.equal(result.deliveryRegion, null);
});

test('Santa Rosa records the physical island while withholding a country on both new pins and historic IDs', async () => {
  // The Peruvian tourism inventory places Santa Rosa here; official Colombian and Peruvian statements
  // disagree over the territorial question. The pre-review issuer returned CO at this location.
  const lat = -4.22260, lon = -69.95922;
  const current = encodeAGID16(lat, lon);
  assert.ok(!['CO', 'PE', 'BR'].includes(current.prefix));
  for (const result of [
    assessAgidGeography({ kind: 'pin', lat, lon }),
    assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 12 }),
    assessAgidGeography({ kind: 'cell', id: 'CO0F8CS9CMW310W7' }),
  ]) {
    assert.equal(result.surface, 'land');
    assert.equal(result.status, 'needs-confirmation');
    assert.deepEqual(result.regionCandidates, []);
    assert.equal(result.territorialTopology?.landform, 'island');
    assert.equal(result.territorialTopology.sharedIslandCountryCodes, undefined);
    assert.deepEqual(result.island?.countryCodes, []);
    assert.equal(result.deliveryRegion, null);
  }
  for (const id of ['CO0F8CS9CMW3', 'CO0F8CS9CMW310W7']) {
    assert.equal(getAGIDCellKey(id), getAGIDCellKey(current));
    const called: string[] = [];
    await resolveAgidLocal({ query: id, addressFormatResolver: async c => { called.push(c); return null; } });
    assert.deepEqual(called, []);
  }
});

test('marshes and disagreements at a river crossing or lake shore carry no inferred country', () => {
  for (const [place, lat, lon] of [
    // IGN's surveyed bridge deck: altitude is not part of the pin, so the road and
    // the river directly under the deck cannot be distinguished.
    ['International bridge over the Oyapock', 3.85633737, -51.82537976],
    ['Corentyne marsh by the South Drain ferry crossing', 5.75, -57.1329],
    ['Gran Roque airfield shore with mixed coastal pixels', 11.94583333, -66.6716667],
    ['Gran Roque runway edge in disagreement between satellite editions', 11.946917, -66.668333],
    ['Macará channel at the bridge', -4.392694, -79.964306],
    ['Disagreement between the historic lake shore and satellite evidence at Taquile', -15.767375, -69.697667],
  ] as const) {
    const pin = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(pin.surface, 'unknown', place);
    assert.equal(pin.status, 'needs-confirmation', place);
    assert.deepEqual(pin.regionCandidates, [], place);
    assert.equal(pin.island, undefined, place);
  }
});

test('the mapped Zapaleri tripoint retains all three countries without issuing any as certain', () => {
  const lat = -22.813797, lon = -67.180700;
  for (const result of [assessAgidGeography({ kind: 'pin', lat, lon }),
    assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 20 }),
    assessAgidGeography({ kind: 'cell', id: encodeAGID16(lat, lon).id })]) {
    assert.equal(result.surface, 'land');
    assert.equal(result.status, 'needs-confirmation');
    assert.deepEqual(result.regionCandidates, ['AR', 'BO', 'CL']);
    assert.equal(result.deliveryRegion, null);
  }
  assert.ok(!['AR', 'BO', 'CL'].includes(encodeAGID16(lat, lon).prefix));
});

test('differing country outlines at Leticia leave the pin open while GPS can reach both confirmed territories', () => {
  const lat = -4.22250, lon = -69.94000;
  for (const [radius, expected] of [[0, []], [5, []], [12, ['BR', 'CO']]] as const) {
    const result = assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: radius });
    assert.equal(result.surface, 'land');
    assert.equal(result.status, 'needs-confirmation');
    assert.deepEqual(result.regionCandidates, expected);
    assert.equal(result.deliveryRegion, null);
  }
});

test('a GPS circle at the Paraná and Iguaçu confluence gains possible address countries only as it reaches each dry bank', () => {
  const lat = -25.592, lon = -54.593;
  for (const [radius, expected] of [
    [160, []], [250, ['BR']], [285, ['AR', 'BR']], [300, ['AR', 'BR', 'PY']],
  ] as const) {
    const result = assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: radius });
    assert.deepEqual(result.regionCandidates, expected);
    assert.equal(result.surface, expected.length ? 'unknown' : 'water');
    assert.equal(result.status, expected.length ? 'needs-confirmation' : 'mapped');
    assert.equal(result.deliveryRegion, null);
  }
});

test('a shared physical island can have a single confirmed country, a dry border or uncertain ownership at the pin', () => {
  for (const [lat, lon, whole, local] of [
    [-53.320, -68.6085, ['AR', 'CL'], ['CL']],
    [-53.320, -68.6040, ['AR', 'CL'], ['AR']],
    // The digital IGN boundary runs through Isla Grande, far from the shore.
    [-53.320, -68.6064965887324, ['AR', 'CL'], ['AR', 'CL']],
    [-34.18222, -58.24694, ['AR', 'UY'], ['AR']],
    [-34.1796294, -58.2557995, ['AR', 'UY'], ['UY']],
    // IGN and FieldMaps differ at this dry point on the joined Martín García / Timoteo landmass.
    [-34.1759589, -58.2536087, ['AR', 'UY'], []],
  ] as const) {
    const result = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(result.surface, 'land');
    assert.deepEqual(result.regionCandidates, local);
    assert.deepEqual(result.territorialTopology?.sharedIslandCountryCodes, whole);
    assert.deepEqual(result.island?.countryCodes, local.length === 1 ? local : []);
    assert.equal(result.status, local.length === 1 ? 'mapped' : 'needs-confirmation');
    assert.equal(result.deliveryRegion, null);
    const pack = packPointResult(lat, lon, null, true, true);
    assert.deepEqual(pack.island?.countryCodes, local.length === 1 ? local : []);
    assert.deepEqual(pack.territorialTopology?.sharedIslandCountryCodes, whole);
    assert.equal(pack.deliveryRegion, null);
  }
});

test('within Tierra del Fuego, whole-island countries and GPS candidates remain independent', () => {
  const pos = { kind: 'pin', method: 'device', lat: -53.32, lon: -68.60620 } as const;
  for (const [radius, candidates] of [[10, ['AR']], [30, ['AR', 'CL']]] as const) {
    const result = assessAgidGeography({ ...pos, accuracyMeters: radius });
    assert.equal(result.surface, 'land');
    assert.deepEqual(result.regionCandidates, candidates);
    assert.deepEqual(result.territorialTopology?.sharedIslandCountryCodes, ['AR', 'CL']);
    assert.equal(result.status, candidates.length === 1 ? 'mapped' : 'needs-confirmation');
  }
});

test('conflicting land borders at Rivera’s international plaza leave the address country unresolved', () => {
  const result = assessAgidGeography({ kind: 'pin', lat: -30.896215, lon: -55.535302 });
  assert.equal(result.surface, 'land');
  assert.equal(result.status, 'needs-confirmation');
  assert.deepEqual(result.regionCandidates, []);
  assert.equal(result.territorialTopology?.landform, 'mainland');
  assert.equal(result.deliveryRegion, null);
});
