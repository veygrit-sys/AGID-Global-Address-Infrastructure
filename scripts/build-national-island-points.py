#!/usr/bin/env python3
"""Build point-specific Canadian and Japanese land evidence for the pinned island pack."""
import argparse
import csv
import gzip
import hashlib
import io
import json
from collections import defaultdict
from functools import lru_cache
from pathlib import Path
import sqlite3
import zipfile
import zlib

from osgeo import gdal, ogr, osr
import shapely
from shapely import clip_by_rect, from_wkb, prepare, set_precision
from shapely.errors import GEOSException
from shapely.geometry import Point

ROOT = Path(__file__).resolve().parents[1]
SCALE = 10_000_000
SHARDS = 16
INSET = .000002
SIMPLIFY = .000001
GAP_ID_SHA = '77049d1e5adac575b644b8a8f507b8a3e6122665a6550e2ccf48c1add5d7bc4c'
PINS = {
    'gshhgArchive': '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41',
    'fieldmapsArchive': 'c7648c4ae781f87fdc316bae3d3a271c44d51f4ffd2379fba97207ea9bf2b360',
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_samples(path):
    with zipfile.ZipFile(path) as archive, archive.open('island_source_gaps.csv') as raw:
        samples = {int(row['gshhg_2_3_7_physical_id']):
                   Point(float(row['representative_longitude']), float(row['representative_latitude']))
                   for row in csv.DictReader(io.TextIOWrapper(raw, encoding='utf-8'))
                   if row['source_review_status'] == 'noAdministrativeCodeAtSample'}
    if digest('\n'.join(map(str, sorted(samples))).encode()) != GAP_ID_SHA:
        raise ValueError('Unexpected source gap register')
    return samples


def index_pack(db, ids):
    manifest = json.loads(db.execute("SELECT value FROM metadata WHERE key='manifest'").fetchone()[0])
    if (manifest['format'] != 'agid-island-evidence-v1' or manifest['source'] != 'gshhg-full+fieldmaps-usgs-lsib'
            or manifest['version'] != '2.3.7+2025-07-29'
            or any(manifest[key]['sha256'] != pin for key, pin in PINS.items())
            or manifest['fieldmapsArchive']['gpkgSha256'] != '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'):
        raise ValueError('Use the original full-resolution GSHHG and FieldMaps editions')
    db.execute('CREATE VIRTUAL TABLE temp.eligible USING rtree(id,w,e,s,n)')
    groups = {}
    for gid, fid, w, e, s, n in db.execute(
            'SELECT c.physical_id,b.* FROM coast c JOIN coast_box b ON c.id=b.id WHERE c.level IN (1,3,6)'):
        if int(gid) in ids:
            groups[fid] = int(gid)
            db.execute('INSERT INTO temp.eligible VALUES(?,?,?,?,?)', (fid, w, e, s, n))
    return groups


def polygons(geom):
    if geom.is_empty:
        return
    if geom.geom_type == 'Polygon':
        yield geom
    elif geom.geom_type in ('MultiPolygon', 'GeometryCollection'):
        for child in geom.geoms:
            yield from polygons(child)


def interior_pieces(area, island):
    if not island.is_valid or not area.intersects(island):
        return
    w, s, e, n = island.bounds
    # Clip the large administrative feature for speed. Every final quantized
    # polygon is checked against BOTH original, unreduced geometries.
    clipped = clip_by_rect(area, w - 1e-7, s - 1e-7, e + 1e-7, n + 1e-7)
    if not clipped.is_valid or clipped.is_empty:
        return
    for part in polygons(clipped.intersection(island)):
        reduced = part.buffer(-INSET).simplify(SIMPLIFY, preserve_topology=True)
        for candidate in polygons(set_precision(reduced, 1 / SCALE)):
            if part.contains_properly(candidate) and area.contains_properly(candidate) and island.contains_properly(candidate):
                yield candidate


def collect(archive, stem, source, db, groups):
    with archive.open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != source['sha256']:
            raise ValueError(f"Unexpected {source['code']} source archive")
    ds = ogr.Open(f'/vsizip/{archive.resolve()}/{stem}.shp')
    layer = ds.GetLayer()
    src = layer.GetSpatialRef().Clone()
    dst = osr.SpatialReference()
    dst.ImportFromEPSG(4326)
    for crs in (src, dst):
        crs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    tx = osr.CoordinateTransformation(src, dst)
    @lru_cache(maxsize=256)
    def geometry(fid):
        blob, = db.execute('SELECT wkb FROM coast WHERE id=?', (fid,)).fetchone()
        island = from_wkb(zlib.decompress(blob))
        prepare(island)
        return island
    result = defaultdict(list)
    for feature in layer:
        geo = feature.geometry().Clone()
        if geo.Transform(tx) != ogr.OGRERR_NONE:
            raise ValueError('Source coordinate transform failed')
        for poly in (geo if geo.GetGeometryName() == 'MULTIPOLYGON' else [geo]):
            w, e, s, n = poly.GetEnvelope()
            matches = db.execute('SELECT id FROM eligible WHERE w<=? AND e>=? AND s<=? AND n>=? ORDER BY id',
                                 (e, w, n, s)).fetchall()
            if not matches:
                continue
            area = from_wkb(bytes(poly.ExportToWkb()))
            if not area.is_valid:
                continue
            prepare(area)
            for fid, in matches:
                try:
                    pieces = list(interior_pieces(area, geometry(fid)))
                except GEOSException:
                    continue
                if pieces:
                    result[groups[fid]].extend(pieces)
    return result


def delta_ring(ring):
    # First coordinate absolute; the following integer pairs are XY deltas.
    # The reader closes the ring by repeating the first coordinate.
    values = []
    x = y = 0
    for lon, lat in list(ring.coords)[:-1]:
        nx, ny = round(lon * SCALE), round(lat * SCALE)
        values.extend((nx-x, ny-y))
        x, y = nx, ny
    return values


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ('pack', 'gap_register', 'statcan_zip', 'mlit_zip', 'output_dir'):
        parser.add_argument(arg, type=Path)
    args = parser.parse_args()
    ogr.UseExceptions()
    samples = read_samples(args.gap_register)
    source_data = json.loads((ROOT / 'src/data/nationalIslandSupplement.json').read_text())
    whole = {i for source in source_data['sources'] for i in source['gshhgIds']}
    db = sqlite3.connect(f'{args.pack.resolve().as_uri()}?mode=ro', uri=True)
    groups = index_pack(db, samples.keys() - whole)
    shards = [{} for _ in range(SHARDS)]
    counts = {}
    seen = set()
    for path, stem, source in zip((args.statcan_zip, args.mlit_zip),
                                  ('lpr_000b21a_e', 'N03-20260101_prefecture'), source_data['sources'], strict=True):
        matches = collect(path, stem, source, db, groups)
        if seen.intersection(matches):
            raise ValueError('Conflicting national sources')
        seen.update(matches)
        sample_hits = 0
        for gid, pieces in sorted(matches.items()):
            sample_hits += any(piece.contains(samples[gid]) for piece in pieces)
            packed = [[delta_ring(ring) for ring in (p.exterior, *p.interiors)] for p in pieces]
            shards[gid % SHARDS][str(gid)] = [source['code'], packed]
        counts[source['code']] = dict(idsWithPartialEvidence=len(matches), strictHitsAtOriginalGapSample=sample_hits)
        print(source['code'], counts[source['code']], flush=True)
    db.close()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for n, shard in enumerate(shards):
        compressed = gzip.compress(json.dumps(shard, sort_keys=True, separators=(',', ':')).encode(), mtime=0)
        name = f'part-{n:02}.json.gz'
        (args.output_dir / name).write_bytes(compressed)
        files.append(dict(file=name, sha256=digest(compressed), compressedBytes=len(compressed)))
    manifest = dict(physicalVersion='2.3.7', packVersion='2.3.7+2025-07-29', shardCount=SHARDS,
                    scale=SCALE, insetDegrees=INSET, simplificationDegrees=SIMPLIFY, sourceGapIdSha256=GAP_ID_SHA,
                    wholeIdsExcluded=len(whole), sources=[{k:v for k,v in source.items() if k!='gshhgIds'}
                    for source in source_data['sources']], gdal=gdal.VersionInfo('RELEASE_NAME'),
                    shapely=shapely.__version__, geos=shapely.geos_version_string, counts=counts, shards=files)
    (args.output_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
