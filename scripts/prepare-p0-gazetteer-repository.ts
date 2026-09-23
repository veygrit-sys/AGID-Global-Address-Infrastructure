import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import { buildExternalOssGeoPostalIntegrationPlans } from '../src/lib/externalOssGeoPostalIntegration';
import { buildGeoOpenSourceGapStrategyReport } from '../src/lib/geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  selectNextP0GazetteerGap,
  validateP0GazetteerRepositoryPlan,
  type P0GazetteerRepositoryPlan,
} from '../src/lib/p0GazetteerRepositoryRotation';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');
const OUTPUT_ROOT = join(process.cwd(), 'data', 'open_geo_repositories');
const DOC_PATH = join(process.cwd(), 'docs', 'p0-gazetteer-repository-rotation.md');
const ROTATION_INDEX_PATH = join(OUTPUT_ROOT, 'p0-gazetteer-rotation.json');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const filePath = join(dir, name);
    return statSync(filePath).isDirectory() ? walkJsonFiles(filePath) : filePath.endsWith('.json') ? [filePath] : [];
  });
}

function loadAddressFormats() {
  return walkJsonFiles(ADDRESS_FORMAT_ROOT).map(file => ({
    relativePath: relative(ADDRESS_FORMAT_ROOT, file),
    format: JSON.parse(readFileSync(file, 'utf8')),
  }));
}

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readCountryArg() {
  const named = readArg('--country');
  if (named) return named.toUpperCase();
  const bare = process.argv
    .slice(2)
    .find(value => /^[A-Za-z][A-Za-z0-9_-]{1,8}$/.test(value) && !value.startsWith('--'));
  return bare?.toUpperCase();
}

