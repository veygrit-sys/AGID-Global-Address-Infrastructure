import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGID_SYNTHETIC_TOPO_SOURCE,
  MAX_TOPOGRAPHIC_EXPORT_AREA_KM2,
  TOPOGRAPHIC_FORMAT_DEFINITIONS,
  buildTopographicExportPlan,
  calculateTopographicAreaKm2,
  createSyntheticTopographicDataset,
  longitudeSpanDegrees,
  type TopographicExportFormat,
  type TopographicLayerId,
  type TopographicSourceRecord,
} from './topographicExport';
import { serializeTopographicExport } from './topographicExportSerializers';

const bounds = {
  south: 35,
  west: 139,
  north: 35.02,
  east: 139.02,
};

function planFor(format: TopographicExportFormat, layerIds: TopographicLayerId[]) {
  return buildTopographicExportPlan({
    bounds,
    countryCode: 'JP',
    crs: 'EPSG:4326',
    format,
    layerIds,
    sourceRecords: [AGID_SYNTHETIC_TOPO_SOURCE],
    dataMode: 'synthetic',
    contourIntervalMeters: 5,
    terrainResolutionMeters: 20,
    now: '2026-07-26T01:00:00.000Z',
  });
}

test('topographic selection area is spherical, antimeridian-safe, and capped at 50 km2', () => {
  assert.ok(calculateTopographicAreaKm2(bounds) > 3);
  assert.ok(calculateTopographicAreaKm2(bounds) < MAX_TOPOGRAPHIC_EXPORT_AREA_KM2);
  assert.ok(Math.abs(
    longitudeSpanDegrees({ south: -0.01, west: 179.99, north: 0.01, east: -179.99 }) - 0.02,
  ) < 1e-10);

  const oversized = buildTopographicExportPlan({
    bounds: { south: 0, west: 0, north: 0.1, east: 0.1 },
    crs: 'EPSG:4326',
    format: 'svg',
    layerIds: ['buildings'],
    sourceRecords: [AGID_SYNTHETIC_TOPO_SOURCE],
    dataMode: 'synthetic',
    now: '2026-07-26T01:00:00.000Z',
  });

  assert.equal(oversized.status, 'blocked');
  assert.ok(oversized.issues.some(issue => issue.code === 'area-limit-exceeded'));
});

test('source-backed export requires approved, versioned, reusable, in-scope evidence', () => {
  const pendingSource: TopographicSourceRecord = {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId: 'official-candidate',
    syntheticOnly: false,
    reuseStatus: 'pending',
    coverage: {
      scope: 'country',
      countryCodes: ['JP'],
      description: 'Synthetic metadata test.',
    },
  };
  const plan = buildTopographicExportPlan({
    bounds,
    countryCode: 'JP',
    crs: 'EPSG:6677',
    format: 'dxf',
    layerIds: ['buildings'],
    sourceRecords: [pendingSource],
    dataMode: 'source-backed',
    now: '2026-07-26T01:00:00.000Z',
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.issues.some(issue => issue.code === 'source-reuse-pending'));
  assert.ok(plan.issues.some(issue => issue.code === 'source-missing-snapshot-evidence'));
  assert.equal(plan.sourceByLayer.buildings, pendingSource.sourceId);
});

test('format/layer matrix blocks representations that would silently lose a layer', () => {
  const plan = planFor('stl', ['roads']);
  assert.equal(plan.status, 'blocked');
  assert.ok(plan.issues.some(issue => issue.code === 'format-layer-incompatible'));
});

test('all ten advertised export formats produce deterministic local conformance artifacts', () => {
  const dataset = createSyntheticTopographicDataset(bounds);
  const cases: Array<{
    format: TopographicExportFormat;
    layers: TopographicLayerId[];
    verify: (data: string | Uint8Array) => void;
  }> = [
    { format: 'dxf', layers: ['buildings', 'terrain-mesh'], verify: data => assert.match(String(data), /SECTION[\s\S]*3DFACE/) },
    { format: 'pdf', layers: ['buildings', 'roads'], verify: data => assert.ok(String(data).startsWith('%PDF-1.4')) },
    { format: 'svg', layers: ['buildings', 'roads'], verify: data => assert.match(String(data), /<svg[\s\S]*data-layer="roads"/) },
    { format: 'ifc', layers: ['terrain-mesh'], verify: data => assert.match(String(data), /IFCTRIANGULATEDFACESET/) },
    { format: 'obj', layers: ['terrain-mesh', 'roads'], verify: data => assert.match(String(data), /\nv [^\n]+[\s\S]*\nf /) },
    { format: 'gltf', layers: ['terrain-mesh', 'roads'], verify: data => assert.equal(JSON.parse(String(data)).asset.version, '2.0') },
    { format: 'stl', layers: ['terrain-mesh'], verify: data => assert.match(String(data), /^solid AGID_Topographic_Export/) },
    { format: 'geojson', layers: ['buildings', 'roads'], verify: data => assert.equal(JSON.parse(String(data)).type, 'FeatureCollection') },
    {
      format: 'tiff',
      layers: ['satellite-imagery'],
      verify: data => {
        assert.ok(data instanceof Uint8Array);
        assert.deepEqual([...data.slice(0, 4)], [0x49, 0x49, 0x2a, 0x00]);
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const ifdOffset = view.getUint32(4, true);
        const entryCount = view.getUint16(ifdOffset, true);
        const tags = Array.from({ length: entryCount }, (_, index) => (
          view.getUint16(ifdOffset + 2 + index * 12, true)
        ));
        assert.ok(tags.includes(33550));
        assert.ok(tags.includes(33922));
        assert.ok(tags.includes(34735));
      },
    },
    { format: 'txt', layers: ['contour-lines', 'terrain-mesh'], verify: data => assert.match(String(data), /FEATURE[\s\S]*MESH/) },
  ];

  for (const fixture of cases) {
    const plan = planFor(fixture.format, fixture.layers);
    assert.equal(plan.status, 'ready', `${fixture.format}: ${JSON.stringify(plan.issues)}`);
    const output = serializeTopographicExport(dataset, plan);
    assert.ok(output.byteLength > 100, fixture.format);
    fixture.verify(output.data);
  }

  assert.equal(TOPOGRAPHIC_FORMAT_DEFINITIONS.length, 10);
});

test('synthetic fixtures are explicitly non-authoritative and contain no recipient/address payload', () => {
  const dataset = createSyntheticTopographicDataset(bounds);
  const serialized = JSON.stringify(dataset);
  assert.equal(dataset.synthetic, true);
  assert.doesNotMatch(serialized, /recipient|address_line|house_number|private_key|proof_secret/i);
  assert.ok(dataset.features.every(feature => feature.properties.synthetic === true));
});

test('serializer rejects unplanned sources and raw-address or recipient properties', () => {
  const plan = planFor('geojson', ['buildings']);
  const dataset = createSyntheticTopographicDataset(bounds);
  const building = dataset.features.find(feature => feature.layerId === 'buildings')!;

  assert.throws(
    () => serializeTopographicExport({
      ...dataset,
      features: [{ ...building, sourceId: 'unreviewed-source' }],
    }, plan),
    /dataset-source-not-in-plan/,
  );

  assert.throws(
    () => serializeTopographicExport({
      ...dataset,
      features: [{ ...building, properties: { recipient: 'synthetic person' } }],
    }, plan),
    /prohibited-topographic-property/,
  );
});
