#!/usr/bin/env python3
"""Build northern South American border and island extracts (Python 3.11+, GDAL, NumPy, Shapely 2)."""
import argparse
from hashlib import sha256
from importlib import import_module
import json
from math import ceil, floor
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

import numpy as np
from osgeo import gdal, ogr
from shapely import force_2d, from_wkb, union_all
from shapely.geometry import Point, box, shape

# Reuse the existing FieldMaps checksum, GeoJSON serializer and raster polygonizer.
common = import_module('build-northern-central-america-review')
ROOT = Path(__file__).resolve().parents[1]
IBGE_URL = 'https://servicodados.ibge.gov.br/api/v3/malhas/municipios/1304062?formato=application%2Fvnd.geo%2Bjson&qualidade=maxima'
IBGE_SHA = 'f1c59a2b9679e6c9d3ee6a1855c66d93821f1bb6514e1b55f099a965e54e1a71'
CROSSINGS = {
    'leticia-tabatinga': ('Leticia–Tabatinga', [-69.946,-4.230,-69.933,-4.216],
        [('CO',-69.940,-4.220), ('BR',-69.937,-4.227)],
        ['https://www.sema.am.gov.br/wp-content/uploads/2024/04/PMGIRS-TABATINGA-2017-1.pdf', IBGE_URL]),
    'casuarito-orinoco': ('Casuarito / Puerto Ayacucho, Orinoco', [-67.645,5.671,-67.619,5.686],
        [('CO',-67.64209,5.682), ('VE',-67.626,5.683)],
        ['https://www.puertocarreno-vichada.gov.co/MiMunicipio/Paginas/Informacion-del-Municipio.aspx']),
    'albina-maroni': ('Albina / Saint-Laurent-du-Maroni', [-54.060,5.491,-54.030,5.498],
        [('SR',-54.057,5.4965), ('GF',-54.0328,5.494)],
        ['https://www.guyane.gouv.fr/Actions-de-l-Etat/Cooperation/Cooperation-France-Suriname/Franchissement-du-Maroni2']),
    'oiapoque-oyapock': ('Oiapoque / Saint-Georges, Oyapock', [-51.832,3.850,-51.819,3.862],
        [('GF',-51.829,3.860), ('BR',-51.821,3.855)],
        ['https://aplicacao.itamaraty.gov.br/ApiConcordia/Documento/download/6018']),
    'corentyne-ferry': ('Moleson Creek / South Drain, Corentyne', [-57.180,5.745,-57.127,5.785],
        [('GY',-57.172,5.7807), ('SR',-57.135,5.750)],
        ['https://portal.gov.gy/services/SVC-D4C1EE']),
    'santa-rosa-amazon': ('Santa Rosa de Loreto, Amazonas', [-69.970,-4.234,-69.950,-4.214],
        [(None,-69.95922,-4.2226)],
        ['https://consultasenlinea.mincetur.gob.pe/fichaInventario/index.aspx?cod_Ficha=10310',
         'https://cancilleria.gov.co/node/30985', 'https://www.gob.pe/institucion/pcm/noticias/1222890-comunicado']),
    'iles-du-salut': ('Îles du Salut', [-52.596,5.277,-52.576,5.300],
        [('GF',-52.590,5.2877), ('GF',-52.5829,5.2806), ('GF',-52.58292,5.29534)],
        ['https://cnes.fr/geoimage/iles-salut']),
}
PIXELS = {
    'leticia-tabatinga': (
        '08fcf9c37098e44693b05b147dfe1f3a262920cc20fec9a26842287470de5c01',
        '697b5d24fcfb770ab0a131531cac69cb4c8b193323625746e1d89888325438dc'),
    'casuarito-orinoco': (
        '3f29ec85a71a6a3f2cfa69e28c699bd9ed9da36fa6655803c5c3268ed7c9efc4',
        'c4d2a53180d64f2b694772dd25a68500e7541745f81fd5759bb07e1b04224201'),
    'albina-maroni': (
        '83331bd05f22f66ffc0601c707a61e07e6f9abf41f07fe1a9883495bae8ab077',
        '6ed29d445b4b0a1f0968d6d0ed3c2b44def10188a195c52e210312a76e2ba37a'),
    'oiapoque-oyapock': (
        '2728dc47cc12919bbad983742ca15a2ac641bc9fd4aff02add75c5425a03f505',
        '908e12bfb76ecb0d76b79126976476bd669a6a46c67d5903f86f011e4ea980e0'),
    'corentyne-ferry': (
        '6c2ae4b6a378b5dbd4dcd4fd6e34dae6809532eab30ae88ed3375ad4c87ae454',
        'e862a60cb59332123e1fcd5b9c714acc073a6c17ac689ddce448d900cd2e0691'),
    'santa-rosa-amazon': (
        'e5a607395d9fd70136ea56c7678d2ba5e763309700a753db53244ce2a6d9873d',
        'f0817bfa821a5a859061b4080d0eb8929158e3a176c496918c54c95d89b334f6'),
    'iles-du-salut': (
        'b6181d3b44bdc6479e04ae59ab3cc864c19a255a36ff8e938784a13cb20a119b',
        'ebda201d34fe1f0d0085adce1753a7e6b685958638a860a357b0fcdbf0cfc7f2'),
}

