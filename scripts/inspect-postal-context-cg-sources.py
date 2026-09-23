"""Offline, digest-bound Republic of the Congo Postal Context source inspector."""
import argparse, hashlib, html, json, re
from pathlib import Path
import pdfplumber

EXPECTED = [
 {"file":"upu-general-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"markers":["Congo (Rep.)","List of countries which do not require postal codes","Universal DataBase (Sep. 2025)"]},
 {"file":"upu-cg-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/cogEn.pdf","bytes":96162,"sha256":"4833c1280840190156fc40d5e85015ef96482a5aefe4fdab4306e2d1b2998463","kind":"pdf","pages":1,"markers":["12, rue Kakamoueka","BRAZZAVILLE","CONGO (REP.)","BP 652","09/2004"]},
 {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93723,"sha256":"17d6537049da926b9846a3327ba12a77da6f3860ca5d05eb3dcaed5a25fb4257","kind":"text","markers":["without permission in writing from the UPU","All rights reserved"]},
 {"file":"sopeco-location.html","url":"https://www.laposte.cg/a-propos/ou-sommes-nous.html","bytes":27890,"sha256":"af0e6ab0bf4ced23ef117f6a281b38f0233fd88c867cd4a5244d2c444313eda8","kind":"text","markers":["68 Boulevard Dénis SASSOU NGUESSO centre ville Brazzaville - Congo","trente-neuf (39) établissements postaux","TOUS DROITS RESERVES"]},
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
  "schemaVersion":"postal-context-cg-source-inspection/v1","countryCode":"CG","receipts":receipts,
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