function readCountryNameArg(countryCode?: string) {
  const named = readArg('--name') ?? readArg('--country-name');
  if (named) return named;
  if (!countryCode) return undefined;
  const bareArgs = process.argv
    .slice(2)
    .filter(value => !value.startsWith('--') && !value.includes('='));
  const countryIndex = bareArgs.findIndex(value => value.toUpperCase() === countryCode);
  const nameParts = countryIndex >= 0 ? bareArgs.slice(countryIndex + 1) : [];
  return nameParts.length ? nameParts.join(' ') : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readme(plan: P0GazetteerRepositoryPlan) {
  const completionNote = plan.countryCode === 'AX'
    ? `
## Complete Country Slice

This pack is the first complete P0 country slice. It includes:

- the country seed
- the two public municipality groupings used for AX QA
- all 16 Åland municipalities, source-linked and assigned AGID place IDs
- conformance vectors for every municipality seed
`
    : plan.countryCode === 'NR'
    ? `
## Complete Country Slice

This pack is the second complete P0 country slice. It includes:

- the country seed
- all 14 Nauru districts, source-linked and assigned AGID place IDs
- conformance vectors for every district seed
`
    : plan.countryCode === 'BN'
    ? `
## Complete Country Slice

This pack is the third complete P0 country slice. It includes:

- the country seed
- all 4 Brunei Darussalam districts, source-linked and assigned AGID place IDs
- conformance vectors for every district seed
`
    : plan.countryCode === 'FM'
    ? `
## Complete Country Slice

This pack is the fourth complete P0 country slice. It includes:

- the country seed
- all 4 Federated States of Micronesia states, source-linked and assigned AGID place IDs
- conformance vectors for every state seed
`
    : plan.countryCode === 'LU'
    ? `
## Complete Country Slice

This pack is the fifth complete P0 country slice. It includes:

- the country seed
- all 12 Luxembourg cantons, source-linked and assigned AGID place IDs
- conformance vectors for every canton seed
`
    : plan.countryCode === 'NC'
    ? `
## Complete Country Slice

This pack is the sixth complete P0 country slice. It includes:

- the country seed
- all 3 New Caledonia provinces, source-linked and assigned AGID place IDs
- conformance vectors for every province seed
`
    : plan.countryCode === 'WF'
    ? `
## Complete Country Slice

This pack is the seventh complete P0 country slice. It includes:

- the country seed
- all 3 Wallis and Futuna chiefdoms/customary kingdoms, source-linked and assigned AGID place IDs
- conformance vectors for every chiefdom seed
`
    : plan.countryCode === 'PN'
    ? `
## Complete Country Slice

This pack is the eighth complete P0 country slice. It includes:

- the country seed
- all 4 Pitcairn Islands group islands, source-linked and assigned AGID place IDs
- the Adamstown capital/settlement seed
- conformance vectors for every island and the capital seed
`
    : plan.countryCode === 'FO'
    ? `
## Complete Country Slice

This pack is the ninth complete P0 country slice. It includes:

- the country seed
- all 18 Faroe Islands main islands, source-linked and assigned AGID place IDs
- the Tórshavn capital seed
- conformance vectors for every main island and the capital seed
`
    : plan.countryCode === 'MH'
    ? `
## Complete Country Slice

This pack is the tenth complete P0 country slice. It includes:

- the country seed
- all 24 Marshall Islands constitutional electoral districts / local-government units, source-linked and assigned AGID place IDs
- 34 base and associated atoll/island anchors under those districts, preserving combined-district non-claims
- conformance vectors for every constitutional district and atoll/island anchor seed
`
    : plan.countryCode === 'MY'
    ? `
## Complete Country Slice

This pack is the eleventh complete P0 country slice. It includes:

- the country seed
- all 13 Malaysia states, source-linked and assigned AGID place IDs
- all 3 federal territories, source-linked and assigned AGID place IDs
- conformance vectors for every first-order division seed
`
    : plan.countryCode === 'NL'
    ? `
## Complete Country Slice

This pack is the twelfth complete P0 country slice. It includes:

- the country seed
- all 12 European Netherlands provinces, source-linked and assigned AGID place IDs
- all 3 Caribbean Netherlands public bodies, source-linked and assigned AGID place IDs
- the Amsterdam capital seed
- conformance vectors for every province, Caribbean public body, and capital seed
`
    : plan.countryCode === 'PF'
    ? `
## Complete Country Slice

This pack is the thirteenth complete P0 country slice. It includes:

- the country seed
- all 5 French Polynesia administrative subdivisions, source-linked and assigned AGID place IDs
- the Papeete capital seed
- conformance vectors for every administrative subdivision and the capital seed
`
    : plan.countryCode === 'KI'
    ? `
## Complete Country Slice

This pack is the fourteenth complete P0 country slice. It includes:

- the country seed
- all 5 Kiribati National Statistics Office district groupings, source-linked and assigned AGID place IDs
- all 33 Kiribati public island anchors, source-linked and assigned AGID place IDs
- the Tarawa capital seed
- conformance vectors for every district, island, and the capital seed
`
    : plan.countryCode === 'KP'
    ? `
## Complete Country Slice

This pack is the fifteenth complete P0 country slice. It includes:

- the country seed
- all 9 North Korea province seeds, source-linked and assigned AGID place IDs
- all 4 first-order special administration city seeds, including Pyongyang as the capital seed
- conformance vectors for every first-order division seed
`
    : plan.countryCode === 'LA'
    ? `
## Complete Country Slice

This pack is the sixteenth complete P0 country slice. It includes:

- the country seed
- all 17 Laos province seeds, source-linked and assigned AGID place IDs
- the Vientiane Capital first-order seed, disambiguated from Vientiane Province
- conformance vectors for every first-order division seed
`
    : plan.countryCode === 'SJ' && plan.countryName === 'Svalbard and Jan Mayen'
    ? `
## Complete Region Slice

This pack is the twenty-fifth complete P0 slice. It includes:

- the ISO SJ country seed
- the Svalbard and Jan Mayen component seeds
- Longyearbyen and Olonkinbyen administrative-centre cross-references
- conformance vectors for every component and administrative-centre seed

The pack intentionally does not treat Svalbard and Jan Mayen as one local
administrative system.
`
    : plan.countryCode === 'SJ' && plan.countryName === 'Jan Mayen'
    ? `
## Complete Region Slice

This pack is the twenty-sixth complete P0 slice. It includes:

- the Jan Mayen region seed
- the Olonkinbyen station seed
- the Beerenberg natural-reference seed
- conformance vectors for every public reference seed

The pack intentionally does not claim a permanent address, building, or postal
delivery layer.
`
    : plan.countryCode === 'SJ' && plan.countryName === 'Svalbard'
    ? `
## Complete Region Slice

This pack is the twenty-seventh complete P0 slice. It includes:

- the Svalbard region seed
- the five Governor of Svalbard planning-area seeds
- Longyearbyen as the administrative-centre/planning-area seed
- conformance vectors for every planning-area seed

The pack intentionally defers island, route, building, and private-coordinate
layers.
`
    : plan.countryCode === 'VN'
    ? `
## Complete Country Slice

This pack is the twenty-eighth complete P0 country slice. It includes:

- the Vietnam country seed
- all 28 current province seeds from the 2025 34-unit provincial layer
- all 6 current centrally governed city/capital seeds
- conformance vectors for every current provincial-level seed

Legacy 63-unit ADM1 sources are retained as compatibility references only.
`
    : plan.countryCode === 'BT_T'
    ? `
## Complete Non-Claim Region Slice

This pack is the thirtieth complete P0 slice. It includes:

- the Bir Tawil non-claim region seed
- one public region anchor
- three public natural-reference anchors
- conformance vectors for every public anchor

The pack intentionally does not assert sovereignty, permanent settlement,
postal deliverability, or private-coordinate coverage.
`
    : plan.countryCode === 'CRIM'
    ? `
## Complete Non-Claim Region Slice

This pack is the thirty-first complete P0 slice. It includes:

- the Crimea neutral region seed
- Crimean Peninsula and Autonomous Republic of Crimea compatibility anchors
- Sevastopol and Simferopol public city anchors
- conformance vectors for every public anchor

The pack intentionally does not adjudicate sovereignty, recognition, current
control, route safety, or delivery rights.
`
    : plan.countryCode === 'CYGL'
    ? `
## Complete Buffer-Zone Slice

This pack is the thirty-second complete P0 slice. It includes:

- the Cyprus Green Line neutral buffer-zone seed
- the UN Buffer Zone and Nicosia Green Line anchors
- Ledra Palace, Ledra Street, and Pyla public anchors
- conformance vectors for every public anchor

The pack intentionally does not grant crossing rights, route permission,
property rights, or administrative recognition.
`
    : plan.countryCode === 'DONB'
    ? `
## Complete Non-Claim Region Slice

This pack is the thirty-third complete P0 slice. It includes:

- the Donbas neutral conflict-region seed
- Donetsk Oblast and Luhansk Oblast anchors
- Donetsk, Luhansk, and Siverskyi Donets Basin public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert current control, frontline position,
safe access, postal validity, or delivery availability.
`
    : plan.countryCode === 'EEBD'
    ? `
## Complete Border-Area Slice

This pack is the thirty-fourth complete P0 slice. It includes:

- the Ethiopia-Eritrea Border Area neutral region seed
- Badme, Tsorona, Zalambessa, Bure Border Area, and Mereb River Border Sector public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert sovereignty, demarcation completion,
current control, route safety, access rights, or postal deliverability.
`
    : plan.countryCode === 'JP_NT'
    ? `
## Complete Non-Claim Island-Group Slice

This pack is the thirty-fifth complete P0 slice. It includes:

- the Northern Territories neutral region seed
- Etorofu, Kunashiri, Shikotan, and Habomai public island anchors
- conformance vectors for every public island anchor

The pack intentionally does not assert sovereignty, current administration,
recognition, crossing rights, route safety, or postal deliverability.
`
    : plan.countryCode === 'JP_SK'
    ? `
## Complete Non-Claim Island-Group Slice

This pack is the thirty-sixth complete P0 slice. It includes:

- the Senkaku Islands neutral region seed
- all eight islands/rocks listed by the cited public source
- conformance vectors for every public island/rock anchor

The pack intentionally does not assert sovereignty, current control, access
rights, route safety, or postal deliverability.
`
    : plan.countryCode === 'JP_TK'
    ? `
## Complete Non-Claim Islet Slice

This pack is the thirty-seventh complete P0 slice. It includes:

- the Takeshima / Dokdo neutral region seed
- Liancourt Rocks, Dongdo, Seodo, and minor rock-islet public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert sovereignty, administration, resident
records, building addresses, access rights, postal validity, or delivery availability.
`
    : plan.countryCode === 'KASH'
    ? `
## Complete Non-Claim Kashmir Slice

This pack is the thirty-eighth complete P0 slice. It includes:

- the Kashmir neutral region seed
- Kashmir Region, Jammu and Kashmir, Ladakh, Azad Jammu and Kashmir,
  Gilgit-Baltistan, Aksai Chin, and Line of Control public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert sovereignty, current control,
administrative validity, crossing rights, route safety, postal validity, or
delivery availability.
`
    : plan.countryCode === 'PMR'
    ? `
## Complete Non-Claim Transnistrian-Region Slice

This pack is the thirty-ninth complete P0 slice. It includes:

- the Transnistria neutral region seed
- the Transnistrian region, Tiraspol, Bender, Camenca, Ribnita, Dubasari,
  Grigoriopol, and Slobozia public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert statehood, recognition, current control,
administrative validity, crossing rights, route safety, postal validity, or
delivery availability.
`
    : plan.countryCode === 'SCSD'
    ? `
## Complete Non-Claim Maritime Feature-Group Slice

This pack is the fortieth complete P0 slice. It includes:

- the South China Sea Islands neutral maritime feature-group seed
- Spratly Islands, Paracel Islands, Pratas Islands, Macclesfield Bank, and
  Scarborough Shoal public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert sovereignty, maritime entitlement,
current control, military/facility status, safe navigation, access rights,
postal validity, or delivery availability.
`
    : plan.countryCode === 'TRNC'
    ? `
## Complete Non-Claim Northern Cyprus Slice

This pack is the forty-first complete P0 slice. It includes:

- the Northern Cyprus neutral region seed
- the Green Line legal-reference region plus North Nicosia, Famagusta, Kyrenia,
  Morphou, Iskele, and Karpas public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert statehood, recognition, current control,
administrative validity, border status, crossing rights, route safety, postal
validity, or delivery availability.
`
    : plan.countryCode === 'BAAR'
    ? `
## Complete Enclave-Complex Slice

This pack is the forty-second complete P0 slice. It includes:

- the Baarle Enclaves neutral special-region seed
- Baarle Enclave Complex, Baarle-Hertog, Baarle-Nassau, Belgian Enclaves H1-H22,
  and Dutch Enclaves N1-N8 public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert parcel boundaries, cadastral validity,
property-level addresses, front-door jurisdiction, taxation, policing, postal
validity, or delivery availability.
`
    : plan.countryCode === 'PHIS'
    ? `
## Complete Condominium-Island Slice

This pack is the forty-third complete P0 slice. It includes:

- the Pheasant Island neutral special-region seed
- Pheasant Island Condominium, Bidasoa River Setting, Hendaye Shore, Irun Shore,
  and Hondarribia Reference public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert date-specific current authority,
border-crossing rights, public access, event access, postal validity, or delivery
availability.
`
    : plan.countryCode === 'BV'
    ? `
## Complete Polar Nature-Reserve Slice

This pack is the forty-fourth complete P0 slice. It includes:

- the Bouvet Island territory seed
- Bouvetøya Main Island, Nyrøysa, Olavtoppen, Norvegia Station, Larsøya, and Kapp Valdivia
  public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert inhabited addresses, postal validity,
delivery availability, landing permission, rescue availability, route safety, or
operational access.
`
    : plan.countryCode === 'CL-DI'
    ? `
## Complete Remote-Island-Group Slice

This pack is the forty-fifth complete P0 slice. It includes:

- the Desventuradas Islands territory seed
- Desventuradas Islands Archipelago, San Ambrosio Island, San Félix Island,
  González Islet, Roca Catedral, and Nazca-Desventuradas Marine Park public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert civilian settlement, facility status,
landing permission, access rights, route safety, postal validity, delivery
availability, or operational logistics.
`
    : plan.countryCode === 'CL-SG'
    ? `
## Complete Remote-Island Slice

This pack is the forty-sixth complete P0 slice. It includes:

- the Salas y Gómez / Motu Motiro Hiva territory seed
- Salas y Gómez / Motu Motiro Hiva, twin-rock/isthmus, nature sanctuary,
  Motu Motiro Hiva Marine Park, and Rapa Nui administrative-context public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert settlement, freshwater availability,
landing permission, public access, permit status, route safety, postal validity,
delivery availability, or operational logistics.
`
    : plan.countryCode === 'CP'
    ? `
## Complete Remote-Atoll Slice

This pack is the forty-seventh complete P0 slice. It includes:

- the Clipperton / La Passion-Clipperton territory seed
- the island, atoll, inner lagoon, Rocher de Clipperton, 12 NM territorial sea,
  and EEZ public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert habitation, postal validity, delivery
availability, landing permission, mooring permission, route safety, rescue
availability, or operational access.
`
    : plan.countryCode === 'XD'
    ? `
## Complete Sovereign-Base-Area Slice

This pack is the forty-eighth complete P0 slice. It includes:

- the Dhekelia / Eastern Sovereign Base Area seed
- Eastern Sovereign Base Area, Dhekelia Area Administration Office reference,
  Dhekelia Cantonment reference, Agios Nikolaos SAC, Cape Pyla SAC, and
  Xylotymbou-Xylophagou-Ormidhia community-cluster public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert operational status, military facility
details, security status, access rights, crossing rules, postal validity,
delivery availability, public-service entitlement, or legal advice.
`
    : plan.countryCode === 'XU'
    ? `
## Complete Sovereign-Base-Area Slice

This pack is the forty-ninth complete P0 slice. It includes:

- the Akrotiri / Western Sovereign Base Area seed
- Western Sovereign Base Area, Akrotiri Area Administration Office reference,
  Episkopi headquarters reference, Akrotiri Peninsula environmental reference,
  Akrotiri SAC, and Avdimou-Paramali community-cluster public anchors
- conformance vectors for every public anchor

The pack intentionally does not assert operational status, military facility
details, security status, access rights, crossing rules, postal validity,
delivery availability, public-service entitlement, or legal advice.
`
    : '';
  return `# ${plan.repository}

${plan.countryName} (${plan.countryCode}) source-linked AGID gazetteer seed.

This repository records place names, AGID place identifiers, and geodata source
links for a P0 critical open-geodata gap. It is designed as a small,
reviewable country pack that can later be moved to GitHub as
\`${plan.owner}/${plan.repository}\`.

## Scope

- Country AGID: \`${plan.agidCountryId}\`
- Priority: \`${plan.sourceGapPriority}\`
- Region kind: \`${plan.regionKind}\`
- Purpose: ${plan.packagePurpose}

This pack stores place-name metadata and source links only. It does not store
raw personal addresses, recipient records, proof witnesses, private keys,
carrier operational records, or precise private coordinates.
${completionNote}

## Files

- \`manifest.json\` - repository identity, AGID country link, and release gates
- \`sources.json\` - upstream geodata and license review ledger
- \`data/place-seed.json\` - source-linked place-name seed records
- \`fixtures/gazetteer-conformance.json\` - synthetic conformance vectors
- \`quality-gates.json\` - publication checks

## Publication Status

This is a seed repository. Source links are recorded, but full upstream data has
not been imported. Importing or bundling external data requires license review.
`;
}

function licenseText() {
  return `MIT License

Copyright (c) 2026 AGID contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

function dataLicenseText(plan: P0GazetteerRepositoryPlan) {
  const sourceRows = plan.sources.map(source => (
    `| ${source.id} | ${source.name} | ${source.licenseStatus} | ${source.redistribution} | ${source.url} |`
  )).join('\n');
  return `# Data Licenses

The repository metadata is MIT licensed. Linked upstream geodata remains under
its upstream license and is not bundled in this seed pack.

| Source | Name | License status | Redistribution | URL |
| --- | --- | --- | --- | --- |
${sourceRows}

Do not import ODbL, restricted, or mixed-license extracts until the derived
database and attribution requirements are reviewed.
`;
}

function publishingText(plan: P0GazetteerRepositoryPlan) {
  return `# Publishing

This folder is ready to become a standalone GitHub repository after review.

Recommended owner for open-source geography packs:

\`\`\`text
${plan.owner}/${plan.repository}
\`\`\`

## Create And Push

Run these commands from a clean temporary copy of this folder, not from inside
the AGID monorepo worktree:

\`\`\`powershell
gh repo create ${plan.owner}/${plan.repository} --public --description "AGID source-linked gazetteer seed for ${plan.countryName}"
git init
git add .
git commit -m "Seed ${plan.countryCode} AGID gazetteer pack"
git branch -M main
git remote add origin https://github.com/${plan.owner}/${plan.repository}.git
git push -u origin main
\`\`\`

## Pre-Publish Checks

- Confirm no raw personal addresses, recipient records, private coordinates, witness material, proof secrets, or private keys are present.
- Confirm every source in \`sources.json\` has a license review state.
- Confirm \`data/place-seed.json\` only contains public place names and source links.
- Confirm upstream data has not been imported unless redistribution is approved.
`;
}

function qualityGates(plan: P0GazetteerRepositoryPlan) {
  const gates = plan.releaseGates.map(id => ({ id, required: true }));
  return {
    schemaVersion: 'agid-open-gazetteer-quality-gates-v0.1',
    repository: plan.repository,
    gates,
  };
}

function conformanceFixtures(plan: P0GazetteerRepositoryPlan) {
  const fixtureSeeds = plan.countryCode === 'AX'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'municipality' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'NR'
    ? plan.placeSeeds.filter(place => place.featureClass === 'district')
    : plan.countryCode === 'BN'
    ? plan.placeSeeds.filter(place => place.featureClass === 'district')
    : plan.countryCode === 'FM'
    ? plan.placeSeeds.filter(place => place.featureClass === 'state')
    : plan.countryCode === 'LU'
    ? plan.placeSeeds.filter(place => place.featureClass === 'canton')
    : plan.countryCode === 'NC'
    ? plan.placeSeeds.filter(place => place.featureClass === 'province')
    : plan.countryCode === 'WF'
    ? plan.placeSeeds.filter(place => place.featureClass === 'chiefdom')
    : plan.countryCode === 'PN'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'island' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'FO'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'island' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'MH'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'municipality' || place.featureClass === 'island'
    ))
    : plan.countryCode === 'MY'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'state' || place.featureClass === 'special-region'
    ))
    : plan.countryCode === 'NL'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'PF'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'region' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'KI'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'district' || place.featureClass === 'island' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'KP'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'LA'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'MM'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'state' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'PG'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'PH'
    ? plan.placeSeeds.filter(place => place.featureClass === 'region')
    : plan.countryCode === 'TH'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'CN'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' ||
      place.featureClass === 'region' ||
      place.featureClass === 'municipality' ||
      place.featureClass === 'special-region'
    ))
    : plan.countryCode === 'ID'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'special-region' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'IE'
    ? plan.placeSeeds.filter(place => place.featureClass === 'municipality')
    : plan.countryCode === 'KH'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'capital'
    ))
    : plan.countryCode === 'SJ'
    ? plan.placeSeeds.filter(place => place.featureClass !== 'country')
    : plan.countryCode === 'VN'
    ? plan.placeSeeds.filter(place => (
      place.featureClass === 'province' || place.featureClass === 'city' || place.featureClass === 'capital'
    ))
    : ['BT_T', 'CRIM', 'CYGL', 'DONB', 'EEBD', 'JP_NT', 'JP_SK', 'JP_TK', 'KASH', 'PMR', 'SCSD', 'TRNC', 'BAAR', 'PHIS', 'BV', 'CL-DI', 'CL-SG', 'CP', 'XD', 'XU'].includes(plan.countryCode)
    ? plan.placeSeeds.filter(place => place.featureClass !== 'country')
    : plan.placeSeeds.slice(0, 8);
  return {
    schemaVersion: 'agid-gazetteer-conformance-v0.1',
    repository: plan.repository,
    countryCode: plan.countryCode,
    vectors: fixtureSeeds.map(place => ({
      id: `${place.agidPlaceId}:lookup`,
      input: {
        query: place.name,
        countryCode: plan.countryCode,
      },
      expected: {
        agidPlaceId: place.agidPlaceId,
        featureClass: place.featureClass,
        adminPath: place.adminPath,
        mustReturnSourceLink: true,
        mustNotReturnRawAddress: true,
      },
    })),
  };
}

