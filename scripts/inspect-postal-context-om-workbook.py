"""Read-only, standard-library profiler for the reviewed Al Dakhiliyah workbook.

Outputs aggregates, never source rows, coordinates, workbook authors or paths.
This POI workbook has no postcodes and cannot satisfy M2_office_assignment.
"""
import hashlib
import io
import json
import math
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

DIGEST = 'sha256:df8f77f825d3717104b0a707decca9cce3802aa1e99f752ea4fc12990c2e10ef'
HEADERS = ['FID', 'NAMEEN', 'NAMEAR', 'TOWN', 'SOURCEFC', 'SOURCEFC_A', 'X', 'Y']
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
PARTS = {'[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels',
         'xl/workbook.xml', 'xl/sharedStrings.xml', 'xl/theme/theme1.xml',
         'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'docProps/core.xml', 'docProps/app.xml'}


def fail(reason):
    raise ValueError('om-workbook-' + reason)


def digest(data):
    return 'sha256:' + hashlib.sha256(data).hexdigest()


def profile_rows(rows):
    """Constrained schema check; missingness is measured without imputing data."""
    if not isinstance(rows, list) or not 2 <= len(rows) <= 1001 or rows[0] != HEADERS:
        fail('headers-or-row-limit')
    records = rows[1:]
    if any(not isinstance(r, list) or len(r) != 8 for r in records):
        fail('row-width')
    for row in records:
        if type(row[0]) is not int or row[0] < 0:
            fail('fid-type')
        if any(not isinstance(v, str) for v in row[1:6]):
            fail('text-type')
        if not row[1].strip() or row[4] != 'post office' or row[5] != 'مكتب بريد':
            fail('feature-category')
        if any(type(v) not in (float, int) or not math.isfinite(v) for v in row[6:]):
            fail('coordinate-type')
        if not (-180 <= row[6] <= 180 and -90 <= row[7] <= 90):
            fail('coordinate-range')
    ids = [r[0] for r in records]
    if len(set(ids)) != len(ids):
        fail('duplicate-fid')
    coordinates = Counter((r[6], r[7]) for r in records)
    names = Counter(r[1] for r in records)
    return {
        'schema': HEADERS, 'grain': 'source-listed-post-office-category-POI-not-postcode-assignment',
        'rows': len(records), 'uniqueFids': len(set(ids)), 'fidIsPostalCode': False,
        'fidIsStableAcrossEditions': None, 'missingArabicNames': sum(not r[2].strip() for r in records),
        'missingTownLabels': sum(not r[3].strip() for r in records),
        'duplicateEnglishNameGroups': sum(n > 1 for n in names.values()),
        'uniqueCoordinatePairs': len(coordinates), 'duplicateCoordinateGroups': sum(n > 1 for n in coordinates.values()),
        'rowsInDuplicateCoordinateGroups': sum(n for n in coordinates.values() if n > 1),
        'finiteRangeCompatibleXYRows': len(records), 'coordinateRangeIsCrsEvidence': False,
        'sourceCrs': None, 'coordinateAccuracyMetres': None, 'geometriesMaterialized': 0,
        'postalCodeColumnPresent': False, 'postalAssignmentsValidated': 0,
        'addressBuildingRelations': 0, 'nationalCoverageVerified': False,
        'rowsDeduplicated': 0, 'missingLabelsImputed': 0,
        'decodedMatrixDigest': digest(json.dumps(rows, ensure_ascii=False, separators=(',', ':')).encode()),
    }


def inspect_workbook(data):
    if not isinstance(data, bytes) or len(data) != 9827 or digest(data) != DIGEST:
        fail('content-drift')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        entries = archive.infolist()
        if len(entries) != len(PARTS) or {x.filename for x in entries} != PARTS:
            fail('package-parts')
        if sum(x.file_size for x in entries) > 2 * 1024 * 1024 or any(
                x.file_size > 256 * 1024 or x.flag_bits & 1 or x.compress_type not in (0, 8) for x in entries):
            fail('package-limit')

        def xml(name):
            raw = archive.read(name)
            if b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
                fail('xml-entity')
            return ET.fromstring(raw)

        for name in ['_rels/.rels', 'xl/_rels/workbook.xml.rels']:
            if any(x.get('TargetMode') == 'External' for x in xml(name)):
                fail('external-relationship')
        workbook = xml('xl/workbook.xml')
        sheets = workbook.find('s:sheets', NS)
        if len(sheets) != 1 or sheets[0].get('name') != 'مكتب بريد.shp' or sheets[0].get('state', 'visible') != 'visible':
            fail('sheet-identity')
        rels = xml('xl/_rels/workbook.xml.rels')
        sheet_id = sheets[0].get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        if not any(x.get('Id') == sheet_id and x.get('Target') == 'worksheets/sheet1.xml' for x in rels):
            fail('sheet-binding')
        strings = [''.join(x.itertext()) for x in xml('xl/sharedStrings.xml')]
        sheet = xml('xl/worksheets/sheet1.xml')
        if sheet.find('s:dimension', NS).get('ref') != 'A1:H13' or sheet.find('s:mergeCells', NS) is not None:
            fail('sheet-dimensions')
        if sheet.findall('.//s:f', NS) or sheet.findall('.//s:hyperlink', NS):
            fail('formula-or-hyperlink')
        rows = []
        for number, row in enumerate(sheet.find('s:sheetData', NS), 1):
            if row.get('r') != str(number) or row.get('hidden', '0') != '0' or len(row) != 8:
                fail('row-layout')
            result = []
            for col, cell in enumerate(row):
                if cell.get('r') != chr(65 + col) + str(number):
                    fail('cell-position')
                value = cell.find('s:v', NS)
                if value is None or value.text is None:
                    fail('cell-value')
                if cell.get('t') == 's':
                    if not re.fullmatch(r'[0-9]+', value.text) or int(value.text) >= len(strings):
                        fail('string-index')
                    result.append(strings[int(value.text)])
                elif cell.get('t', 'n') == 'n':
                    if not re.fullmatch(r'-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?', value.text):
                        fail('number')
                    result.append(int(value.text) if col == 0 and re.fullmatch(r'\d+', value.text) else float(value.text))
                else:
                    fail('cell-type')
            rows.append(result)
        if len(rows) != 13:
            fail('row-count')
        profile = profile_rows(rows)
        return {'inputDigest': DIGEST, 'inputBytes': len(data), 'sheetCount': 1,
                'sheetName': sheets[0].get('name'), 'range': 'A1:H13',
                'formulaCount': 0, 'externalRelationships': 0,
                'workbookCreated': '2024-05-02T10:11:12Z', 'workbookModified': '2024-05-02T10:11:12Z',
                'fileTimeIsDataValidity': False, **profile, 'countryM2Achieved': False}


if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            fail('usage-one-input-path')
        path = Path(sys.argv[1])
        if path.stat().st_size > 4 * 1024 * 1024:
            fail('byte-limit')
        print(json.dumps(inspect_workbook(path.read_bytes()), ensure_ascii=False, separators=(',', ':')))
    except (ValueError, OSError, zipfile.BadZipFile, ET.ParseError) as error:
        reason = str(error)
        print(json.dumps({'error': reason if re.fullmatch(r'om-workbook-[a-z-]+', reason) else 'om-workbook-invalid-input'}))
        sys.exit(1)
