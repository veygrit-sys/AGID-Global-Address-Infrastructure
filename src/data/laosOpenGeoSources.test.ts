import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED=['lao-post-postcode','laos-postal-service-law-2013','laopedia-laos-postcodes','nfms-laos-administrative-boundaries','lsb-laos-phc-2025','laolandreg-laos','laos-electronic-data-law','osm-laos'] as const;

test('Laos registry separates postcode, law, allocation, administrative geometry, census, cadastre, electronic data, and OSM',()=>{
  const ids=getAsiaOpenSourceIds('LA'); for(const id of EXPECTED){assert.ok(ids.includes(id));assert.equal(ASIA_OPEN_GEO_SOURCES[id].id,id);assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'),true);}
  assert.match(ASIA_OPEN_GEO_SOURCES['lao-post-postcode'].notes,/official current five-digit.*not bulk reuse.*canonical polygon.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['laos-postal-service-law-2013'].notes,/location and delivery scope.*post office.*mail exchange.*mail route.*not.*assignment row.*(?:polygon|geometry)/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['laopedia-laos-postcodes'].notes,/official explanatory.*not.*canonical geometry.*blanket reuse/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['nfms-laos-administrative-boundaries'].notes,/province and district.*blank copyright.*not.*licence.*postal relation/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['lsb-laos-phc-2025'].notes,/aggregate.*Household.*dwelling.*building-location.*excluded/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['laolandreg-laos'].notes,/restricted.*cadastral.*owner.*address.*not public.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['laos-electronic-data-law'].notes,/personal and official.*access.*transfer.*permission/i);
});

test('Laos official catalog exposes matching authority and access boundaries',()=>{
  const sources=new Map(getOfficialPostalSourcesForCountry('LA').map(source=>[source.id,source]));
  assert.equal(sources.get('lao-post-postcode')?.authority,'postal-operator'); assert.equal(sources.get('lao-post-postcode')?.validationReadiness,'metadata-only');
  assert.equal(sources.get('laos-postal-service-law-2013')?.sourceRole,'legal-framework-only'); assert.equal(sources.get('laopedia-laos-postcodes')?.depth,'postcode');
  assert.equal(sources.get('nfms-laos-administrative-boundaries')?.availability,'public-api'); assert.equal(sources.get('lsb-laos-phc-2025')?.validationReadiness,'metadata-only');
  assert.equal(sources.get('laolandreg-laos')?.requiresCredential,true); assert.equal(sources.get('laos-electronic-data-law')?.depth,'legal-framework');
  const classification=classifyPostalSourceTrust({countryCode:'LA',source:'Lao Postal Service'}); assert.equal(classification.strength,'weak'); assert.equal(classification.tier,'weak');
});

test('Laos address metadata encodes five digits, delivery hierarchy, non-area objects, explicit buildings, and AGID separation',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'); const value=JSON.parse(readFileSync(resolve(root,'src/data/address_formats/asia/southeast_asia/LA.json'),'utf8')) as {native:{fields:Array<{key:string;required:boolean}>};english:{fields:Array<{key:string;required:boolean}>};postalCode:{format:string;regex:string;api:string;source:string};openSourceIds:string[];addressRules:{regionalHierarchy:string[];postalCode:{label:string;required:boolean;usage:string}}};
  assert.equal(value.postalCode.format,'NNNNN'); assert.equal(value.postalCode.regex,'^\\d{5}$'); assert.match(value.postalCode.api,/laopost\.com\.la\/about\/postcode/i); assert.match(value.postalCode.source,/Lao Postal Service.*Postal Services Law 2013.*Laopedia.*NFMS.*Statistics Bureau/i);
  assert.equal(value.addressRules.postalCode.label,'5 digits when officially assigned'); assert.equal(value.addressRules.postalCode.required,false); assert.match(value.addressRules.postalCode.usage,/delivery-scope.*area.*point.*route.*P\.O\. Box.*(?:not|never).*exact building/i);
  assert.deepEqual(value.addressRules.regionalHierarchy,['province','district','villageOrMunicipality','streetOrMailRoute','buildingPremiseUnitOrPoBox','fiveDigitPostalDeliveryScope','postOfficeMailExchangeOrMailRouteObject','optionalDerivedAdministrativeJoinSurface','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry','agidIndependentSpatialIndex']);
  assert.equal(value.native.fields.some(field=>field.key==='poBox'),true); assert.equal(value.english.fields.some(field=>field.key==='province'),true); assert.equal(value.native.fields.some(field=>field.key==='buildingId'),true); for(const id of EXPECTED)assert.ok(value.openSourceIds.includes(id));
});
