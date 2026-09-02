"""Offline, digest-bound DR Congo Postal Context source inspector."""
import argparse, hashlib, html, json, re
from pathlib import Path
import pdfplumber

EXPECTED = [
 {"file":"upu-cd-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/codEn.pdf","bytes":340432,"sha256":"e66cfd3ae8589b582a3d79750cc43f9282d2d759c7ff5c6bb0a843dc83586c20","kind":"pdf","pages":2,"markers":["7 digits to the leftt of the locality name.","1004131 KINSHASA","3202011 KWILU","09/2022"]},
 {"file":"upu-general-addressing.pdf","url":"https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf","bytes":631050,"sha256":"ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d","kind":"pdf","pages":12,"markers":["Universal DataBase (Sep. 2025)","Congo (Rep.)"]},
 {"file":"upu-copyright.html","url":"https://www.upu.int/en/Copyright","bytes":93703,"sha256":"fa5257623cccbc31aa4711bf83c43ee81c71c1821931a6d02eac3026477f11a9","kind":"text","markers":["without permission in writing from the UPU","All rights reserved"]},
 {"file":"scpt-codepostal.html","url":"https://www.codepostal.cd/","bytes":14418,"sha256":"ddf676be06a75c5e0f78f1a36b902a9f89d75daa8db9fc8482f7854b71ff7326","kind":"text","markers":["Annuaire des codes postaux congolais","Tous droits réservés"]},
 {"file":"codepostal-main.04f07b39.chunk.js","url":"https://www.codepostal.cd/static/js/main.04f07b39.chunk.js","bytes":18042,"sha256":"126aeaf6d3b7a5163922d9d2c737185a6ff82449b6acf276b78940dfc6a813b7","kind":"text","markers":["https://codepostal.cd/backend/public","/api/address/list-by-postal-code","/api/address/search-by-postal-code"]},
 {"file":"codepostal-2.9f097844.chunk.js","url":"https://www.codepostal.cd/static/js/2.9f097844.chunk.js","bytes":160574,"sha256":"ac43d0e8b113b319b09109da407c3d2ba1e45f89685bf91f2873752baaafca84","kind":"text","markers":[]},
 {"file":"search-limete.json","url":"https://codepostal.cd/backend/public/api/address/search-by-city?city=Limete&state=Kinshasa","bytes":2354,"sha256":"46319b99db517f8f6353980d438fa9e880e90bb822f6f4a1e8cf10450732f13b","kind":"json"},
 {"file":"list-1004131.json","url":"https://codepostal.cd/backend/public/api/address/list-by-postal-code?postalCode=1004131","bytes":736,"sha256":"ef31bbe0f3b9ba183db7977df470a0b6e24fc51aab2c9a0fadcd6d7fb6d32753","kind":"json"},
 {"file":"search-1004131.json","url":"https://codepostal.cd/backend/public/api/address/search-by-postal-code?postalCode=1004131&state=Kinshasa","bytes":744,"sha256":"29608233fa33deaf864258e923c17faf2c09b459a1a4caa26c898d80046f4ec0","kind":"json"},
 {"file":"list-3202011.json","url":"https://codepostal.cd/backend/public/api/address/list-by-postal-code?postalCode=3202011","bytes":730,"sha256":"99c4e4af5189d706f50621292fdb866539bcfdbf3a75374ff648d4056352160e","kind":"json"},
 {"file":"arptc-postal-market-2021-2022.pdf","url":"https://arptc.gouv.cd/app/uploads/2023/10/Rapport-annuel-sur-lobservatoire-du-marche%CC%81-de-la-Poste-en-RDC-2021-2022.pdf","bytes":2800477,"sha256":"6c1a65de7ac8a59dff4d77bd0a556ac3d3677f06283777ccfd1a0995d93ebe43","kind":"pdf","pages":32,"markers":["±429 bureaux de postes","379 pour la SCPT","plus de 2/3 ne sont plus opérationnels"]},
 {"file":"nominatim-residentiel-limete.geojson","url":"https://nominatim.openstreetmap.org/search","bytes":125,"sha256":"89aed4c6ce1e7989a5c0bba7d476b00354316a84157da8df0e348acb8133a842","kind":"json","candidate":True},
 {"file":"nominatim-limete.geojson","url":"https://nominatim.openstreetmap.org/search","bytes":23799,"sha256":"8f2c6e7f355ac8219a23722f91fd3cda2409d7daf1cf753343df024f055f7f6d","kind":"json","candidate":True},
 {"file":"nominatim-bulungu.geojson","url":"https://nominatim.openstreetmap.org/search","bytes":254144,"sha256":"78b2fc9c2fc34ca4fc73ad67701e3987c3e0a80ac01ca5a93c0657bd283352a4","kind":"json","candidate":True},
 {"file":"hf-ellenhp-libpostal-metadata.json","url":"https://huggingface.co/api/datasets/ellenhp/libpostal","bytes":20184,"sha256":"f8e8391031dc1be1a72add1626feeeb615c53ebcf04210754987d28518411260","kind":"json","candidate":True},
 {"file":"hf-libpostal-openaddresses-first-rows.json","url":"https://datasets-server.huggingface.co/first-rows","bytes":16929,"sha256":"4aeb3fef41ebd949ac8a9dbcf30b5d8bf3f903e633af4be765e74066af4b20b5","kind":"json","candidate":True},
 {"file":"hf-libpostal-openstreetmap_addresses-first-rows.json","url":"https://datasets-server.huggingface.co/first-rows","bytes":15520,"sha256":"773632cab9f70cb90cf336968355173ce7158a2b9fffb24f562f135d1dfc0c56","kind":"json","candidate":True}
]