function manifest(plan: P0GazetteerRepositoryPlan) {
  return {
    schemaVersion: 'agid-open-gazetteer-manifest-v0.1',
    repository: plan.repository,
    owner: plan.owner,
    countryCode: plan.countryCode,
    countryName: plan.countryName,
    agidCountryId: plan.agidCountryId,
    priority: plan.sourceGapPriority,
    regionKind: plan.regionKind,
    rotationRank: plan.rotationRank,
    generatedAt: plan.generatedAt,
    sourceGapReasons: plan.sourceGapReasons,
    missingCoreRoles: plan.missingCoreRoles,
    privacyBoundary: {
      rawPersonalAddresses: false,
      recipientRecords: false,
      precisePrivateCoordinates: false,
      witnessMaterial: false,
      privateKeys: false,
      proofSecrets: false,
      carrierOperationalRecords: false,
    },
    counts: {
      placeSeeds: plan.placeSeeds.length,
      sources: plan.sources.length,
    },
  };
}

function writeRepository(plan: P0GazetteerRepositoryPlan) {
  const repoDir = join(OUTPUT_ROOT, plan.repository);
  mkdirSync(join(repoDir, 'data'), { recursive: true });
  mkdirSync(join(repoDir, 'fixtures'), { recursive: true });

  writeFileSync(join(repoDir, 'README.md'), readme(plan), 'utf8');
  writeFileSync(join(repoDir, 'LICENSE'), licenseText(), 'utf8');
  writeFileSync(join(repoDir, 'DATA_LICENSES.md'), dataLicenseText(plan), 'utf8');
  writeFileSync(join(repoDir, 'PUBLISHING.md'), publishingText(plan), 'utf8');
  writeJson(join(repoDir, 'manifest.json'), manifest(plan));
  writeJson(join(repoDir, 'sources.json'), {
    schemaVersion: 'agid-open-gazetteer-sources-v0.1',
    repository: plan.repository,
    sources: plan.sources,
  });
  writeJson(join(repoDir, 'data', 'place-seed.json'), {
    schemaVersion: 'agid-open-place-seed-v0.1',
    repository: plan.repository,
    countryCode: plan.countryCode,
    places: plan.placeSeeds,
  });
  writeJson(join(repoDir, 'fixtures', 'gazetteer-conformance.json'), conformanceFixtures(plan));
  writeJson(join(repoDir, 'quality-gates.json'), qualityGates(plan));
  return repoDir;
}

