"""Offline, digest-bound Central African Republic Postal Context source inspector."""
import argparse, hashlib, html, json, re
from pathlib import Path
import pdfplumber

EXPECTED = [
 {"file":"upu-general-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"markers":["Central African Rep.","List of countries which do not require postal codes","Universal DataBase (Sep. 2025)"]},
 {"file":"upu-cf-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/cafEn.pdf","bytes":110173,"sha256":"05c2b88912802d3beca5af348396da9a890101313ee9f091cde857af4380c631","kind":"pdf","pages":1,"markers":["BP 729","BP 655","BANGUI","03/2022"]},
 {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93711,"sha256":"8752543eaf7be88d3652429cd74253b597a8d44fa91e223b739c2fdebbaf801c","kind":"text","markers":["without permission in writing from the UPU","All rights reserved"]},
 {"file":"arcep-postal.html","url":"https://www.arcep.cf/page.php?slug=postes","bytes":10419,"sha256":"585011949a64f2a61629cb19b22dce7bd0cac237eadee58796097366dcd15cdd","kind":"text","markers":["Services postaux non réservés","B.P. 1046 Bangui","Tous droits réservés"]},
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
  "schemaVersion":"postal-context-cf-source-inspection/v1","countryCode":"CF","receipts":receipts,
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