def digest(body): return hashlib.sha256(body).hexdigest()
def normalized(value): return re.sub(r"\s+", " ", html.unescape(value)).strip()

def inspect_source_dir(source_dir, expected=EXPECTED):
 root=Path(source_dir); missing=[i["file"] for i in expected if not (root/i["file"]).is_file()]
 if missing: raise ValueError(f"source-set-mismatch missing={missing}")
 receipts=[]
 for item in expected:
  path=root/item["file"]; body=path.read_bytes()
  if len(body)!=item["bytes"] or digest(body)!=item["sha256"]: raise ValueError(f"source-changed-review-required:{item['file']}")
  text=""; pages=None
  if item["kind"]=="pdf":
   with pdfplumber.open(path) as pdf: pages=len(pdf.pages); text=normalized("\n".join((p.extract_text() or "") for p in pdf.pages))
   if pages!=item["pages"]: raise ValueError(f"pdf-page-count:{item['file']}")
  elif item["kind"]=="json": json.loads(body.decode("utf-8"))
  else: text=normalized(body.decode("utf-8"))
  for marker in item.get("markers",[]):
   if normalized(marker) not in text: raise ValueError(f"missing-content-marker:{item['file']}:{marker}")
  receipts.append({"file":item["file"],"url":item["url"],"bytes":len(body),"sha256":item["sha256"],"pages":pages,"class":"candidate" if item.get("candidate") else "official-reference"})
 official=[r for r in receipts if r["class"]=="official-reference"]; candidate=[r for r in receipts if r["class"]=="candidate"]
 if expected is not EXPECTED:
  return {"exactBodiesByteAndSha256Bound":len(receipts),"productionEligibleRecords":0}
 a100=json.loads((root/"list-1004131.json").read_text(encoding="utf-8"))["data"][0]
 a320=json.loads((root/"list-3202011.json").read_text(encoding="utf-8"))["data"][0]
 hf=json.loads((root/"hf-ellenhp-libpostal-metadata.json").read_text(encoding="utf-8"))
 if (a100["id"],a100["city"],a100["state"],a100["neighbourhood"].strip())!=(175,"Limete","Kinshasa","RESIDENTIEL"): raise ValueError("scpt-1004131-drift")
 if (a320["id"],a320["city"],a320["state"],a320["neighbourhood"].strip())!=(1160,"Bulungu","Kwilu","BULUNGU"): raise ValueError("scpt-3202011-drift")
 if hf.get("sha")!="79e9bdd2145dcd2040e0bafea4596a49e0c2f70b" or "Under Construction" not in hf.get("description",""): raise ValueError("hf-candidate-drift")
 return {"schemaVersion":"postal-context-cd-source-inspection/v1","countryCode":"CD","receipts":receipts,"officialReferenceBodies":len(official),"candidateBodies":len(candidate),"exactBodiesByteAndSha256Bound":len(receipts),"officialReferenceBytes":sum(r["bytes"] for r in official),"candidateBytes":sum(r["bytes"] for r in candidate),"currentPostalCodeFormat":"NNNNNNN","validatedOfficialExampleRows":2,"officialPostalGeometryRecords":0,"productionEligibleRecords":0,"hfCandidateIngested":False,"rawSourceRowsEmitted":0}

if __name__=="__main__":
 p=argparse.ArgumentParser(); p.add_argument("--source-dir",required=True); a=p.parse_args(); print(json.dumps(inspect_source_dir(a.source_dir),ensure_ascii=False,indent=2))
