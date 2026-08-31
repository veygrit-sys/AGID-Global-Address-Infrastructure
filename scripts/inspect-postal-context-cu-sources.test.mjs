import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inspectOfficePayload, inspectRights } from './inspect-postal-context-cu-sources.mjs';

const office = codigo_postal => ({ nombre: 'Office', direccion: 'Public office', telefonos: 'public', codigo_postal,
  hora_cierre: '17:00', automatizada: '1', pagadora: '1', hora_apertura: '08:00', municipio: 'M', provincia: 'P',
  id_provincia: '1', giros_internacionales: '0', orden_estructura: '100' });

test('CU office payload remains a non-area office directory', () => {
  const result = inspectOfficePayload({ total: 841, datos: Array.from({ length: 10 }, (_, i) => office(String(10000 + i))) });
  assert.equal(result.total, 841);
  assert.equal(result.observedRows, 10);
  assert.deepEqual(result.geometryFields, []);
});

test('CU office payload rejects geometry-like fields instead of treating an office as an area', () => {
  const rows = Array.from({ length: 10 }, (_, i) => office(String(10000 + i)));
  rows[0].geometry = { type: 'Point', coordinates: [-82, 23] };
  assert.throws(() => inspectOfficePayload({ total: 841, datos: rows }));
});

test('UPU rights and product text separate lookup access from redistribution and geometry', () => {
  const rights = inspectRights(
    'without permission in writing from the UPU; not to duplicate the document or parts thereof for distribution or sale external',
    'postcode and locality verification',
  );
  assert.deepEqual(rights, {
    upuWrittenPermissionRequired: true,
    upuExternalDistributionOrSaleProhibited: true,
    upuProductDescribesPostcodeAndLocalityValidation: true,
    upuProductDescribesPostalAreaGeometry: false,
  });
});

test('an explicit polygon claim is detected but does not itself grant rights', () => {
  const rights = inspectRights('', 'postcode and locality verification with Polygon output');
  assert.equal(rights.upuProductDescribesPostalAreaGeometry, true);
  assert.equal(rights.upuWrittenPermissionRequired, false);
});
