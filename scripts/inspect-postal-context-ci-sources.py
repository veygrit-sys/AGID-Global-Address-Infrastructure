"""Offline, digest-bound Cote d'Ivoire Postal Context source inspector."""
import argparse, hashlib, html, json, re
from pathlib import Path
import pdfplumber

EXPECTED = [
 {"file":"upu-general-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"markers":["Côte d'Ivoire","List of countries which do not require postal codes","Universal DataBase (Sep. 2025)"]},
 {"file":"upu-ci-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/civEn.pdf","bytes":93472,"sha256":"af6e2a87af21af3143102ec66f68d8356287934219357f07b7ae626dd0c437ff","kind":"pdf","pages":1,"markers":["Deliveries are made to P.O. Boxes","two-digit post office code","The code 104 therefore indicates a home delivery made by post office 04","06 B.P. 37 ABIDJAN 06","17 B.P. 105 ABIDJAN 17","09/2004"]},
 {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93715,"sha256":"01b39486ebb71de49ffb79e7cce3a652cbf2929d2f0de4cf4f425557d69e2d83","kind":"text","markers":["without permission in writing from the UPU","All rights reserved"]},
]

def digest(body): return hashlib.sha256(body).hexdigest()
def normalized(value): return re.sub(r"\s+", " ", html.unescape(value)).strip()

def inspect_source_dir(source_dir, expected=EXPECTED):
 root=Path(source_dir)
 missing=[item["file"] for item in expected if not (root/item["file"]).is_file()]
 if missing: raise ValueError(f"source-set-mismatch missing={missing}")
 receipts=[]
 for item in expected:
  path=root/item["file"]; body=path.read_bytes()
  if len(body)!=item["bytes"] or digest(body)!=item["sha256"]:
   raise ValueError(f"source-changed-review-required:{item['file']}")
  pages=None
  if item["kind"]=="pdf":
   with pdfplumber.open(path) as pdf:
    pages=len(pdf.pages); text=normalized("\n".join((page.extract_text() or "") for page in pdf.pages))
   if pages!=item["pages"]: raise ValueError(f"pdf-page-count:{item['file']}")
  else:
   text=normalized(body.decode("utf-8"))
  for marker in item.get("markers",[]):
   if normalized(marker) not in text:
    raise ValueError(f"missing-content-marker:{item['file']}:{marker}")
  receipts.append({"file":item["file"],"url":item["url"],"bytes":len(body),"sha256":item["sha256"],"pages":pages,"class":"official-reference"})
 if expected is not EXPECTED:
  return {"exactBodiesByteAndSha256Bound":len(receipts),"productionEligibleRecords":0}
 return {
  "schemaVersion":"postal-context-ci-source-inspection/v1","countryCode":"CI","receipts":receipts,
  "officialReferenceBodies":len(receipts),"exactBodiesByteAndSha256Bound":len(receipts),
  "officialReferenceBytes":sum(receipt["bytes"] for receipt in receipts),
  "currentPostalCodeFormat":"none","postcodeDataCreationTarget":False,
  "officialPostalGeometryRecords":0,"productionEligibleRecords":0,
  "modelOrOssCandidatesIngested":False,"rawSourceRowsEmitted":0,
 }

if __name__=="__main__":
 parser=argparse.ArgumentParser(); parser.add_argument("--source-dir",required=True)
 args=parser.parse_args()
 print(json.dumps(inspect_source_dir(args.source_dir),ensure_ascii=False,indent=2))
