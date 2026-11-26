#!/usr/bin/env python3
"""Compare the shipping classifier with containment in the six original administrative outlines."""

import argparse
import gzip
import json
import random
import runpy
import subprocess
from pathlib import Path

import shapely
from osgeo import ogr
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[1]
BUILD = runpy.run_path(str(ROOT / "scripts/build-europe-border-surveys.py"))
DATA = BUILD["DATA"]
WINDOWS = BUILD["WINDOWS"]
read_source = BUILD["source_geometries"]


def outlines(args):
    records = json.loads(
        gzip.decompress((DATA / "belgian-cadgis.json.gz").read_bytes())
    )
    belgium = shapely.union_all([shape(r["geometry"]) for r in records])
    ((_, nrw),) = read_source(args.nrw, "dvg1bld_nw.shp", "KN='05000000'")
    yield "vennbahn", ("BE", belgium), ("DE", nrw)

    # Use all Austrian municipalities intersecting the reference frame and the full
    # German state, independently of the shipping extract's named components.
    box = shapely.box(*WINDOWS["jungholz"])
    at = shapely.union_all(
        [
            g
            for _, g in read_source(
                args.tirol, "VGD_Tirol.shp", "ST_KZ='1'", args.at_grid
            )
            if g.intersects(box)
        ]
    )
    ((_, by),) = read_source(
        args.bavaria,
        "ALKIS-Vereinfacht/VerwaltungsEinheit.shp",
        "art='Bundesland' AND ags='09'",
    )
    yield "jungholz", ("AT", at), ("DE", by)

    def country(path):
        return shape(json.loads(path.read_text())["features"][0]["geometry"])

    yield "medjurecje", ("BA", country(args.bosnia)), ("RS", country(args.serbia))


def controls(key, side1, side2, rng):
    w, s, e, n = WINDOWS[key]
    frame = shapely.box(w, s, e, n)
    (code1, raw1), (code2, raw2) = side1, side2
    # Clip the original lines, rather than taking the boundary of clipped land.
    lines = [raw.boundary.intersection(frame) for raw in (raw1, raw2)]
    for raw in (raw1, raw2):
        shapely.prepare(raw)
    for count, near_boundary in [(600, False), (900, True)]:
        produced = 0
        while produced < count:
            if near_boundary:
                line = rng.choice(lines)
                near = line.interpolate(rng.random(), normalized=True)
                scatter = rng.choice([0.000005, 0.00005, 0.0005])
                x = near.x + rng.uniform(-scatter, scatter)
                y = near.y + rng.uniform(-scatter, scatter)
            else:
                x, y = rng.uniform(w, e), rng.uniform(s, n)
            point = shapely.Point(round(x, 8), round(y, 8))
            # Raw and packed vertices may differ by half a 1e-7 degree grid step.
            # Exclude controls within 3e-7 degrees of either original line.
            if not frame.contains(point) or any(
                line.distance(point) < 0.0000003 for line in lines
            ):
                continue
            votes = [
                code1 if raw1.contains(point) else code2,
                code2 if raw2.contains(point) else code1,
            ]
            yield [key, point.y, point.x, sorted(set(votes))]
            produced += 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for field in ("nrw", "bavaria", "tirol", "at-grid", "bosnia", "serbia"):
        parser.add_argument("--" + field, required=True, type=Path)
    args = parser.parse_args()
    ogr.UseExceptions()
    rng = random.Random(20261126)
    samples = [row for key, a, b in outlines(args) for row in controls(key, a, b, rng)]
    runner = """
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {matchEuropeanBorderAdministration as locate} from './src/lib/europeBorderSurveys.ts';
const totals = new Map();
for (const [window, lat, lon, countries] of JSON.parse(readFileSync(0, 'utf8'))) {
  const value = locate(lat, lon);
  assert.deepEqual(value?.codes, countries, [window, lat, lon].join(' '));
  assert.equal(value.disagreement, countries.length === 2);
  const counts = totals.get(window) ?? [0, 0];
  counts[countries.length - 1]++;
  totals.set(window, counts);
}
for (const [name, [one, two]] of totals) console.log(name, one + two, 'matched,', two, 'with both candidates');
"""
    subprocess.run(
        ["node", "--import", "tsx", "--input-type=module", "--eval", runner],
        cwd=ROOT,
        input=json.dumps(samples),
        text=True,
        check=True,
    )


if __name__ == "__main__":
    main()