IGN_DOC = 'https://geoservices.ign.fr/bdtopo'
IGN_URL = 'https://data.geopf.fr/wfs/ows?' + urlencode({
    'service': 'WFS', 'version': '2.0.0', 'request': 'GetFeature',
    'typeNames': 'BDTOPO_V3:construction_lineaire', 'outputFormat': 'application/json',
    'srsName': 'EPSG:4326', 'CQL_FILTER': "cleabs='CONSLINE0000001371313056'",
})
IGN_SHA = 'b4e9fcf4ee8679b1975e2d04ad2f2dd84198e477af601c0d42d670237b00a86f'


def oyapock_bridge(local):
    raw = local.read_bytes() if local else urlopen(IGN_URL, timeout=40).read()
    feature, = json.loads(raw)['features']
    props = feature['properties']
    # WFS response timestamps change per request. Pin the feature, its survey
    # precision and the original surveyed vertices instead of transport metadata.
    values = [props[k] for k in ('cleabs', 'toponyme', 'etat_de_l_objet', 'precision_planimetrique')]
    payload = json.dumps([*values, feature['geometry']], sort_keys=True, separators=(',', ':')).encode()
    if sha256(payload).hexdigest() != IGN_SHA:
        raise ValueError('Unexpected IGN Oyapock bridge survey edition')
    return force_2d(shape(feature['geometry']))



