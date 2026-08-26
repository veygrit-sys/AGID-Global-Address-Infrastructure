import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AMERICAS_OPEN_GEO_SOURCES, getAmericasOpenSourceIds } from './americasOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';
const EXPECTED = ['correios-cep-api', 'correios-dne-licensing', 'upu-brazil-addressing', 'ibge-cnefe-2022', 'ibge-municipal-mesh-2024', 'ibge-cartographic-base-2023', 'inde-brazil', 'osm-brazil', 'viacep-br', 'brasilapi'] as const;
const CATALOG = ['correios-cep-api', 'correios-dne-licensing', 'upu-brazil-addressing', 'ibge-cnefe-2022', 'ibge-municipal-mesh-2024', 'ibge-cartographic-base-2023', 'inde-brazil'] as const;

test('Brazilian registry separates Correios, DNE, UPU, CNEFE, administration, cartography, catalog, third-party, and community evidence', () => {
  const ids = getAmericasOpenSourceIds('BR');
  for (const id of EXPECTED) { assert.ok(ids.includes(id), id); assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].id, id); assert.equal(AMERICAS_OPEN_GEO_SOURCES[id].url.startsWith('http'), true); }
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correios-cep-api'].notes, /eight digits.*typed.*contract.*not.*polygon/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['correios-dne-licensing'].license ?? '', /commercial.*purpose/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['upu-brazil-addressing'].notes, /eight-digit.*address.*not.*current/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ibge-cnefe-2022'].notes, /address.*NV_GEO_COORD.*not.*postal.*building/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['ibge-municipal-mesh-2024'].notes, /administrative.*not postal/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['viacep-br'].notes, /third-party.*never.*Correios/i);
  assert.match(AMERICAS_OPEN_GEO_SOURCES['osm-brazil'].license ?? '', /ODbL/i);
});

test('Brazilian catalog keeps Correios authoritative while contextual and third-party sources cannot promote geometry', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('BR').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('correios-cep-api')?.trustTier, 'authoritative'); assert.equal(sources.get('correios-cep-api')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('correios-cep-api')?.validationReadiness, 'reference-eligible'); assert.equal(sources.get('correios-dne-licensing')?.availability, 'licensed-bulk-data');
  assert.equal(sources.get('upu-brazil-addressing')?.sourceRole, 'context-only'); assert.equal(sources.get('ibge-cnefe-2022')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('ibge-municipal-mesh-2024')?.sourceRole, 'context-only'); assert.equal(sources.get('inde-brazil')?.sourceRole, 'context-only');
  const classification = classifyPostalSourceTrust({ countryCode: 'BR', sourceIds: ['correios-cep-api'], source: 'Correios Busca CEP API' });
  assert.equal(classification.strength, 'strong'); assert.equal(classification.tier, 'authoritative');
});

test('Brazilian address metadata encodes canonical CEP, specialist fields, typed objects, CNEFE quality, building boundaries, and AGID', () => {
  const here = dirname(fileURLToPath(import.meta.url)); const value = JSON.parse(readFileSync(resolve(here, 'address_formats/americas/south_america/BR.json'), 'utf8')) as any;
  assert.equal(value.postalCode.format, 'NNNNN-NNN'); assert.equal(new RegExp(value.postalCode.regex).test('99999-999'), true);
  assert.equal(new RegExp(value.postalCode.regex).test('99999999'), true); assert.equal(new RegExp(value.postalCode.regex).test('BR-99999-999'), false);
  assert.match(value.postalCode.source, /Correios.*DNE.*UPU.*CNEFE 2022.*municipal mesh 2024.*cartographic base 2023/i);
  assert.match(value.addressRules.postalCode.usage, /area-or-non-area.*logradouro.*building.*CNEFE.*NV_GEO_COORD.*exact building.*AGID/i);
  for (const key of ['recipient', 'attention', 'organization', 'streetType', 'street', 'houseNumber', 'complement', 'buildingName', 'floor', 'unit', 'neighborhood', 'districtOrLocality', 'municipality', 'state', 'brasiliaSector', 'quadra', 'bloco', 'poBox', 'communityMailbox', 'postOffice', 'postcode']) assert.ok(value.native.fields.some((item: any) => item.key === key), key);
  assert.ok(value.native.fields.every((item: any) => item.placeholder === '')); for (const id of EXPECTED) assert.ok(value.openSourceIds.includes(id), id);
});
