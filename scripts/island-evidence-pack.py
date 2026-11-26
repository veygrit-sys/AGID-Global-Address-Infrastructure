#!/usr/bin/env python3
"""Build or query a local, full-resolution physical and ADM0 island evidence pack.

Requires Python 3.11+ with GDAL/OGR and SQLite RTree. The query subcommand
emits internal cartographic evidence. Use query-island-pack.ts for public policy.
"""
import argparse
from collections import Counter
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import sqlite3
import tempfile
import urllib.request
import zipfile
import zlib

from osgeo import ogr

FORMAT = 'agid-island-evidence-v1'
GSHHG = ('https://www.soest.hawaii.edu/pwessel/gshhg/gshhg-shp-2.3.7.zip',
         '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41')
FIELDMAPS = ('https://data.fieldmaps.io/adm0/usgs/intl/adm0_polygons.gpkg.zip',
             'c7648c4ae781f87fdc316bae3d3a271c44d51f4ffd2379fba97207ea9bf2b360')
GPKG_SHA = '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'
SOURCE = 'gshhg-full+fieldmaps-usgs-lsib'
VERSION = '2.3.7+2025-07-29'

# Stable GSHHG 2.3.7 IDs verified against the complete source. Antarctica uses
# the grounding-line outline (level 6), so its alternate ice front is excluded.
MAINLAND_IDS = {'0', '1', '2', '3', '5', '6'}


def checked_file(path, digest):
    with path.open('rb') as f:
        if hashlib.file_digest(f, 'sha256').hexdigest() != digest:
            raise ValueError(f'Unexpected SHA-256 for {path}')


def get_archive(provided, source, tmpdir, filename):
    url, digest = source
    path = provided or tmpdir / filename
    if not provided:
        with urllib.request.urlopen(url, timeout=150) as response, path.open('wb') as dst:
            shutil.copyfileobj(response, dst)
    checked_file(path, digest)
    return path


def initialize(db):
    db.executescript("""
    CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE source_files (name TEXT PRIMARY KEY, contents BLOB NOT NULL);
    CREATE TABLE coast (id INTEGER PRIMARY KEY, level INTEGER, physical_id TEXT, wkb BLOB);
    CREATE TABLE region (id INTEGER PRIMARY KEY, code TEXT, sovereign TEXT, disputed INTEGER);
    CREATE TABLE administrative (id INTEGER PRIMARY KEY, region_id INTEGER, wkb BLOB);
    CREATE VIRTUAL TABLE coast_box USING rtree(id, west, east, south, north);
    CREATE VIRTUAL TABLE administrative_box USING rtree(id, west, east, south, north);
    """)


def add_geometry(db, table, geom, attrs):
    packed = zlib.compress(geom.ExportToWkb(), level=1)
    params = [None, *attrs, packed]
    key = db.execute(f"INSERT INTO {table} VALUES ({','.join('?' for _ in params)})", params).lastrowid
    db.execute(f'INSERT INTO {table}_box VALUES (?,?,?,?,?)', [key, *geom.GetEnvelope()])


def write_coast(db, archive, tmpdir):
    physical = set()
    fragments = Counter()
    with zipfile.ZipFile(archive) as files:
        for name in ['LICENSE.TXT', 'COPYING.LESSERv3', 'README.TXT']:
            db.execute('INSERT INTO source_files VALUES (?,?)', ('gshhg/' + name, files.read(name)))
        for level in [1, 2, 3, 4, 6]:
            stem = f'GSHHS_shp/f/GSHHS_f_L{level}'
            for ext in ['shp', 'shx', 'dbf', 'prj']:
                files.extract(stem + '.' + ext, tmpdir)
            source = ogr.Open(str(tmpdir / (stem + '.shp')))
            for feature in source.GetLayer():
                gid = feature['id'].split('-', 1)[0]
                if gid in MAINLAND_IDS and level in (1, 6):
                    continue
                if level in (1, 3, 6):
                    physical.add((level, gid))
                add_geometry(db, 'coast', feature.geometry(), (level, gid))
                fragments[level] += 1
            source = None
    return dict(oceanIslandIds=sum(level in (1, 6) for level, _ in physical),
                lakeIslandIds=sum(level == 3 for level, _ in physical),
                sourceGeometryFragmentsByLevel=dict(sorted(fragments.items())))


