import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED=["zipcode-mn","crc-mongolia-unified-postcode-2019","upu-mongolia-addressing","crc-mongolia-postal-regulation","alamgc-mongolia","nsdi-mongolia","gazar-mongolia-address-system","gazar-mongolia-spatial-data-standards","gazar-mongolia-boundaries","gazar-mongolia-open-spatial-data","nso-mongolia-administrative-units"] as const;

test('Mongolia registry separates current codes, five-nine semantics, address grids, boundaries, and statistics',()=>{
  const ids=getAsiaOpenSourceIds('MN'); for(const id of EXPECTED){assert.ok(ids.includes(id));assert.equal(ASIA_OPEN_GEO_SOURCES[id].id,id);assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'),true);}
  assert.equal(ASIA_OPEN_GEO_SOURCES['zipcode-mn'].usage,'primary');
  assert.match(ASIA_OPEN_GEO_SOURCES['zipcode-mn'].notes,/five-digit zones.*nine-digit.*assignment evidence.*not.*canonical postcode polygon.*delivery/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['crc-mongolia-unified-postcode-2019'].notes,/five-digit zone.*nine-digit.*appending four digits.*assigned to a building.*not current rows.*geometry/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-mongolia-addressing'].notes,/five digits.*province or capital.*rural.*P.O. Box.*not.*current national allocation.*polygon/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['gazar-mongolia-address-system'].notes,/coordinate-based addresses.*10 metres.*distinct from CRC postal codes.*AGID.*rights/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['nsdi-mongolia'].notes,/viewing.*purchasing.*access levels.*exact layer.*rights.*not a postcode relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['gazar-mongolia-boundaries'].notes,/point and polygon.*access levels.*derived join.*not a postal polygon.*building address/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['nso-mongolia-administrative-units'].notes,/annual aggregate.*aimag.*soum.*bag.*do not establish postal assignments.*buildings/i);
});

test('Mongolia official catalog exposes authority and access boundaries',()=>{
  const sources=new Map(getOfficialPostalSourcesForCountry('MN').map(source=>[source.id,source]));
  assert.equal(sources.get('zipcode-mn')?.authority,'government'); assert.equal(sources.get('zipcode-mn')?.validationReadiness,'reference-eligible'); assert.equal(sources.get('zipcode-mn')?.depth,'building');
  assert.equal(sources.get('crc-mongolia-unified-postcode-2019')?.sourceRole,'legal-framework-only'); assert.equal(sources.get('upu-mongolia-addressing')?.authority,'intergovernmental-postal-standard');
  assert.equal(sources.get('alamgc-mongolia')?.requiresCredential,true); assert.equal(sources.get('nsdi-mongolia')?.availability,'commercial-or-restricted'); assert.equal(sources.get('gazar-mongolia-address-system')?.depth,'building');
  assert.equal(sources.get('gazar-mongolia-open-spatial-data')?.availability,'bulk-open-data'); assert.equal(sources.get('nso-mongolia-administrative-units')?.depth,'locality');
  const classification=classifyPostalSourceTrust({countryCode:'MN',source:'CRC Mongolia zipcode'}); assert.equal(classification.strength,'strong'); assert.equal(classification.tier,'authoritative');
});

test('Mongolia address metadata encodes five and nine digits, typed hierarchy, government-grid separation, and exact building gate',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'); const value=JSON.parse(readFileSync(resolve(root,'src/data/address_formats/asia/east_asia/MN.json'),'utf8')) as {native:{fields:Array<{key:string;required:boolean}>};english:{fields:Array<{key:string;required:boolean}>};postalCode:{format:string;regex:string;api:string;source:string};openSourceIds:string[];addressRules:{regionalHierarchy:string[];postalCode:{label:string;required:boolean;usage:string}}};
  assert.equal(value.postalCode.format,'NNNNN or NNNNN-NNNN'); assert.equal(value.postalCode.regex,'^\\d{5}(?:-\\d{4})?$'); assert.match(value.postalCode.api,/zipcode.mn/i); assert.match(value.postalCode.source,/CRC Mongolia.*MNS 6775:2019.*UPU Mongolia.*Gazar address system.*NSDI.*boundaries/i);
  assert.equal(value.addressRules.postalCode.required,true); assert.equal(value.addressRules.postalCode.usage,'required'); assert.match(value.addressRules.postalCode.label,/5-digit postal zone.*9-digit unified building code.*exact rights-cleared.*building/i);
  assert.deepEqual(value.addressRules.regionalHierarchy,['aimagOrCapitalCity','soumOrDistrict','bagOrKhoroo','localityOrDeliveryBlock','fiveDigitPostalZone','nineDigitUnifiedBuildingCodeWhenAssigned','officialPostalAssignmentWithoutCanonicalGeometry','optionalDerivedPostalZoneSurface','gazarAddressGridWithoutPostalPromotion','explicitRightsClearedCivicAddress','explicitUnifiedCodeLinkedBuilding','exactRightsClearedBuildingGeometry']);
  assert.equal(value.native.fields.find(field=>field.key==='soumOrDistrict')?.required,true); assert.equal(value.english.fields.find(field=>field.key==='street')?.required,false); assert.equal(value.native.fields.some(field=>field.key==='building'),true); for(const id of EXPECTED)assert.ok(value.openSourceIds.includes(id));
});