type PreparedRotationEntry = {
  rotationRank: number;
  sourceGapKey: string;
  countryCode: string;
  countryName: string;
  regionKind: string;
  repository: string;
  placeSeedCount: number;
  missingCoreRoles?: string[];
};

function rotationDoc(entries: PreparedRotationEntry[]) {
  const rows = entries.map(entry => (
    `| ${entry.rotationRank} | ${entry.countryCode} | ${entry.countryName} | ${entry.repository} | ${entry.placeSeedCount} | ${entry.missingCoreRoles?.join(', ') || '-'} |`
  ));
  return `# P0 Gazetteer Repository Rotation

This rotation creates one small source-linked AGID gazetteer repository at a
time for P0 critical geography gaps.

## Rule

One country, territory, disputed region, or special region is prepared per rotation. Each pack must contain a
source ledger, AGID place identifiers, place-name seeds, synthetic conformance
fixtures, and no-raw-address publication gates before it is pushed to GitHub.

| Rank | Code | Name | Repository | Place seeds | Missing core roles |
| --- | --- | --- | --- | ---: | --- |
${rows.join('\n')}
`;
}

function readExistingPrepared() {
  if (!existsSync(ROTATION_INDEX_PATH)) return [];
  const index = JSON.parse(readFileSync(ROTATION_INDEX_PATH, 'utf8')) as {
    prepared?: PreparedRotationEntry[];
  };
  return index.prepared ?? [];
}