def write_regions(db, gpkg):
    checked_file(gpkg, GPKG_SHA)
    raw = sqlite3.connect(f'{gpkg.as_uri()}?mode=ro', uri=True)
    mapping = dict(raw.execute('SELECT iso_3,iso_2 FROM adm0_polygons WHERE iso_2 IS NOT NULL'))
    raw.close()
    source = ogr.Open(str(gpkg))
    unit_count = polygon_count = 0
    for feature in source.GetLayerByName('adm0_polygons'):
        code, status, note = feature['iso_2'], feature['status_nm'], feature['wld_notes'] or ''
        # These are ADM0 regional attributes. A group code can describe an
        # international cartographic worldview rather than title to territory.
        disputed = status in ('Joint sovereignty', 'Sovereignty unsettled', 'Occupied Palestinian Territory')
        disputed |= 'dispute' in note.lower() or 'sovereignty' in note.lower() or code == 'TW'
        group = mapping.get(feature['iso_3_grp']) if status in ('State', 'Territory/Self-governing territory') and not disputed else None
        key = db.execute('INSERT INTO region VALUES (NULL,?,?,?)', (code, group, disputed)).lastrowid
        for polygon in feature.geometry():
            add_geometry(db, 'administrative', polygon, (key,))
            polygon_count += 1
        unit_count += 1
    return dict(administrativeUnits=unit_count, administrativeComponents=polygon_count,
                alpha2Regions=len(set(mapping.values())))


def build(args):
    out = args.pack.resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    # Publish only a complete pack. Failed or concurrent builds cannot leave a partial index.
    with tempfile.TemporaryDirectory(dir=out.parent) as work:
        tmp = Path(work)
        coast = get_archive(args.gshhg_archive, GSHHG, tmp, 'coast.zip')
        if args.fieldmaps_gpkg:
            gpkg = args.fieldmaps_gpkg.resolve()
        else:
            archive = get_archive(args.fieldmaps_archive, FIELDMAPS, tmp, 'admin.zip')
            with zipfile.ZipFile(archive) as zipf:
                zipf.extract('adm0_polygons.gpkg', tmp)
            gpkg = tmp / 'adm0_polygons.gpkg'
        db = sqlite3.connect(tmp / 'building.sqlite')
        try:
            db.execute('PRAGMA journal_mode=OFF')
            initialize(db)
            counts = write_coast(db, coast, tmp)
            counts.update(write_regions(db, gpkg))
            manifest = dict(format=FORMAT, source=SOURCE, version=VERSION, counts=counts,
                            gshhgArchive=dict(url=GSHHG[0], sha256=GSHHG[1], license='LGPL-3.0-or-later'),
                            fieldmapsArchive=dict(url=FIELDMAPS[0], sha256=FIELDMAPS[1], gpkgSha256=GPKG_SHA,
                                                  license='Public domain (USGS shoreline edition)'))
            db.execute('INSERT INTO metadata VALUES (?,?)', ('manifest', json.dumps(manifest, sort_keys=True)))
            db.commit()
        finally:
            db.close()
        os.replace(tmp / 'building.sqlite', out)
    return manifest


def exact_hits(db, table, lat, lon):
    # Shapefile and GeoPackage store both planar halves of cut features at 180 degrees.
    point = ogr.Geometry(ogr.wkbPoint)
    longitudes = [-180, 180] if abs(lon) == 180 else [lon]
    hits = []
    for x in longitudes:
        point.SetPoint_2D(0, x, lat)
        sql = f"""SELECT g.* FROM {table}_box AS b JOIN {table} AS g ON b.id=g.id
                  WHERE b.west<=? AND b.east>=? AND b.south<=? AND b.north>=?"""
        for row in db.execute(sql, (x, x, lat, lat)):
            g = ogr.CreateGeometryFromWkb(zlib.decompress(row[-1]))
            if g.Intersects(point):
                hits.append((row[0], *row[1:-1], not g.Contains(point)))
    return hits


def geometry_evidence(db, lat, lon):
    coast = exact_hits(db, 'coast', lat, lon)
    # Within source hierarchy a lake overrides its enclosing land, an island
    # inside that lake overrides the lake, and an interior pond overrides that island.
    for water, land in [(4, 3), (2, 1)]:
        if any(l == water and not edge for _, l, _, edge in coast):
            return None
        hits = [(gid, edge) for _, l, gid, edge in coast if l == land or (land == 1 and l == 6)]
        if hits:
            physical_ids = sorted({gid for gid, _ in hits})
            boundary = all(edge for _, edge in hits) or any(l == water for _, l, _, _ in coast)
            return ('lake-island' if land == 3 else 'ocean-island'), physical_ids, boundary
    return None


