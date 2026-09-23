"""Fail-closed inspection of exact Saint Lucia Postal Context M2 source bodies."""
import argparse, hashlib, html, json, re
from pathlib import Path
from typing import Any
import pdfplumber

EXPECTED_SOURCES = [
  {
    "file": "gazette-2015-12-21.pdf",
    "url": "https://npc.govt.lc/files/documents/gazettes/2015/12/Gazette_December_21_2015.pdf",
    "bytes": 2792865,
    "sha256": "caddf197d5f523ac333ef9a35d2b1b6312ef455c80587248f3c4a7c5385c60cb",
    "pages": 20,
    "reviewPages": [
      13,
      14
    ],
    "kind": "pdf",
    "page_markers": {
      "12": [
        "implementation of postcodes for Saint Lucia took effect on 1 December 2015",
        "not physical addresses",
        "all delivery points in Saint Lucia"
      ],
      "13": [
        "Address Format where Delivery Point is a post office",
        "Address format where Delivery Point is a private letter box",
        "Address Format where Delivery point is home delivery",
        "LC04 113"
      ]
    }
  },
  {
    "file": "govt-postal-efficiency.html",
    "url": "https://www.govt.lc/news/postal-codes-improve-efficiency",
    "bytes": 67690,
    "sha256": "cf4ba4686478853ad11fe3ba42246b9b3c87dcb049265cb7a9b735afe0c32d76",
    "kind": "html",
    "markers": [
      "postal code is an identifier for a postal delivery point",
      "single mailbox or other physical address",
      "private letter box",
      "residential or business address"
    ]
  },
  {
    "file": "govt-postal-services.html",
    "url": "https://www.govt.lc/ministries/infrastructure-port-services-and-transport/postal-services",
    "bytes": 94636,
    "sha256": "697f2d6452f237d2725c6b9cb282921f5b4a33a71b9099495d5dbdc6e3573859",
    "kind": "html",
    "markers": [
      "Postal Services"
    ]
  },
  {
    "file": "govt-zip-codes.html",
    "url": "https://www.govt.lc/news/zip-codes-for-saint-lucia",
    "bytes": 330260,
    "sha256": "c98a1b3f0734db1133441e05aec45f15a86f0aed8bdbc0fe6e612cc8fdfb08e7",
    "kind": "html",
    "markers": [
      "ZIP CODES FOR SAINT LUCIA",
      "Saint Lucia Postal Service",
      "General Post Office",
      "LC04 101"
    ]
  },
  {
    "file": "upu-copyright.html",
    "url": "https://www.upu.int/en/Copyright",
    "bytes": 93717,
    "sha256": "1bed3f37f437d1fc7da876f2eec548a5f6aba847d48e32a18e372851f0a3c737",
    "kind": "html",
    "markers": [
      "All rights reserved",
      "Access to databases of the UPU",
      "not to duplicate the document"
    ]
  },
  {
    "file": "upu-cpu-saint-lucia.html",
    "url": "https://www.upu.int/en/Universal-Postal-Union/About-UPU/Restricted-Unions/CPU?cid=248&csid=8",
    "bytes": 143103,
    "sha256": "aad19e4664153140dd5f866a74dc4f9dacaca80083e3a61da434979230566b19",
    "kind": "html",
    "markers": [
      "Saint Lucia Postal Service",
      "LC04 101"
    ]
  },
  {
    "file": "upu-lca-addressing.pdf",
    "url": "https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/lcaEn.pdf",
    "bytes": 254394,
    "sha256": "856ad28ef6bdb4f5596912ee5f10812a06a75d1f509467dd7a06889cf8abc8f0",
    "pages": 2,
    "edition": "07/2019",
    "kind": "pdf",
    "page_markers": {
      "0": [
        "code has seven (7) characters",
        "separated by a double space",
        "LC05 201",
        "LC04 101",
        "LC10 101",
        "LC03 201"
      ]
    }
  }
]
EXPECTED_ASSIGNMENT_COUNT = 54
EXPECTED_ASSIGNMENT_DIGEST = '6290137003896daaa343ec5ca38486f52ac8e04fa3ccffab7f4bab321df3228c'