function sourceGapKey(gap: { countryCode: string; countryName: string; regionKind: string }) {
  return `${gap.countryCode}:${gap.regionKind}:${gap.countryName}`;
}

function repoCodeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function repositoryNameForGap(gap: { countryCode: string; countryName: string }, allP0: { countryCode: string }[]) {
  const duplicateCode = allP0.filter(entry => entry.countryCode === gap.countryCode).length > 1;
  const code = repoCodeSlug(gap.countryCode);
  if (!duplicateCode) return `agid-open-${code}-gazetteer`;
  return `agid-open-${code}-${repoCodeSlug(gap.countryName)}-gazetteer`;
}

function preparedEntry(plan: P0GazetteerRepositoryPlan, gap: { countryCode: string; countryName: string; regionKind: string }): PreparedRotationEntry {
  return {
    rotationRank: plan.rotationRank,
    sourceGapKey: sourceGapKey(gap),
    countryCode: plan.countryCode,
    countryName: plan.countryName,
    regionKind: plan.regionKind,
    repository: plan.repository,
    placeSeedCount: plan.placeSeeds.length,
    missingCoreRoles: plan.missingCoreRoles,
  };
}

const countryCode = readCountryArg();
const owner = readArg('--owner') ?? 'dawnportinfo-design';
const countryName = readCountryNameArg(countryCode);
const prepareAll = hasFlag('--all');
const plans = buildExternalOssGeoPostalIntegrationPlans(loadAddressFormats());
const gapReport = buildGeoOpenSourceGapStrategyReport(plans);
const p0All = gapReport.entries.filter(entry => entry.priority === 'P0-critical');
const p0Main = p0All.filter(entry => entry.regionKind === 'country-or-main-region');