def land_water(key, bounds, tile_dir):
    # Stagger neither independent vintage. Each retained footprint is an aligned
    # 3 × 3 block of native cells, homogeneous in both 2020 and 2021.
    w,s,e,n = common.padded(bounds)
    tx,ty = floor(w/3)*3, floor(s/3)*3
    if e > tx+3 or n > ty+3:
        raise ValueError('Region requires more than one native raster tile')
    stem = f'{"S" if ty<0 else "N"}{abs(ty):02}W{abs(tx):03}'
    x0,x1 = floor((w-tx)*4000)*3, ceil((e-tx)*4000)*3
    y0,y1 = floor((ty+3-n)*4000)*3, ceil((ty+3-s)*4000)*3
    evidence, dry, wet = [], None, None
    for i,(year, edition) in enumerate([(2020,'v100'),(2021,'v200')]):
        filename = f'ESA_WorldCover_10m_{year}_{edition}_{stem}_Map.tif'
        url = f'https://esa-worldcover.s3.eu-central-1.amazonaws.com/{edition}/{year}/map/{filename}'
        evidence.append(url)
        ds = gdal.Open(str(tile_dir/filename) if tile_dir else '/vsicurl/'+url)
        if ds.GetSpatialRef().GetAuthorityCode(None) != '4326' or not np.allclose(
                ds.GetGeoTransform(), (tx,1/12000,0,ty+3,0,-1/12000), rtol=0, atol=1e-15):
            raise ValueError('Unexpected WorldCover grid')
        data = ds.ReadAsArray(x0,y0,x1-x0,y1-y0)
        digest = sha256(data.tobytes()).hexdigest()
        if digest != PIXELS[key][i]:
            raise ValueError(f'WorldCover input changed: {key}/{year}')
        data = data.reshape((y1-y0)//3,3,(x1-x0)//3,3)
        firm = np.all(np.isin(data,[10,20,30,40,50,60]), axis=(1,3))
        water = np.all(data==80, axis=(1,3))
        dry = firm if dry is None else dry & firm
        wet = water if wet is None else wet & water
    gt = (tx+x0/12000,1/4000,0,ty+3-y0/12000,0,-1/4000)
    return common.raster_mask(dry,gt), common.raster_mask(wet,gt), evidence


def administrative(ds, bounds, code):
    layer = ds.GetLayerByName('adm0_polygons')
    layer.SetAttributeFilter(f"iso_2='{code}'")
    layer.SetSpatialFilterRect(*bounds)
    frame = box(*bounds)
    return union_all([from_wkb(bytes(f.geometry().ExportToWkb())).intersection(frame) for f in layer])


def window(key, spec, ds, ibge, bridge, tile_dir):
    name, bounds, anchors, urls = spec
    dry, wet, tiles = land_water(key,bounds,tile_dir)
    if key == 'oiapoque-oyapock':
        # River and elevated deck share a horizontal position. Within one
        # output-grid spacing of the surveyed deck, do not infer which one a
        # pin represents. This is an uncertainty margin, not a deck outline.
        deck_review = bridge.buffer(1/4000)
        dry = dry.difference(deck_review)
        wet = wet.difference(deck_review)
    frame = box(*common.padded(bounds))
    dry_parts = common.polygons(dry)
    land, owners = [], []
    kept = []
    for i,(code,x,y) in enumerate(anchors):
        pin = Point(x,y)
        component, = (p for p in dry_parts if p.contains(pin))
        component = component.intersection(frame)
        kind = 'island' if key in ('santa-rosa-amazon','iles-du-salut') else 'mainland'
        island_name = ('Île Royale','Île Saint-Joseph','Île du Diable')[i] if key=='iles-du-salut' else name
        if component not in kept:
            kept.append(component)
            land.extend(common.pack(component, kind=kind, **({'name':island_name} if kind=='island' else {})))
        # The two governments give different accounts of the assignment of
        # Santa Rosa. A hydrographic land component does not resolve those accounts.
        if code is None:
            continue
        area = administrative(ds, frame.bounds, code).intersection(component)
        if key == 'leticia-tabatinga':
            area = area.intersection(ibge) if code=='BR' else area.difference(ibge)
        if not area.contains(pin):
            raise ValueError(f'Dry side control fails: {key}/{code}/{x},{y}')
        owners.extend(common.pack(area,code=code,**({'sovereignCode':'FR'} if code=='GF' else {})))
    if key=='iles-du-salut':
        if len(kept)!=3:
            raise ValueError('The three separately named islands must be separate components')
        wet = union_all([p for p in common.polygons(wet) if p.intersects(frame.boundary)])
    if key not in ('leticia-tabatinga','santa-rosa-amazon','iles-du-salut') and len(kept)!=2:
        raise ValueError(f'The sampled mainland banks must be physically distinct: {key}')
    source_version='ESA WorldCover v100 (2020), v200 (2021)'
    credit=common.WC_CREDIT
    evidence=[common.WC_URL,*tiles,*urls]
    if key != 'santa-rosa-amazon':
        source_version+='; FieldMaps USGS/LSIB 2025-07-29'
        credit+=' '+common.FM_CREDIT
        evidence.append(common.FM_URL)
    if key == 'oiapoque-oyapock':
        source_version += '; IGN BD TOPO Pont de l’Oyapock (2024-03-13)'
        credit += ' IGN BD TOPO, modified, Licence Ouverte 2.0.'
        evidence.extend([IGN_DOC, IGN_URL])
    if key=='leticia-tabatinga':
        source_version+='; IBGE malhas API v3, Tabatinga 1304062'
        credit+=' IBGE, Malhas municipais: Tabatinga (Brasil), adapted.'
    return dict(id=key,name=name,bbox=bounds,source='south-america-review+'+key,
                version=source_version,attribution=credit,evidenceUrls=evidence,land=land,
                water=common.pack(wet.intersection(frame),kind='ocean' if key=='iles-du-salut' else 'inland'),
                owners=owners,**({'oceanRegion':'NATL'} if key=='iles-du-salut' else {}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fieldmaps-gpkg',required=True,type=Path)
    parser.add_argument('--tabatinga-geojson',type=Path,help='Optional local copy of the pinned IBGE GeoJSON')
    parser.add_argument('--bridge-geojson',type=Path,help='Optional local copy of the IGN WFS bridge feature')
    parser.add_argument('--worldcover-directory',type=Path)
    parser.add_argument('--output',type=Path,default=ROOT/'src/data/southAmericaNorthReviewed.json')
    args=parser.parse_args()
    gdal.UseExceptions()
    ogr.UseExceptions()
    gdal.SetConfigOption('GDAL_DISABLE_READDIR_ON_OPEN','EMPTY_DIR')
    common.check(args.fieldmaps_gpkg, common.FM_SHA)
    ds=ogr.Open(str(args.fieldmaps_gpkg))
    ibge_bytes=args.tabatinga_geojson.read_bytes() if args.tabatinga_geojson else urlopen(IBGE_URL,timeout=40).read()
    if sha256(ibge_bytes).hexdigest()!=IBGE_SHA:
        raise ValueError('Unexpected Tabatinga municipal boundary edition')
    br=shape(json.loads(ibge_bytes)['features'][0]['geometry'])
    bridge = oyapock_bridge(args.bridge_geojson)
    windows=[window(key,spec,ds,br,bridge,args.worldcover_directory) for key,spec in CROSSINGS.items()]
    args.output.write_text(json.dumps({'windows':windows},ensure_ascii=False,separators=(',',':'))+'\n')


if __name__=='__main__':
    main()
