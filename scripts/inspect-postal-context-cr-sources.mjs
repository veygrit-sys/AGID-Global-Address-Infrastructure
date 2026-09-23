import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED = {
  'correos-codigo-postal.html': 'fc55ac59b4da34d99d49c99be69734febdabee5e75f53a63bbd7d8f848c861b6',
  'correos-postal-observation.json': '942b9b9ef78b363760255a45985072035501297ac895c1a0ce2a11d1b50704ab',
  'correos-terms.html': '27a95e39bf30b6a1a89b5a6d799792702033c008c0478bfdf41f6673be55132d',
  'correos-institutional.html': 'a1ba1c3d6ff764a8263c0848a6c1149a2bd862db9f664e322440771aa8f19d58',
  'inec-uged-admin.html': '4155e60c2c01c91fda04e54fcee0612a3efc9f3a6e3362651921a9a1b61040d1',
  'UGED_MGN_2024.zip': '4fe036a4a4eec834810065ba66248e67566b81afb527991a2df0ef3cdb833238',
};
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function readExact(directory, name) {
  const bytes = readFileSync(resolve(directory, name));
  assert.equal(sha256(bytes), EXPECTED[name], `CR source digest drift: ${name}`);
  return bytes;
}
function compareCodeSets(operatorRows, geometryCodes) {
  const operator = new Set(operatorRows.map(row => String(row.postalCode)));
  const geometry = new Set(geometryCodes.map(String));
  return {
    operatorCodes: operator.size,
    geometryCodes: geometry.size,
    commonCodes: [...operator].filter(code => geometry.has(code)).sort(),
    operatorOnly: [...operator].filter(code => !geometry.has(code)).sort(),
    geometryOnly: [...geometry].filter(code => !operator.has(code)).sort(),
  };
}
function inspectRights(metadataXml, operatorTerms, operatorInstitutional) {
  return {
    archiveCopyrightConstraint: /codeListValue="Derechos de autor \(Copyright\)"/u.test(metadataXml),
    archiveUseLimitationMissing: /<mco:useLimitation gco:nilReason="missing">/u.test(metadataXml),
    archiveAttributionRequired: /debe ser mencionado en origen y la propiedad/iu.test(metadataXml),
    operatorFreeAccessStatement: /libre acceso a la información/iu.test(operatorInstitutional),
    operatorBulkReuseGrant: /(redistribuci[oó]n|reutilizaci[oó]n|licencia de datos|datos abiertos)/iu.test(operatorTerms),
  };
}
function inspectCostaRicaSources(directory, { ogrinfo = 'ogrinfo', tar = 'tar' } = {}) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(directory, name)]));
  const page = receipts['correos-codigo-postal.html'].toString('utf8');
  for (const endpoint of ['/web/canton', '/web/distrito', '/web/codigo']) assert.match(page, new RegExp(endpoint));
  const observation = JSON.parse(receipts['correos-postal-observation.json'].toString('utf8'));
  assert.equal(observation.provinces, 7); assert.equal(observation.cantons, 84); assert.equal(observation.districts, 493);
  assert.equal(observation.rows.length, 493); assert.equal(new Set(observation.rows.map(row => String(row.postalCode))).size, 493);
  assert.ok(observation.rows.every(row => row.enabled === 1 && /^\d{5}$/u.test(String(row.postalCode))));
  const zip = resolve(directory, 'UGED_MGN_2024.zip');
  const vsi = '/vsizip/' + zip.replaceAll('\\', '/');
  const ogr = spawnSync(ogrinfo, ['-json', '-al', '-features', '-geom=NO', vsi], { encoding: 'utf8', maxBuffer: 20_000_000 });
  assert.equal(ogr.status, 0, ogr.stderr);
  const layer = JSON.parse(ogr.stdout).layers[0];
  assert.equal(layer.name, 'Unidad Geoestadística Distrital 2024'); assert.equal(layer.featureCount, 492);
  assert.equal(layer.geometryFields[0].type, 'Polygon'); assert.match(layer.geometryFields[0].coordinateSystem.wkt, /EPSG",8908/u);
  const geometryCodes = layer.features.map(feature => feature.properties.COD_UGED);
  assert.equal(geometryCodes.length, 492); assert.equal(new Set(geometryCodes).size, 492);
  const comparison = compareCodeSets(observation.rows, geometryCodes);
  assert.equal(comparison.commonCodes.length, 492); assert.deepEqual(comparison.operatorOnly, ['60702']); assert.deepEqual(comparison.geometryOnly, []);
  const puertoJimenez = observation.rows.filter(row => ['60702', '61301'].includes(String(row.postalCode)));
  assert.deepEqual(puertoJimenez.map(row => String(row.postalCode)).sort(), ['60702', '61301']);
  assert.ok(puertoJimenez.every(row => /Puerto Jimenez/iu.test(row.districtName) && row.enabled === 1));
  const xml = spawnSync(tar, ['-xOf', zip, 'Metadato_UGED.xml'], { encoding: 'utf8', maxBuffer: 1_000_000 });
  assert.equal(xml.status, 0, xml.stderr);
  const rights = inspectRights(xml.stdout, receipts['correos-terms.html'].toString('utf8'), receipts['correos-institutional.html'].toString('utf8'));
  assert.deepEqual(rights, { archiveCopyrightConstraint: true, archiveUseLimitationMissing: true,
    archiveAttributionRequired: true, operatorFreeAccessStatement: true, operatorBulkReuseGrant: false });
  const inecPage = receipts['inec-uged-admin.html'].toString('utf8');
  assert.match(inecPage, /Unidad%20Geoestad%C3%ADstica%20Distrital%202024\.zip/iu);
  assert.match(inecPage, /evitan la tenencia de los l[ií]mites imaginarios/iu);
  return { countryCode: 'CR', observedAt: observation.observedAt, receipts: Object.entries(receipts).map(([name, bytes]) =>
    ({ name: basename(name), bytes: bytes.length, sha256: sha256(bytes) })), operator: { provinces: 7, cantons: 84,
    enabledDistrictRows: observation.rows.length, uniquePostalCodes: 493 }, geometry: { release: 'UGED 2024', features: 492,
    uniqueCodes: 492, type: 'Polygon', crs: 'EPSG:8908' }, comparison: { commonCodes: comparison.commonCodes.length,
    operatorOnly: comparison.operatorOnly, geometryOnly: comparison.geometryOnly, ambiguousEnabledAliasCodes: ['60702', '61301'] }, rights };
}
export { compareCodeSets, inspectCostaRicaSources, inspectRights };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error('usage: node scripts/inspect-postal-context-cr-sources.mjs <source-directory>');
  console.log(JSON.stringify(inspectCostaRicaSources(process.argv[2]), null, 2));
}
