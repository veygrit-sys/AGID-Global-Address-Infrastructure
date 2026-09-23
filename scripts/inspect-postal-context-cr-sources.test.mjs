import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareCodeSets, inspectRights } from './inspect-postal-context-cr-sources.mjs';

test('CR code comparison reports one-sided and common assignments without inventing a join', () => {
  const comparison = compareCodeSets([{ postalCode: '10101' }, { postalCode: 60702 }, { postalCode: '61301' }], ['10101', '61301']);
  assert.deepEqual(comparison.commonCodes, ['10101', '61301']);
  assert.deepEqual(comparison.operatorOnly, ['60702']);
  assert.deepEqual(comparison.geometryOnly, []);
});
test('CR code comparison exposes geometry-only drift', () => {
  const comparison = compareCodeSets([{ postalCode: '10101' }], ['10101', '99999']);
  assert.deepEqual(comparison.geometryOnly, ['99999']);
});
test('CR rights inspection distinguishes access from redistribution permission', () => {
  const metadata = '<mco:useLimitation gco:nilReason="missing"></mco:useLimitation><x codeListValue="Derechos de autor (Copyright)"/>debe ser mencionado en origen y la propiedad';
  const rights = inspectRights(metadata, 'Términos de servicios postales', 'transparencia y libre acceso a la información');
  assert.equal(rights.archiveCopyrightConstraint, true); assert.equal(rights.archiveUseLimitationMissing, true);
  assert.equal(rights.archiveAttributionRequired, true); assert.equal(rights.operatorFreeAccessStatement, true);
  assert.equal(rights.operatorBulkReuseGrant, false);
});
test('CR rights inspection detects an explicit data reuse grant when present', () => {
  const rights = inspectRights('', 'Se autoriza la reutilización y redistribución de datos abiertos.', '');
  assert.equal(rights.operatorBulkReuseGrant, true);
});
