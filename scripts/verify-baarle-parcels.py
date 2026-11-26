#!/usr/bin/env python3
"""Compare AGID pin results with the 30 official enclaves at Baarle and the Dutch mainland.
Usage: /usr/bin/python3 scripts/verify-baarle-parcels.py path/to/Baarle-Nassau.json
The input is the Netherlands Kadaster GM0744 GeoJSON used by build-territorial-exclaves.py.
Requires Python GDAL with GEOS and the installed project Node dependencies.
"""
import argparse
import json
import random
import subprocess
from pathlib import Path
from osgeo import ogr

ROOT = Path(__file__).resolve().parents[1]


def reference_samples(feature):
    region = ogr.CreateGeometryFromJson(json.dumps(feature['geometry']))
    ordered = sorted(region, key=lambda polygon: polygon.GetArea(), reverse=True)
    mainland, dutch_enclaves = ordered[0], ordered[1:]
    if len(dutch_enclaves) != 8 or mainland.GetGeometryCount() != 23:
        raise ValueError('Expected eight detached components and 22 holes in the main component of GM0744')
    rng = random.Random(20261126)
    samples = []

    def sample(polygon, kind, code, count=100):
        west, east, south, north = polygon.GetEnvelope()
        prepared = polygon.CreatePreparedGeometry()
        border = polygon.Boundary()
        point = ogr.Geometry(ogr.wkbPoint)
        while count:
            x = rng.uniform(west, east)
            y = rng.uniform(south, north)
            point.SetPoint_2D(0, x, y)
            if prepared.Contains(point) and border.Distance(point) > 1e-6:
                samples.append([y, x, kind, code])
                count -= 1

    counter_enclaves = set()
    for ring in list(mainland)[1:]:
        hole = ogr.Geometry(ogr.wkbPolygon)
        hole.AddGeometry(ring)
        belgian_land = hole
        for index, parcel in enumerate(dutch_enclaves):
            if hole.Contains(parcel):
                counter_enclaves.add(index)
                belgian_land = belgian_land.Difference(parcel)
        sample(belgian_land, 'enclave', 'BE')
    if len(counter_enclaves) != 7:
        raise ValueError('Expected seven Dutch counter-enclaves within Belgian territory')
    for index, parcel in enumerate(dutch_enclaves):
        sample(parcel, 'counter-enclave' if index in counter_enclaves else 'enclave', 'NL')
    sample(mainland, None, 'NL', 1000)
    return samples


VERIFY = """
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessAgidGeography} from './src/lib/geographicAssessment.ts';
const samples = JSON.parse(readFileSync(0, 'utf8'));
for (const [lat, lon, expectedKind, expectedCode] of samples) {
  const point = assessAgidGeography({kind: 'pin', lat, lon});
  const where = JSON.stringify({lat, lon, expectedKind, expectedCode});
  assert.deepEqual(point.regionCandidates, [expectedCode], where);
  assert.equal(point.territorialTopology?.administration?.kind ?? null, expectedKind, where);
  assert.notEqual(point.territorialTopology?.landform, 'island', where);
  assert.equal(point.island, undefined, where);
}
console.log('Matched all ' + samples.length + ' interior samples from Kadaster GM0744.');
"""


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('geojson', type=Path)
    args = parser.parse_args()
    ogr.UseExceptions()
    data = json.loads(args.geojson.read_text())
    feature = next(f for f in data.get('features', [data]) if f['properties']['identificatie'] == 'GM0744')
    subprocess.run(['node', '--import', 'tsx', '--input-type=module', '-e', VERIFY], cwd=ROOT,
                   input=json.dumps(reference_samples(feature)), text=True, check=True)
