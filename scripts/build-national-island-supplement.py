#!/usr/bin/env python3
"""Prove whole GSHHG features lie strictly inside a national cartographic land layer.

Generate the missing-sample register with audit-island-evidence-pack.py --gap-register.
Arguments: FULL_PACK GAP_REGISTER STATCAN_ZIP MLIT_ZIP OUTPUT.
"""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import sqlite3
import tempfile
import zipfile
from collections import defaultdict

from osgeo import ogr, osr

SOURCES = [
    dict(code='CA', sovereignCode='CA', source='statcan-cbf-pr', version='2021',
         url='https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/boundary-limites/files-fichiers/lpr_000b21a_e.zip',
         sha256='d28bbb15d7b49e3d1828755a5f1b4ebcee699ad70efe8b0f1b902d29ebffd20b',
         sourcePage='https://www150.statcan.gc.ca/n1/pub/92-160-g/92-160-g2021002-eng.htm',
         license='Statistics Canada Open Licence',
         stem='lpr_000b21a_e', attribution='Adapted from Statistics Canada, 2021 Census Boundary Files (provinces/territories, cartographic). This does not constitute an endorsement by Statistics Canada of this product.'),
    dict(code='JP', sovereignCode='JP', source='mlit-n03-national', version='N03-20260101',
         url='https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2026/N03-20260101_GML.zip',
         sha256='1f714fca019e22e6f84012dba420384fc7b49c6ad8bd0a867ab1cfb593a78477',
         sourcePage='https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html', license='CC BY 4.0',
         stem='N03-20260101_prefecture', attribution='国土数値情報（行政区域データ・2026年）（国土交通省）を加工して作成'),
]
PADDING = 0.0001  # WGS84 degrees, in addition to SQLite RTree's outward-rounded bbox.


def box(w, e, s, n):
    ring = ogr.Geometry(ogr.wkbLinearRing)
    for x, y in ((w, s), (w, n), (e, n), (e, s), (w, s)):
        ring.AddPoint_2D(x, y)
    poly = ogr.Geometry(ogr.wkbPolygon)
    poly.AddGeometry(ring)
    return poly


def search(db, archive, meta):
    with archive.open('rb') as source:
        if hashlib.file_digest(source, 'sha256').hexdigest() != meta['sha256']:
            raise ValueError(f'Unexpected archive {archive}')
    verified = set()
    with tempfile.TemporaryDirectory() as tmp, zipfile.ZipFile(archive) as zipf:
        for ext in ['shp', 'shx', 'dbf', 'prj']:
            zipf.extract(meta['stem'] + '.' + ext, tmp)
        ds = ogr.Open(str(Path(tmp) / (meta['stem'] + '.shp')))
        layer = ds.GetLayer()
        src = layer.GetSpatialRef().Clone()
        dst = osr.SpatialReference()
        dst.ImportFromEPSG(4326)
        for crs in (src, dst):
            crs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
        tx = osr.CoordinateTransformation(src, dst)
        for feature in layer:
            geom = feature.geometry().Clone()
            geom.Transform(tx)
            parts = list(geom) if geom.GetGeometryName() == 'MULTIPOLYGON' else [geom]
            for poly in parts:
                w, e, s, n = poly.GetEnvelope()
                matches = db.execute('SELECT id,w, e, s, n FROM eligible WHERE w>=? AND e<=? AND s>=? AND n<=?',
                                     (w, e, s, n)).fetchall()
                if not matches or not poly.IsValid():
                    continue
                prepared = poly.CreatePreparedGeometry()
                border = poly.Boundary()
                edge = border.CreatePreparedGeometry()
                for fid, west, east, south, north in matches:
                    if fid in verified:
                        continue
                    # Full padded rectangle (all vertices and all interpolated edges/holes
                    # of this GSHHG fragment) must fit strictly inside a single official
                    # land polygon. A border contact, including a hole, cannot qualify.
                    rect = box(west - PADDING, east + PADDING, south - PADDING, north + PADDING)
                    if prepared.Contains(rect) and not edge.Intersects(rect):
                        verified.add(fid)
    return verified


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ('pack', 'gap_register', 'statcan', 'mlit', 'output'):
        parser.add_argument(arg, type=Path)
    args = parser.parse_args()
    ogr.UseExceptions()
    with zipfile.ZipFile(args.gap_register) as archive:
        with archive.open('island_source_gaps.csv') as raw:
            ids = {int(row['gshhg_2_3_7_physical_id']) for row in csv.DictReader(io.TextIOWrapper(raw))
                   if row['source_review_status'] == 'noAdministrativeCodeAtSample'}
    digest = hashlib.sha256('\n'.join(map(str, sorted(ids))).encode()).hexdigest()
    if digest != '77049d1e5adac575b644b8a8f507b8a3e6122665a6550e2ccf48c1add5d7bc4c':
        raise ValueError('Use the pinned edition and its complete original audit register')
    db = sqlite3.connect(f'{args.pack.resolve().as_uri()}?mode=ro', uri=True)
    manifest = json.loads(db.execute("SELECT value FROM metadata WHERE key='manifest'").fetchone()[0])
    if (manifest['source'] != 'gshhg-full+fieldmaps-usgs-lsib'
            or manifest['version'] != '2.3.7+2025-07-29'
            or manifest['gshhgArchive']['sha256'] != '8dbbe7e071e77e9e75f2d639239099ebca8d5c16d6a07df8169729d49f15cf41'
            or manifest['fieldmapsArchive']['sha256'] != 'c7648c4ae781f87fdc316bae3d3a271c44d51f4ffd2379fba97207ea9bf2b360'
            or manifest['fieldmapsArchive']['gpkgSha256'] != '516b48a7c522de4ef8a65007971b417b27b1179264e5372889d4103f1645b9a9'):
        raise ValueError('Incompatible physical or administrative source version')
    db.execute('CREATE VIRTUAL TABLE temp.eligible USING rtree(id,w, e, s, n)')
    fragments = defaultdict(set)
    rows = db.execute('SELECT c.physical_id,b.* FROM coast c JOIN coast_box b ON c.id=b.id WHERE c.level IN (1,3,6)')
    for gid, fid, w, e, s, n in rows:
        key = int(gid)
        if key in ids:
            fragments[key].add(fid)
            db.execute('INSERT INTO temp.eligible VALUES(?,?,?,?,?)', (fid, w, e, s, n))
    sources = []
    for archive, source in zip((args.statcan, args.mlit), SOURCES):
        hits = search(db, archive, source)
        approved = sorted(gid for gid, fids in fragments.items() if fids <= hits)
        print(source['code'], len(approved), flush=True)
        sources.append({**{k: v for k, v in source.items() if k != 'stem'}, 'gshhgIds': approved})
    if set(sources[0]['gshhgIds']).intersection(sources[1]['gshhgIds']):
        raise ValueError('Conflicting national evidence for the same island ID')
    db.close()
    args.output.write_text(json.dumps(dict(physicalVersion='2.3.7', bboxPaddingDegrees=PADDING,
                           sourceSampleGapCount=len(ids), sources=sources), ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
