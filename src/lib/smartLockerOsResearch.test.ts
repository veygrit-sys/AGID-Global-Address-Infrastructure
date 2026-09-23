import assert from 'node:assert/strict';
import { test } from 'node:test';

import { listLockerSystemCapabilities } from './lockerSystemOs';
import {
  evaluateSmartLockerOsResearch,
  listSmartLockerOsFindings,
  listSmartLockerOsReferences,
  listSmartLockerOsRoadmap,
  renderSmartLockerOsArchitectureMermaid,
  validateSmartLockerOsResearch,
} from './smartLockerOsResearch';

test('smart locker OS research covers the required standards and OSS references', () => {
  const ids = listSmartLockerOsReferences().map(reference => reference.id);

  for (const required of ['mqtt', 'http', 'modbus', 'osdp', 'lwm2m', 'ogc-sensorthings', 'eclipse-ditto', 'openremote']) {
    assert.ok(ids.includes(required), `missing ${required}`);
  }

  assert.equal(validateSmartLockerOsResearch().valid, true);
});

test('smart locker research reflects the existing safe locker capability boundary', () => {
  const capabilities = listLockerSystemCapabilities();
  const evaluation = evaluateSmartLockerOsResearch();

  assert.ok(capabilities.connectorProtocols.includes('mqtt'));
  assert.ok(capabilities.connectorProtocols.includes('http'));
  assert.ok(capabilities.connectorProtocols.includes('modbus'));
  assert.equal(capabilities.privacy.rawAddressStored, false);
  assert.equal(capabilities.privacy.rawNfcPayloadStored, false);
  assert.equal(capabilities.privacy.biometricTemplateStored, false);
  assert.equal(evaluation.implementedOrSimulatedReferences, 3);
});

test('smart locker research does not overclaim production readiness', () => {
  const evaluation = evaluateSmartLockerOsResearch();

  assert.equal(evaluation.productionReady, false);
  assert.ok(evaluation.productionBlockers.includes('research-needed:osdp'));
  assert.ok(evaluation.productionBlockers.includes('research-needed:lwm2m'));
  assert.ok(evaluation.productionBlockers.includes('research-needed:ogc-sensorthings'));
  assert.ok(evaluation.productionBlockers.includes('firmware-update-and-device-attestation-not-modeled'));
  assert.ok(evaluation.productionBlockers.includes('physical-safety-certification-not-claimed'));
});

test('smart locker research keeps local simulator first and hardware adapters behind gates', () => {
  const roadmap = listSmartLockerOsRoadmap();

  assert.equal(roadmap[0].id, 'phase-0-local-simulator');
  assert.ok(roadmap[1].scope.some(item => /desired\/reported\/live/.test(item)));
  assert.ok(roadmap[2].exitCriteria.some(item => /raw register writes/.test(item)));
  assert.ok(roadmap[3].exitCriteria.some(item => /raw address disclosure/.test(item)));
});

test('smart locker findings include privacy, access control, lifecycle, and operator UX', () => {
  const findings = listSmartLockerOsFindings();
  const pillars = new Set(findings.map(finding => finding.pillar));

  assert.ok(pillars.has('privacy-security'));
  assert.ok(pillars.has('access-control'));
  assert.ok(pillars.has('device-management'));
  assert.ok(pillars.has('operator-ux'));
  assert.ok(findings.some(finding => finding.validationGate.includes('no-raw-address')));
});

test('smart locker architecture shows AGID surfaces without exposing raw address data', () => {
  const diagram = renderSmartLockerOsArchitectureMermaid();

  assert.match(diagram, /POS \/ Field Handoff/);
  assert.match(diagram, /Device Twin/);
  assert.match(diagram, /Local MQTT \/ HTTP \/ Modbus Simulator/);
  assert.match(diagram, /Dashboard \/ Review Console/);
  assert.match(diagram, /no raw address/);
});