if (prepareAll && countryCode) {
  throw new Error('Use either --all or a single country code, not both.');
}

const gaps = prepareAll
  ? p0All
  : [
    countryCode
      ? p0All.find(entry => (
        entry.countryCode === countryCode &&
        (!countryName || entry.countryName.toLowerCase() === countryName.toLowerCase())
      ))
      : selectNextP0GazetteerGap(gapReport, 'AX'),
  ].filter((entry): entry is typeof p0All[number] => Boolean(entry));

if (!gaps.length) {
  throw new Error(`No P0 gap found for ${countryCode ?? 'next rotation'}${countryName ? ` (${countryName})` : ''}`);
}

const generatedAt = new Date();
const written = gaps.map(gap => {
  const rotationRank = p0All.findIndex(entry => sourceGapKey(entry) === sourceGapKey(gap)) + 1;
  const plan = buildP0GazetteerRepositoryPlan(gap, rotationRank, generatedAt, owner);
  plan.repository = repositoryNameForGap(gap, p0All);
  const validationErrors = validateP0GazetteerRepositoryPlan(plan);
  if (validationErrors.length) {
    throw new Error(`P0 gazetteer repository plan failed validation for ${sourceGapKey(gap)}:\n${validationErrors.join('\n')}`);
  }
  return {
    plan,
    gap,
    repoDir: writeRepository(plan),
  };
});