def isolated_admin_component(db, lat, lon, hits):
    # A small source land polygon is independently identifiable as an island when
    # every other polygon stays clear of its entire exterior. This can recover a
    # finer USGS shoreline absent from GSHHG, without borrowing the nearest region.
    if len(hits) != 1 or abs(lon) == 180:
        return None
    key = hits[0][0]
    west, east, south, north = db.execute(
        'SELECT west,east,south,north FROM administrative_box WHERE id=?', (key,)).fetchone()
    if east - west >= 2 or north - south >= 2 or west <= -179.999 or east >= 179.999:
        return None
    gap = 0.001  # Degree-sized exclusion guard for noisy inter-country source edges.
    neighbors = db.execute(
        'SELECT id FROM administrative_box WHERE west<=? AND east>=? AND south<=? AND north>=? AND id<>? LIMIT 65',
        (east + gap, west - gap, north + gap, south - gap, key)).fetchall()
    # Large or crowded geometries defer to GSHHG. Do not assume that a truncated
    # list proves disjointness. This cap keeps the optional disk lookup bounded.
    if len(neighbors) > 64:
        return None
    def geometry(fid):
        row = db.execute('SELECT wkb FROM administrative WHERE id=?', (fid,)).fetchone()
        return ogr.CreateGeometryFromWkb(zlib.decompress(row[0]))
    if neighbors:
        component = geometry(key)
        for (neighbor,) in neighbors:
            if component.Distance(geometry(neighbor)) <= gap:
                return None
    return 'shoreline-island', [str(key)], hits[0][-1]


def query(db, lat, lon):
    if not math.isfinite(lat) or not -90 <= lat <= 90 or not math.isfinite(lon) or not -180 <= lon <= 180:
        raise ValueError('Expected latitude in [-90,90] and longitude in [-180,180]')
    physical = geometry_evidence(db, lat, lon)
    if not physical:
        # No supplemental assignment inside a positively mapped lake or pond.
        if any(level in (2, 4) for _, level, _, _ in exact_hits(db, 'coast', lat, lon)):
            return None
    admhits = exact_hits(db, 'administrative', lat, lon)
    if not physical:
        physical = isolated_admin_component(db, lat, lon, admhits)
    if not physical:
        return None
    kind, ids, boundary = physical
    regions, sovereigns = set(), set()
    disputed = False
    for _, region_id, _ in admhits:
        code, sovereign, flag = db.execute('SELECT code,sovereign,disputed FROM region WHERE id=?', (region_id,)).fetchone()
        if code:
            regions.add(code)
        if sovereign:
            sovereigns.add(sovereign)
        disputed |= bool(flag)
    if abs(lon) == 180 and (boundary or any(edge for _, _, edge in admhits)):
        # A cut is artificial only where the same physical polygon and the
        # same admin evidence continue on both sides. Genuine shoreline stays a boundary.
        probes = [geometry_evidence(db, lat, x) for x in (-179.99999999, 179.99999999)]
        if all(p and p == (kind, ids, False) for p in probes):
            boundary = False
        memberships = [{key for _, key, edge in exact_hits(db, 'administrative', lat, x) if not edge}
                       for x in (-179.99999999, 179.99999999)]
        admin_edge = bool(admhits) and not all(m and m == {key for _, key, _ in admhits} for m in memberships)
    else:
        admin_edge = bool(admhits) and all(edge for _, _, edge in admhits)
    extra = kind == 'shoreline-island'
    return dict(source='fieldmaps-usgs-lsib' if extra else SOURCE, version='2025-07-29' if extra else VERSION,
                kind=kind, islandId=('fieldmaps-20250729:' if extra else 'gshhg:') + ','.join(ids),
                codes=sorted(regions), sovereignCodes=sorted(sovereigns),
                relation='boundary' if boundary or admin_edge or len(regions) > 1 else 'inside', disputed=disputed)


def main():
    ogr.UseExceptions()
    cli = argparse.ArgumentParser(description=__doc__)
    sub = cli.add_subparsers(dest='action', required=True)
    builder = sub.add_parser('build')
    builder.add_argument('pack', type=Path)
    builder.add_argument('--gshhg-archive', type=Path)
    region = builder.add_mutually_exclusive_group()
    region.add_argument('--fieldmaps-gpkg', type=Path)
    region.add_argument('--fieldmaps-archive', type=Path)
    q = sub.add_parser('query')
    q.add_argument('pack', type=Path)
    q.add_argument('lat', type=float)
    q.add_argument('lon', type=float)
    args = cli.parse_args()
    if args.action == 'build':
        result = build(args)
    else:
        with sqlite3.connect(f'{args.pack.resolve().as_uri()}?mode=ro', uri=True) as db:
            row = db.execute("SELECT value FROM metadata WHERE key='manifest'").fetchone()
            if not row or json.loads(row[0])['format'] != FORMAT:
                raise ValueError('Incompatible island pack')
            result = query(db, args.lat, args.lon)
    print(json.dumps(result, sort_keys=True))


if __name__ == '__main__':
    main()
