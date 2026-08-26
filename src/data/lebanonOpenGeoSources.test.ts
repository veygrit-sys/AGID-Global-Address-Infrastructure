import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED=["libanpost","libanpost-address-and-nac","upu-lebanon-addressing","upu-lebanon-postcode-formats-2025","moph-lebanon-administrative-zones","lebanon-atlas-admin-boundaries-2026","dlrc-lebanon-cadastre","lebanon-law-81-2018-personal-data","osm-lebanon"] as const;

test('Lebanon registry separates postal, NAC, UPU, administrative P-code, cadastre, privacy, and OSM evidence',()=>{
  const ids=getAsiaOpenSourceIds('LB'); for(const id of EXPECTED){assert.ok(ids.includes(id));assert.equal(ASIA_OPEN_GEO_SOURCES[id].id,id);assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'),true);}
  assert.match(ASIA_OPEN_GEO_SOURCES.libanpost.notes,/official postal-operator.*not bulk assignment.*canonical national postal polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['libanpost-address-and-nac'].notes,/governorate.*building.*P\.O\. Box.*NAC.*distinct from postcode and AGID.*not public bulk/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-lebanon-addressing'].notes,/building.*floor.*street or area.*district.*not current assignments.*postal polygons/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-lebanon-postcode-formats-2025'].notes,/9999.*99 999 999.*not.*current rows.*canonical geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['moph-lebanon-administrative-zones'].notes,/governorate.*district.*cadaster.*PCODE.*not postcodes.*blank copyright.*not an open licence/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['lebanon-atlas-admin-boundaries-2026'].notes,/OCHA.*CDR.*CAS.*P-code.*not a postcode/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['dlrc-lebanon-cadastre'].notes,/parcel.*unit.*owner.*not public civic-address or building data.*postal relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['lebanon-law-81-2018-personal-data'].notes,/Law 81\/2018.*Article 98.*NAC.*P\.O\. Box holder.*lawful basis/i);
});

test('Lebanon official catalog exposes matching authority and access boundaries',()=>{
  const sources=new Map(getOfficialPostalSourcesForCountry('LB').map(source=>[source.id,source]));
  assert.equal(sources.get('libanpost')?.authority,'postal-operator'); assert.equal(sources.get('libanpost')?.validationReadiness,'reference-eligible');
  assert.equal(sources.get('libanpost-address-and-nac')?.depth,'address'); assert.equal(sources.get('upu-lebanon-addressing')?.sourceRole,'legal-framework-only');
  assert.equal(sources.get('upu-lebanon-postcode-formats-2025')?.depth,'postcode'); assert.equal(sources.get('moph-lebanon-administrative-zones')?.availability,'public-api');
  assert.equal(sources.get('lebanon-atlas-admin-boundaries-2026')?.trustTier,'official-derived'); assert.equal(sources.get('dlrc-lebanon-cadastre')?.requiresCredential,true); assert.equal(sources.get('lebanon-law-81-2018-personal-data')?.depth,'legal-framework');
  const classification=classifyPostalSourceTrust({countryCode:'LB',source:'LibanPost'}); assert.equal(classification.strength,'strong'); assert.equal(classification.tier,'authoritative');
});

test('Lebanon address metadata encodes both formats, NAC and P-code separation, explicit buildings, and AGID separation',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'); const value=JSON.parse(readFileSync(resolve(root,'src/data/address_formats/asia/middle_east/LB.json'),'utf8')) as {native:{fields:Array<{key:string;required:boolean}>};english:{fields:Array<{key:string;required:boolean}>};postalCode:{format:string;regex:string;api:string;source:string};openSourceIds:string[];addressRules:{regionalHierarchy:string[];postalCode:{label:string;required:boolean;usage:string}}};
  assert.equal(value.postalCode.format,'NNNN or NN NNN NNN'); assert.equal(value.postalCode.regex,'^(?:\\d{4}|\\d{2} \\d{3} \\d{3})$'); assert.match(value.postalCode.api,/libanpost\.com\/AddressDetails\.aspx/i); assert.match(value.postalCode.source,/LibanPost.*UPU.*2025.*MOPH/i);
  assert.equal(value.addressRules.postalCode.label,'4 digits or NN NNN NNN when officially assigned'); assert.equal(value.addressRules.postalCode.required,false); assert.match(value.addressRules.postalCode.usage,/area or non-area.*NAC.*P-code.*not.*official polygon.*building relation/i);
  assert.deepEqual(value.addressRules.regionalHierarchy,['governorate','districtKaza','cityVillageOrArea','streetOrArea','buildingNameNumberFloorApartmentOrBlock','poBoxOrPostalServiceObject','libanPostNacCoordinateDerivedLocationToken','officialFourOrEightDigitPostalAssignment','optionalDerivedPostalAdministrativeJoinSurface','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry','agidIndependentSpatialIndex']);
  assert.equal(value.native.fields.some(field=>field.key==='nacCode'),true); assert.equal(value.english.fields.some(field=>field.key==='poBox'),true); assert.equal(value.native.fields.some(field=>field.key==='buildingId'),true); for(const id of EXPECTED)assert.ok(value.openSourceIds.includes(id));
});
