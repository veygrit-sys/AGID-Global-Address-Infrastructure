import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const EXPECTED=["afghan-post","afghan-postal-code-system","upu-afghanistan-addressing-2025","afghan-post-policy","ocha-afghanistan-admin-boundaries-2026","hot-osm-afghanistan","osm-afghanistan"] as const;

test('Afghanistan registry separates operator, live map, UPU, policy, administration, HOT, and OSM evidence',()=>{
  const ids=getAsiaOpenSourceIds('AF'); for(const id of EXPECTED){assert.ok(ids.includes(id));assert.equal(ASIA_OPEN_GEO_SOURCES[id].id,id);assert.equal(ASIA_OPEN_GEO_SOURCES[id].url.startsWith('http'),true);}
  assert.match(ASIA_OPEN_GEO_SOURCES['afghan-post'].notes,/official postal-operator.*all rights reserved.*not bulk.*geometry.*building/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['afghan-postal-code-system'].notes,/six-digit postcode.*postal-area GeoJSON.*home numbers.*exact response.*not.*bulk-data.*personal-address/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['upu-afghanistan-addressing-2025'].notes,/1 October 2024.*province 10-43.*city district 01-50.*rural district 51-99.*delivery zone 01-99/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['afghan-post-policy'].notes,/standardizing postal addresses.*numbering.*not.*assignment row.*polygon.*reuse grant/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['ocha-afghanistan-admin-boundaries-2026'].notes,/AGCHO.*NSIA.*34 provinces.*401.*CC BY 3\.0 IGO.*457.*not postcodes/i);
  assert.match(ASIA_OPEN_GEO_SOURCES['hot-osm-afghanistan'].notes,/humanitarian.*roads.*buildings/i);
});

test('Afghanistan official catalog exposes matching authority, transition, map, and licence boundaries',()=>{
  const sources=new Map(getOfficialPostalSourcesForCountry('AF').map(source=>[source.id,source]));
  assert.equal(sources.get('afghan-post')?.authority,'postal-operator'); assert.equal(sources.get('afghan-post')?.validationReadiness,'metadata-only');
  assert.equal(sources.get('afghan-postal-code-system')?.depth,'address'); assert.equal(sources.get('afghan-postal-code-system')?.validationReadiness,'metadata-only');
  assert.equal(sources.get('upu-afghanistan-addressing-2025')?.sourceRole,'legal-framework-only'); assert.equal(sources.get('afghan-post-policy')?.depth,'legal-framework');
  assert.equal(sources.get('ocha-afghanistan-admin-boundaries-2026')?.availability,'bulk-open-data'); assert.equal(sources.get('ocha-afghanistan-admin-boundaries-2026')?.trustTier,'official-derived');
  const classification=classifyPostalSourceTrust({countryCode:'AF',source:'Afghan Post'}); assert.equal(classification.strength,'weak'); assert.equal(classification.tier,'weak');
});

test('Afghanistan address metadata encodes current six digits, postal geometry gates, explicit buildings, and AGID separation',()=>{
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'); const value=JSON.parse(readFileSync(resolve(root,'src/data/address_formats/asia/south_asia/AF.json'),'utf8')) as {native:{fields:Array<{key:string;required:boolean}>};english:{fields:Array<{key:string;required:boolean}>};postalCode:{format:string;regex:string;api:string;source:string};openSourceIds:string[];addressRules:{regionalHierarchy:string[];postalCode:{label:string;required:boolean;usage:string}}};
  assert.equal(value.postalCode.format,'NNNNNN'); assert.equal(value.postalCode.regex,'^\\d{6}$'); assert.match(value.postalCode.api,/postalcode\.afghanpost\.gov\.af/i); assert.match(value.postalCode.source,/Afghan Post.*UPU.*07\/2025.*OCHA.*2026/i);
  assert.equal(value.addressRules.postalCode.label,'6 digits required for postal addressing'); assert.equal(value.addressRules.postalCode.required,true); assert.match(value.addressRules.postalCode.usage,/province.*city or rural district.*delivery zone.*postal-area-first.*P-code.*not.*reusable polygon.*building relation/i);
  assert.deepEqual(value.addressRules.regionalHierarchy,['provincePrefix10To43','cityDistrict01To50OrRuralDistrict51To99','postalDeliveryZone01To99','officialSixDigitPostalAssignment','afghanPostAddressPostOfficeOrPoBoxObject','officialPostalAreaGeometryWhenExactlyRightsCleared','administrativePcodeIndependentFromPostcode','optionalDerivedPostalAdministrativeJoinSurface','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry','agidIndependentSpatialIndex']);
  assert.equal(value.native.fields.some(field=>field.key==='poBox'),true); assert.equal(value.english.fields.some(field=>field.key==='additionalDeliveryInformation'),true); assert.equal(value.native.fields.some(field=>field.key==='buildingId'),true); for(const id of EXPECTED)assert.ok(value.openSourceIds.includes(id));
});
