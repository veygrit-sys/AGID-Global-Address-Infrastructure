import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED=["israel-post","israel-post-mail-guide-2020","israel-post-terms","upu-israel-addressing-2022","govmap-israel","population-authority-israel-street-list","cbs-israel-geography","data-gov-il","data-gov-il-terms-2025","osm-israel"] as const;

test('Israel registry separates operator, seven and nine digits, terms, UPU, government context, community, and territorial evidence',()=>{
  const ids=getAsiaOpenSourceIds('IL'); for(const id of EXPECTED){assert.ok(ids.includes(id));assert.equal(ASIA_OPEN_GEO_SOURCES[id].id,id);assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'),true);}
  assert.match(ASIA_OPEN_GEO_SOURCES['israel-post'].notes,/seven-digit.*informational only.*official or commercial.*all rights.*no responses.*scraped/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['israel-post-mail-guide-2020'].notes,/seven digits.*delivery address.*updated.*separate nine-digit distribution code.*not.*polygon/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['israel-post-terms'].notes,/informational only.*not binding.*official or commercial.*all rights/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-israel-addressing-2022'].notes,/seven digits.*locality.*Palestinian Authority.*not.*boundary.*sovereignty/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['govmap-israel'].notes,/Survey of Israel.*address.*block.*parcel.*registration.*not Israel Post/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['population-authority-israel-street-list'].notes,/street reference.*exact resource.*licence.*Street names do not prove/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['cbs-israel-geography'].notes,/locality.*statistical-area.*not a postcode.*postal polygon/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['data-gov-il-terms-2025'].notes,/commercial and non-commercial.*attribution.*privacy.*third-party/i);
});

test('Israel official catalog exposes matching authority and licence boundaries',()=>{
  const sources=new Map(getOfficialPostalSourcesForCountry('IL').map(source=>[source.id,source])); for(const id of ['israel-post','israel-post-mail-guide-2020','israel-post-terms','upu-israel-addressing-2022','govmap-israel','population-authority-israel-street-list','cbs-israel-geography','data-gov-il-terms-2025'])assert.ok(sources.has(id));
  assert.equal(sources.get('israel-post')?.trustTier,'authoritative'); assert.equal(sources.get('israel-post')?.availability,'web-search'); assert.equal(sources.get('israel-post-mail-guide-2020')?.sourceRole,'legal-framework-only'); assert.equal(sources.get('israel-post-terms')?.depth,'legal-framework'); assert.equal(sources.get('upu-israel-addressing-2022')?.sourceRole,'legal-framework-only'); assert.equal(sources.get('govmap-israel')?.requiresCredential,true); assert.equal(sources.get('population-authority-israel-street-list')?.availability,'bulk-open-data'); assert.equal(sources.get('cbs-israel-geography')?.availability,'public-api');
  const classification=classifyPostalSourceTrust({countryCode:'IL',source:'Israel Post'}); assert.equal(classification.strength,'weak'); assert.equal(classification.tier,'weak');
});

test('Israel address metadata encodes seven digits, non-area geometry gates, explicit buildings, territorial scope, and AGID separation',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'); const value=JSON.parse(readFileSync(resolve(root,'src/data/address_formats/asia/middle_east/IL.json'),'utf8')) as {native:{fields:Array<{key:string;required:boolean}>};english:{fields:Array<{key:string;required:boolean}>};postalCode:{format:string;regex:string;api:string;source:string};openSourceIds:string[];addressRules:{regionalHierarchy:string[];postalCode:{label:string;required:boolean;usage:string}}};
  assert.equal(value.postalCode.format,'NNNNNNN'); assert.equal(value.postalCode.regex,'^\\d{7}$'); assert.match(value.postalCode.api,/israelpost\.co\.il/i); assert.match(value.postalCode.source,/Israel Post.*UPU.*10\/2022.*GovMap.*Data\.gov\.il.*2025-08-30/i);
  assert.equal(value.addressRules.postalCode.label,'7 digits required for postal addressing'); assert.equal(value.addressRules.postalCode.required,true); assert.match(value.addressRules.postalCode.usage,/opaque Israel Post assignment.*updated.*address.*route.*P\.O\. Box.*non-area.*polygon is never presumed.*nine-digit distribution code.*territorial scope/i);
  assert.deepEqual(value.addressRules.regionalHierarchy,['officialSevenDigitPostalAssignment','recipientOrOrganization','streetHouseEntranceFloorApartmentOrPoBox','locality','officialPostalObjectGeometryWhenExactlyRightsCleared','govMapAddressCandidate','cbsAdministrativeAndStatisticalContextIndependentFromPostcode','optionalDerivedPostalContextSurface','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry','agidIndependentSpatialIndex','territorialScopeExplicitAndVersioned']);
  assert.equal(value.native.fields.some(field=>field.key==='poBox'),true); assert.equal(value.english.fields.some(field=>field.key==='apartment'),true); assert.equal(value.native.fields.some(field=>field.key==='buildingId'),true); for(const id of EXPECTED)assert.ok(value.openSourceIds.includes(id));
});