def digest(body: bytes) -> str: return hashlib.sha256(body).hexdigest()
def clean_html(value: str) -> str: return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', value))).strip()
def canonical_codes(value: str) -> list[str]: return sorted({'LC'+m.group(1)+'  '+m.group(2) for m in re.finditer(r'LC\s*(\d{2})\s*(\d{3})', value, re.I)})
def code_digest(codes: list[str]) -> str: return digest(('\n'.join(codes)+'\n').encode())

def inspect_source_dir(source_dir: str | Path, expected: list[dict[str, Any]] = EXPECTED_SOURCES) -> dict[str, Any]:
    root=Path(source_dir); observed={p.name for p in root.iterdir() if p.is_file()}; expected_names={x['file'] for x in expected}
    if observed != expected_names: raise ValueError(f'source-set-mismatch expected={sorted(expected_names)} observed={sorted(observed)}')
    receipts=[]; govt_codes=[]; gazette_codes=[]; upu_rights=False
    for item in expected:
        body=(root/item['file']).read_bytes()
        if len(body)!=item['bytes'] or digest(body)!=item['sha256']: raise ValueError(f"source-changed-review-required:{item['file']}")
        receipt={k:item[k] for k in ['file','url','bytes','sha256']}
        if item['kind']=='pdf':
            if not body.startswith(b'%PDF-'): raise ValueError(f"invalid-pdf:{item['file']}")
            with pdfplumber.open(root/item['file']) as pdf:
                if len(pdf.pages)!=item['pages']: raise ValueError(f"pdf-page-count-changed:{item['file']}")
                page_texts=[]
                for i,page in enumerate(pdf.pages): page_texts.append(' '.join((page.extract_text() or '').split()))
                for page_number,markers in item.get('page_markers',{}).items():
                    for marker in markers:
                        if marker.casefold() not in page_texts[int(page_number)].casefold(): raise ValueError(f"missing-pdf-marker:{item['file']}:{marker}")
                if item['file']=='gazette-2015-12-21.pdf': gazette_codes=canonical_codes(' '.join(page_texts[12:14]))
            receipt['pages']=item['pages']
        else:
            cleaned=clean_html(body.decode('utf-8'))
            for marker in item.get('markers',[]):
                if marker.casefold() not in cleaned.casefold(): raise ValueError(f"missing-html-marker:{item['file']}:{marker}")
            if item['file']=='govt-zip-codes.html': govt_codes=canonical_codes(cleaned)
            if item['file']=='upu-copyright.html': upu_rights=True
        receipts.append(receipt)
    if len(govt_codes)!=EXPECTED_ASSIGNMENT_COUNT or code_digest(govt_codes)!=EXPECTED_ASSIGNMENT_DIGEST: raise ValueError('government-assignment-list-changed-review-required')
    if 'LC04  113' not in gazette_codes: raise ValueError('gazette-home-delivery-example-missing')
    if sorted(set(gazette_codes)-{'LC04  113'}) != govt_codes: raise ValueError('gazette-table-government-list-reconciliation-changed')
    return {'schemaVersion':'postal-context-lc-source-inspection/v1','countryCode':'LC','exactBodies':receipts,'exactBodiesByteAndSha256Bound':len(receipts),'exactOfficialBodiesBytes':sum(x['bytes'] for x in receipts),'currentPostcodeFormat':'LCNN  NNN','officialDoubleSpace':True,'upuAddressingSheetEdition':'07/2019','gazetteEffectiveDate':'2015-12-01','datedDeliveryPointAssignments':len(govt_codes),'datedAssignmentCodeSetSha256':code_digest(govt_codes),'gazetteHomeDeliveryExampleExcludedFromAssignmentTable':'LC04  113','deliveryPointCanBeMailboxOfficePrivateBoxResidentialOrBusiness':True,'currentCompleteAssignmentAliasValidityCorrectionExceptionAndExplicitNonAreaDenominatorEstablished':False,'upuCopyrightAndDatabaseRestrictionsRecorded':upu_rights,'compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished':False,'officialPostalGeometryRecords':0,'derivedOrVirtualPostalGeometryRecords':0,'productionEligibleRecords':0,'rawSourceRowsEmitted':0}

def main():
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument('--source-dir',required=True); args=parser.parse_args(); print(json.dumps(inspect_source_dir(args.source_dir),ensure_ascii=False,indent=2))
if __name__=='__main__': main()
