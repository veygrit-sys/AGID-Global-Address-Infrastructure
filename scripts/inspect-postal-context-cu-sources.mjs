import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED = {
  'correos-home.html': '7d190d6e481848a765676c9fa1c5eee0ebc1050b59ea5dbc7eccca77849102f0',
  'correos-regulations.html': '0010fd8f1f520a8f405e1845ea701f13813456e4e26a982e572d2f21298231b5',
  'correos-service-points.html': '66b22592de3685f8f35a108a0a8b4c058fad92028a73e9df44787a1243e16f17',
  'correos-oficinas.js': '7a99c0bca70053c1cbda6ed90fd6c80207efd36530ba09fb0ef721504c6ba555',
  'correos-offices-query.json': '96e75f85d785c5a492c86ab70423049a49a6a92b319b28a69d40408c6e75a660',
  'upu-cuba-addressing.pdf': '70f892382ffbd36f8588005c50ef1b5df9951893c6eec29494fe242fafb9d334',
  'upu-postcode-product.html': '3cefb72cb4cf109c3d96d7286fca52adfadbd4405340001e5e96abdf75d83223',
  'upu-copyright.html': '096ca5e9a8b1db57347b4798fb67d1c716f076b58c76ed6b3d7a97ddbcd2a31e',
  'upu-disclaimer.html': '23289c0a672b50e0d7891e7ce854a724abe77de1e136f50d9403e0bd6dbea001',
  'upu-postcode-api-guide.pdf': '15d2e56f3c4449516af99b21bff96ac23a2241293e24c0a35d2912637b254acb',
  'upu-postcode-api-cds-guide.pdf': 'ed73bf6c00a5976f51ea0b1aa2754debc9a9d9d3c2e6676a41e36fe4879530d3',
};

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function readExact(directory, name) {
  const bytes = readFileSync(resolve(directory, name));
  assert.equal(sha256(bytes), EXPECTED[name], `CU source digest drift: ${name}`);
  return bytes;
}

function inspectOfficePayload(payload) {
  const total = Number(payload.total);
  assert.equal(total, 841);
  assert.equal(payload.datos.length, 10);
  const fields = Object.keys(payload.datos[0]).sort();
  const geometryFields = fields.filter(field => /^(?:geo|lat|lon|polygon|geometry|bbox|coord)/iu.test(field));
  assert.deepEqual(geometryFields, []);
  assert.ok(payload.datos.every(row => /^\d{5}$/u.test(String(row.codigo_postal))));
  return { total, observedRows: payload.datos.length, fields, geometryFields };
}

function inspectRights(copyrightPage, productPage) {
  return {
    upuWrittenPermissionRequired: /without permission in writing from the UPU/iu.test(copyrightPage),
    upuExternalDistributionOrSaleProhibited: /not to duplicate the document or parts thereof for distribution or sale external/iu.test(copyrightPage),
    upuProductDescribesPostcodeAndLocalityValidation: /postcode.*locality verification/isu.test(productPage),
    upuProductDescribesPostalAreaGeometry: /Polygon|MultiPolygon/iu.test(productPage),
  };
}

function inspectCubaSources(directory) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(directory, name)]));
  const servicePage = receipts['correos-service-points.html'].toString('utf8');
  assert.match(servicePage, /cuenta con 812 oficinas de correos/iu);
  assert.match(servicePage, /C(?:&oacute;|ó|o)digo postal:/iu);
  const officeScript = receipts['correos-oficinas.js'].toString('utf8');
  for (const field of ['nombre', 'direccion', 'telefonos', 'codigo_postal', 'municipio', 'provincia']) assert.match(officeScript, new RegExp(`item\\.${field}`));
  const office = inspectOfficePayload(JSON.parse(receipts['correos-offices-query.json'].toString('utf8')));
  const rights = inspectRights(receipts['upu-copyright.html'].toString('utf8'), receipts['upu-postcode-product.html'].toString('utf8'));
  assert.deepEqual(rights, {
    upuWrittenPermissionRequired: true,
    upuExternalDistributionOrSaleProhibited: true,
    upuProductDescribesPostcodeAndLocalityValidation: true,
    upuProductDescribesPostalAreaGeometry: false,
  });
  return {
    countryCode: 'CU',
    observedAt: '2026-08-31T22:07:06.826Z',
    receipts: Object.entries(receipts).map(([name, bytes]) => ({ name: basename(name), bytes: bytes.length, sha256: sha256(bytes) })),
    officeDirectory: { ...office, pageNarrativeOffices: 812, narrativeAndApiCountAgree: false, objectClass: 'postal-office-point-records' },
    rights,
    upu: { addressingSheetDate: '09/2004', apiKeyRequired: true, cdsSecurityTokenRequired: true, polygonOrMultiPolygonFieldsDocumented: false },
    productionEligibleRecords: 0,
  };
}

export { inspectCubaSources, inspectOfficePayload, inspectRights };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error('usage: node scripts/inspect-postal-context-cu-sources.mjs <source-directory>');
  console.log(JSON.stringify(inspectCubaSources(process.argv[2]), null, 2));
}
