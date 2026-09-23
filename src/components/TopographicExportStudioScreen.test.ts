import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { AGID_SYNTHETIC_TOPO_SOURCE } from '../lib/topographicExport';
import {
  TopographicExportStudioScreen,
  isStudioSupportedLocalGeoTiffSourceCrs,
} from './TopographicExportStudioScreen';
import { TopographicExploreMap } from './TopographicExploreMap';

test('Studio accepts exactly the GeoTIFF source CRSs implemented by the local decoder', () => {
  for (const horizontalCrs of [
    'EPSG:4326',
    'EPSG:4269',
    'EPSG:3857',
    'EPSG:32601',
    'EPSG:32618',
    'EPSG:32660',
    'EPSG:32701',
    'EPSG:32760',
    'EPSG:26901',
    'EPSG:26918',
    'EPSG:26923',
  ]) {
    assert.equal(isStudioSupportedLocalGeoTiffSourceCrs(horizontalCrs), true);
  }

  for (const horizontalCrs of [
    undefined,
    'EPSG:32600',
    'EPSG:32661',
    'EPSG:32700',
    'EPSG:32761',
    'EPSG:26900',
    'EPSG:26924',
    'EPSG:32618 ',
  ]) {
    assert.equal(isStudioSupportedLocalGeoTiffSourceCrs(horizontalCrs), false);
  }
});

test('topographic export studio exposes the selection, evidence, layer, and output surfaces', () => {
  const html = renderToStaticMarkup(React.createElement(TopographicExportStudioScreen));

  assert.match(html, /Topographic Export Studio/);
  assert.match(html, /Selection/);
  assert.match(html, /Evidence mode/);
  assert.match(html, /SYNTHETIC TIN FIXTURE/);
  assert.match(html, /interactive 3D terrain preview/);
  assert.match(html, />Explore</);
  assert.match(html, /ENU horizontal/);
  assert.match(html, /relative source height/);
  assert.match(html, /DXF/);
  assert.match(html, /IFC/);
  assert.match(html, /GLTF/);
  assert.match(html, /TIFF/);
  assert.match(html, /Coastal 3D bundle/);
  assert.match(html, /Generate GLTF \+ evidence/);
  assert.match(html, /3 sources/);
  assert.match(html, /Source-backed records/);
  assert.match(html, /No source-backed records connected/);
  assert.match(html, /Local evidenced GeoTIFF/);
  assert.match(html, /Import ledger/);
  assert.match(html, /Choose TIFF/);
  assert.match(html, /Mask8/);
  assert.match(html, /0 invalid, 255 valid/);
  assert.match(html, /Browser only/);
  assert.match(html, /LOD error cap \(m\)/);
  assert.match(html, /50/);
});

test('local Explore Map exposes an explicit, bounded map-to-selection control', () => {
  const html = renderToStaticMarkup(React.createElement(TopographicExploreMap, {
    bounds: {
      south: 0,
      west: 0,
      north: 0.01,
      east: 0.01,
    },
    maximumAreaKm2: 50,
    sourceCount: 0,
    sourceBacked: false,
    status: 'ready',
    onBoundsChange: () => {},
  }));

  assert.match(html, /EXPLORE/);
  assert.match(html, /Use view/);
  assert.match(html, /9 local grid cells/);
  assert.match(html, /HDG 000/);
  assert.match(html, /topographic-explore-reticle/);
  assert.match(html, /Rotate map clockwise by 15 degrees/);
  assert.match(html, /Reset map orientation to north/);
  assert.match(html, /local-geojson/);
});

test('topographic export studio lists only explicitly connected source-backed records', () => {
  const source = {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId: 'studio-source-evidence-test',
    product: 'Studio evidenced source fixture',
    version: 'fixture-2026-07-27',
    freshUntil: '2030-01-01T00:00:00.000Z',
    syntheticOnly: false,
    snapshotEvidence: {
      contentSha256: `sha256:${'a'.repeat(64)}` as const,
      adapterVersion: 'studio-source-adapter-v1',
      verifiedAt: '2026-07-27T09:00:00.000Z',
      horizontalCrs: 'EPSG:3857',
      verticalDatum: 'not-applicable: vector fixture',
    },
  };
  const html = renderToStaticMarkup(
    React.createElement(TopographicExportStudioScreen, {
      sourceBackedRecords: [source],
    }),
  );

  assert.match(html, /Studio evidenced source fixture/);
  assert.match(html, /1\/1 selected/);
  assert.match(html, /Evidence ready/);
  assert.match(html, /Local evidenced GeoTIFF/);
  assert.match(html, /EPSG:3857/);
  assert.doesNotMatch(html, /No source-backed records connected/);
});
