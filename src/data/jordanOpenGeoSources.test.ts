import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED=['jordanpost','upu-jordan-addressing-2004','modee-jordan-postal-policy-2025','trc-jordan-postal-sector','jordan-post-offices-open-data-2023','jordan-open-government-data-license-v1','rjgc-jordan','rjgc-jordan-eservices','rjgc-gam-building-mou','dls-jordan-village-codes-2022','gam-jordan-streets-2019','jordan-digital-mailbox-pilot-2026'] as const;

test('Jordan registry separates postcode, dated syntax, policy, offices, licence, mapping, buildings, villages, streets, and pilot',()=>{
  const ids=getAsiaOpenSourceIds('JO'); for(const id of EXPECTED){assert.ok(ids.includes(id));assert.equal(ASIA_OPEN_GEO_SOURCES[id].id,id);assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'),true);}
  assert.match(ASIA_OPEN_GEO_SOURCES.jordanpost.notes,/five-digit routing assignment.*not a canonical polygon.*civic address.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-jordan-addressing-2004'].notes,/September 2004.*five digits.*not current assignment rows.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['modee-jordan-postal-policy-2025'].notes,/completion of physical street\/building addressing.*not supported.*not.*postcode polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['jordan-post-offices-open-data-2023'].notes,/post-office rows.*not postal polygons.*civic-address.*buildings.*exact artifact.*digest/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['jordan-open-government-data-license-v1'].notes,/exact artifact carries the license.*Arabic prevails/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['rjgc-jordan-eservices'].notes,/account.*application.*payment.*product-specific.*not.*postal relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['rjgc-gam-building-mou'].notes,/building points.*Controlled exchange.*not a public building\/address artifact/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['dls-jordan-village-codes-2022'].notes,/not postcodes.*civic addresses.*building identifiers.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['gam-jordan-streets-2019'].notes,/not national address coverage.*postcode geometry.*building relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['jordan-digital-mailbox-pilot-2026'].notes,/pilot.*No public production schema.*personal-address permission.*geometry licence/i);
});

test('Jordan official catalog exposes matching authority and access boundaries',()=>{
  const sources=new Map(getOfficialPostalSourcesForCountry('JO').map(source=>[source.id,source]));
  assert.equal(sources.get('jordanpost')?.authority,'postal-operator'); assert.equal(sources.get('jordanpost')?.validationReadiness,'metadata-only');
  assert.equal(sources.get('upu-jordan-addressing-2004')?.sourceRole,'legal-framework-only'); assert.equal(sources.get('modee-jordan-postal-policy-2025')?.depth,'legal-framework');
  assert.equal(sources.get('jordan-post-offices-open-data-2023')?.availability,'bulk-open-data'); assert.equal(sources.get('jordan-open-government-data-license-v1')?.validationReadiness,'metadata-only');
  assert.equal(sources.get('rjgc-jordan')?.requiresCredential,true); assert.equal(sources.get('rjgc-gam-building-mou')?.availability,'commercial-or-restricted');
  assert.equal(sources.get('dls-jordan-village-codes-2022')?.depth,'locality'); assert.equal(sources.get('gam-jordan-streets-2019')?.depth,'street'); assert.equal(sources.get('jordan-digital-mailbox-pilot-2026')?.validationReadiness,'metadata-only');
  const classification=classifyPostalSourceTrust({countryCode:'JO',source:'Jordan Post'}); assert.equal(classification.strength,'weak'); assert.equal(classification.tier,'weak'); assert.equal(sources.get('jordan-post-offices-open-data-2023')?.validationReadiness,'metadata-only');
});

test('Jordan address metadata encodes five digits, routing hierarchy, non-area objects, explicit buildings, and AGID separation',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'); const value=JSON.parse(readFileSync(resolve(root,'src/data/address_formats/asia/middle_east/JO.json'),'utf8')) as {native:{fields:Array<{key:string;required:boolean}>};english:{fields:Array<{key:string;required:boolean}>};postalCode:{format:string;regex:string;api:string;source:string};openSourceIds:string[];addressRules:{regionalHierarchy:string[];postalCode:{label:string;required:boolean;usage:string}}};
  assert.equal(value.postalCode.format,'NNNNN'); assert.equal(value.postalCode.regex,'^\\d{5}$'); assert.match(value.postalCode.api,/jordanpost\.com\.jo/i); assert.match(value.postalCode.source,/Jordan Post.*UPU Jordan.*Postal Policy 2025.*Open Data Portal.*Geographic Centre/i);
  assert.equal(value.addressRules.postalCode.label,'5 digits when assigned'); assert.equal(value.addressRules.postalCode.required,false); assert.match(value.addressRules.postalCode.usage,/routing\/locality.*not guaranteed polygon.*building/i);
  assert.deepEqual(value.addressRules.regionalHierarchy,['governorate','districtOrDirectorate','cityTownOrVillage','localityNeighbourhoodOrStreet','buildingPremiseApartmentOrPoBox','fiveDigitRoutingCode','postOfficeOrCarrierRouteObject','optionalDerivedAdministrativeJoinSurface','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry','agidIndependentSpatialIndex']);
  assert.equal(value.native.fields.some(field=>field.key==='poBox'),true); assert.equal(value.english.fields.some(field=>field.key==='governorate'),true); assert.equal(value.native.fields.some(field=>field.key==='buildingId'),true); for(const id of EXPECTED)assert.ok(value.openSourceIds.includes(id));
});
