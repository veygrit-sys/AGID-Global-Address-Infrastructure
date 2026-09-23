# P0 Complete Country Pack: Thailand (TH)

Status: completed as a P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-th-gazetteer
```

## Scope

This pack records a source-linked first-order administrative seed layer for
Thailand. It is designed for AGID place identification, Thai/English address
form selection, postal/API compatibility work, and later district/subdistrict
expansion.

Included:

- country seed: Thailand
- Bangkok as the special administrative area / capital seed
- all 76 province seeds
- synthetic conformance vectors for every first-order seed
- publication gates for no raw addresses, no recipient records, no private
  coordinates, and no proof-secret material

Excluded:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- districts, subdistricts, villages, routes, postal records, or building-level
  records

## First-Order Coverage

The seed layer covers Bangkok and all 76 provinces, including Amnat Charoen,
Ang Thong, Bueng Kan, Buri Ram, Chachoengsao, Chai Nat, Chaiyaphum,
Chanthaburi, Chiang Mai, Chiang Rai, Chon Buri, Chumphon, Kalasin,
Kamphaeng Phet, Kanchanaburi, Khon Kaen, Krabi, Lampang, Lamphun, Loei,
Lop Buri, Mae Hong Son, Maha Sarakham, Mukdahan, Nakhon Nayok, Nakhon Pathom,
Nakhon Phanom, Nakhon Ratchasima, Nakhon Sawan, Nakhon Si Thammarat, Nan,
Narathiwat, Nong Bua Lam Phu, Nong Khai, Nonthaburi, Pathum Thani, Pattani,
Phang Nga, Phatthalung, Phayao, Phetchabun, Phetchaburi, Phichit, Phitsanulok,
Phra Nakhon Si Ayutthaya, Phrae, Phuket, Prachin Buri, Prachuap Khiri Khan,
Ranong, Ratchaburi, Rayong, Roi Et, Sa Kaeo, Sakon Nakhon, Samut Prakan,
Samut Sakhon, Samut Songkhram, Saraburi, Satun, Sing Buri, Sisaket, Songkhla,
Sukhothai, Suphan Buri, Surat Thani, Surin, Tak, Trang, Trat, Ubon Ratchathani,
Udon Thani, Uthai Thani, Uttaradit, Yala, and Yasothon.

## Source Links

- GeoNames TH administrative division listing: https://www.geonames.org/TH/administrative-division-thailand.html
- GeoNames Thailand country metadata: https://www.geonames.org/countries/TH/thailand.html
- UNEP GRID DICF Thailand profile: https://dicf.unepgrid.ch/thailand
- PCGN Thailand toponymic factfile: https://assets.publishing.service.gov.uk/media/6672f29dc087fbe40855ce7b/Thailand_Toponymic_Factfile.pdf

## Verification

Run:

```text
npm run verify:p0-batch-17-20-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies 77 first-order seeds, Bangkok, 76 provinces,
source links, conformance fixtures, and the no-raw-address fixture boundary.

## Residual Risk

This is not a complete district, subdistrict, village, route, postal, or
boundary database. It is a complete first-order AGID seed pack. The next
improvement is a district/subdistrict pack with Thai script aliases and license
reviewed boundary sources.