const incoming = written.map(({ plan, gap }) => preparedEntry(plan, gap));
const incomingKeys = new Set(incoming.map(entry => entry.sourceGapKey));
const incomingRepositories = new Set(incoming.map(entry => entry.repository));
const prepared = [
  ...readExistingPrepared().filter(item => (
    !incomingKeys.has(item.sourceGapKey ?? sourceGapKey(item)) &&
    !incomingRepositories.has(item.repository)
  )),
  ...incoming,
].sort((left, right) => left.rotationRank - right.rotationRank);
const remaining = p0All
  .filter(entry => !prepared.some(item => item.sourceGapKey === sourceGapKey(entry)))
  .map(entry => ({
    rotationRank: p0All.findIndex(item => sourceGapKey(item) === sourceGapKey(entry)) + 1,
    countryCode: entry.countryCode,
    countryName: entry.countryName,
    regionKind: entry.regionKind,
    proposedRepository: repositoryNameForGap(entry, p0All),
  }));
writeJson(ROTATION_INDEX_PATH, {
  schemaVersion: 'agid-p0-gazetteer-rotation-index-v0.1',
  generatedAt: generatedAt.toISOString(),
  lastPreparedRepository: written[written.length - 1]?.plan.repository,
  nextRepository: remaining[0]?.proposedRepository ?? null,
  p0CountryOrMainRegionCount: p0Main.length,
  p0TotalCount: p0All.length,
  prepared,
  remaining,
});
mkdirSync(dirname(DOC_PATH), { recursive: true });
writeFileSync(DOC_PATH, rotationDoc(prepared), 'utf8');

console.log(JSON.stringify({
  mode: prepareAll ? 'all-p0' : 'single',
  repositoryCount: written.length,
  repositories: written.map(({ plan, repoDir }) => ({
    repository: plan.repository,
    countryCode: plan.countryCode,
    countryName: plan.countryName,
    regionKind: plan.regionKind,
    rotationRank: plan.rotationRank,
    placeSeedCount: plan.placeSeeds.length,
    repoDir,
  })),
  rotationIndexPath: ROTATION_INDEX_PATH,
  docPath: DOC_PATH,
}, null, 2));
