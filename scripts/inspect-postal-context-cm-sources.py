"""Offline, digest-bound Cameroon Postal Context source inspector."""
import argparse, hashlib, html, json, re
from pathlib import Path
import pdfplumber

EXPECTED = [
 {"file":"upu-general.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"markers":["Cameroon","List of countries which do not require postal codes","Universal DataBase (Sep. 2025)"]},
 {"file":"upu-cmr-en.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/cmrEn.pdf","bytes":81891,"sha256":"695ccd31e39fea82cf54422c593ebe6135e0fba47f1e3d5abe3f823389595ddc","kind":"pdf","pages":1,"markers":["Cameroon","BP 6000","YAOUNDE","07/2002"]},
 {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93725,"sha256":"205287d901481387b0ab036b086f65e1b4a9268c55a2fe61b39a0452c2bddc76","kind":"html","markers":["without permission in writing from the UPU","All rights reserved"]},
 {"file":"minpostel-operators.html","url":"https://www.minpostel.gov.cm/index.php/en/actualites/475-reseaux-postaux-les-42-operateurs-prives-agrees","bytes":64175,"sha256":"ec8766bbac82c4acb09f1549a0ddcd444f34c509b141e6c3415cf2a92feeb444","kind":"html","markers":["01 March 2024","Les 42 opérateurs privés agréés","En plus de la Campost, opérateur public"]},
 {"file":"minesup-address-example.html","url":"https://www.minesup.gov.cm/index.php/centre/institut-superieur-technologique/","bytes":67243,"sha256":"bd6c07461e06bbce11a58fb682022b898e91405a94716ce358694ad1f4d780e8","kind":"html","markers":["Adresse postale","54190","1739 Yaoundé-Cameroun","Tous droits réservés"]},
]

def digest(body): return hashlib.sha256(body).hexdigest()
def normalized(value): return re.sub(r"\s+", " ", html.unescape(value)).strip()
def visible_html(value):
 value=re.sub(r"<script\b.*?</script>", " ", value, flags=re.I|re.S)
 value=re.sub(r"<style\b.*?</style>", " ", value, flags=re.I|re.S)
 return normalized(re.sub(r"<[^>]+>", " ", value))

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
  elif item["kind"]=="html":
   text=visible_html(body.decode("utf-8"))
  else:
   text=normalized(body.decode("utf-8"))
  for marker in item.get("markers",[]):
   if normalized(marker) not in text:
    raise ValueError(f"missing-content-marker:{item['file']}:{marker}")
  receipts.append({"file":item["file"],"url":item["url"],"bytes":len(body),"sha256":item["sha256"],"pages":pages,"class":"official-reference"})
 if expected is not EXPECTED:
  return {"exactBodiesByteAndSha256Bound":len(receipts),"productionEligibleRecords":0}
 return {
  "schemaVersion":"postal-context-cm-source-inspection/v1","countryCode":"CM","receipts":receipts,
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
