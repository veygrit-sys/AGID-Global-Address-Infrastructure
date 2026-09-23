import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED=['maldives-post','upu-maldives-addressing-2004','mlsa-maldives','onemap-maldives','maldives-onemap-island-api-2024','maldives-geomatics-land-survey-standard-2025','maldives-land-registration-survey-guideline-2020','maldives-bureau-statistics-gis-maps','maldives-census-island-atoll-2022'] as const;

test('Maldives registry separates postcode, dated syntax, national map, island API, survey rules, and statistics',()=>{
  const ids=getAsiaOpenSourceIds('MV'); for(const id of EXPECTED){assert.ok(ids.includes(id));assert.equal(ASIA_OPEN_GEO_SOURCES[id].id,id);assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'),true);}
  assert.equal(ASIA_OPEN_GEO_SOURCES['maldives-post'].usage,'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['maldives-post'].notes,/five-digit.*assignment.*not a canonical polygon.*civic-address.*building.*licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-maldives-addressing-2004'].notes,/five digits.*Malé-region.*atoll prefix.*September 2004.*not current allocations.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['mlsa-maldives'].notes,/national map.*boundary maps.*island registry.*rights.*scale.*CRS.*does not create a postcode/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['onemap-maldives'].notes,/authoritative national map.*viewing.*does not establish.*postal-code relation.*building identity.*redistribution/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['maldives-onemap-island-api-2024'].notes,/island layer.*geometry.*rights.*not a postcode polygon.*civic-address.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['maldives-geomatics-land-survey-standard-2025'].notes,/WGS 84.*UTM Zone 43N.*plot.*reef.*island.*not public cadastral data.*building geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['maldives-land-registration-survey-guideline-2020'].notes,/atoll.*island name.*FCode.*controlled survey.*not a public parcel.*building dataset/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['maldives-bureau-statistics-gis-maps'].notes,/informational.*dynamic.*legal.*engineering.*navigational.*not postal.*building authority/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['maldives-census-island-atoll-2022'].notes,/aggregate island.*atoll.*do not establish postcode.*household addresses.*building relations/i);
});

test('Maldives official catalog exposes matching authority and access boundaries',()=>{
  const sources=new Map(getOfficialPostalSourcesForCountry('MV').map(source=>[source.id,source]));
  assert.equal(sources.get('maldives-post')?.authority,'postal-operator'); assert.equal(sources.get('maldives-post')?.validationReadiness,'metadata-only');
  assert.equal(sources.get('upu-maldives-addressing-2004')?.authority,'intergovernmental-postal-standard'); assert.equal(sources.get('mlsa-maldives')?.requiresCredential,true);
  assert.equal(sources.get('onemap-maldives')?.availability,'web-search'); assert.equal(sources.get('maldives-onemap-island-api-2024')?.availability,'public-api');
  assert.equal(sources.get('maldives-geomatics-land-survey-standard-2025')?.sourceRole,'legal-framework-only'); assert.equal(sources.get('maldives-land-registration-survey-guideline-2020')?.depth,'legal-framework');
  assert.equal(sources.get('maldives-bureau-statistics-gis-maps')?.depth,'geo-only'); assert.equal(sources.get('maldives-census-island-atoll-2022')?.depth,'locality');
  const classification=classifyPostalSourceTrust({countryCode:'MV',source:'Maldives Post Postcode Finder'}); assert.equal(classification.strength,'weak'); assert.equal(classification.tier,'weak');
});

test('Maldives address metadata encodes five digits, island hierarchy, non-area objects, and exact building gate',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'); const value=JSON.parse(readFileSync(resolve(root,'src/data/address_formats/asia/south_asia/MV.json'),'utf8')) as {native:{fields:Array<{key:string;required:boolean}>};english:{fields:Array<{key:string;required:boolean}>};postalCode:{format:string;regex:string;api:string;source:string};openSourceIds:string[];addressRules:{regionalHierarchy:string[];postalCode:{label:string;required:boolean;usage:string}}};
  assert.equal(value.postalCode.format,'NNNNN'); assert.equal(value.postalCode.regex,'^\\d{5}$'); assert.match(value.postalCode.api,/maldivespost\.com\/postcode-finder/i); assert.match(value.postalCode.source,/Maldives Post.*UPU Maldives 2004.*Geomatics Department.*OneMap Maldives.*land survey.*Census 2022/i);
  assert.equal(value.addressRules.postalCode.label,'5 digits required'); assert.equal(value.addressRules.postalCode.required,true); assert.equal(value.addressRules.postalCode.usage,'required');
  assert.deepEqual(value.addressRules.regionalHierarchy,['administrativeAtoll','islandOrCity','wardOrLocality','streetHouseFloorApartmentOrUnit','fiveDigitPostcode','officialPostalAssignmentWithoutCanonicalGeometry','postalServicePointOrNonAreaObject','optionalIslandAdministrativeJoinSurface','optionalDerivedDeliverySurface','ldCodeAndFcodeWithoutPostalPromotion','censusIslandContextWithoutAddressPromotion','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry']);
  assert.equal(value.native.fields.find(field=>field.key==='streetOrMagu')?.required,false); assert.equal(value.english.fields.find(field=>field.key==='administrativeAtoll')?.required,false); assert.equal(value.native.fields.some(field=>field.key==='buildingId'),true); for(const id of EXPECTED)assert.ok(value.openSourceIds.includes(id));
});
