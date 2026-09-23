import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION,
  ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS,
  buildAddressPrivacyThreatModelTemplatePack,
  getAddressPrivacyThreatModelTemplate,
  renderAddressPrivacyThreatModelTemplateMarkdown,
  validateAddressPrivacyThreatModelTemplatePack,
  type AddressPrivacyThreatModelTemplatePack,
} from './addressPrivacyThreatModelTemplates';
import { scanNoRawAddressReleaseText } from './noRawAddressReleaseScan';

function clonePack(pack: AddressPrivacyThreatModelTemplatePack): AddressPrivacyThreatModelTemplatePack {
  return JSON.parse(JSON.stringify(pack)) as AddressPrivacyThreatModelTemplatePack;
}

test('builds an OSS-safe Address Privacy Threat Model Template pack', () => {
  const pack = buildAddressPrivacyThreatModelTemplatePack();

  assert.equal(pack.manifest.kitId, 'address-privacy-threat-model-templates');
  assert.equal(pack.manifest.version, ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES_VERSION);
  assert.equal(pack.manifest.counts.templates, ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS.length);
  assert.equal(pack.manifest.counts.templates, pack.templates.length);
  assert.equal(pack.manifest.counts.checklists, pack.checklists.length);
  assert.ok(pack.manifest.privacyPosition.includes('local-first'));
  assert.ok(pack.manifest.privacyPosition.includes('Ethereum-optional'));
  assert.ok(pack.manifest.privacyPosition.includes('no-raw-address-by-default'));

  for (const file of pack.manifest.files) {
    assert.equal(file.containsPersonalData, false);
    assert.equal(file.containsRawAddressData, false);
    assert.equal(file.containsThirdPartyData, false);
  }
});

test('validates the generated Address Privacy Threat Model Template pack', () => {
  const validation = validateAddressPrivacyThreatModelTemplatePack(buildAddressPrivacyThreatModelTemplatePack());

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('covers the major privacy-critical AGID surfaces', () => {
  const pack = buildAddressPrivacyThreatModelTemplatePack();
  const ids = pack.templates.map(template => template.id);

  assert.deepEqual(ids, [...ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS]);
  assert.ok(ids.includes('address-element-registration'));
  assert.ok(ids.includes('address-portal-consent'));
  assert.ok(ids.includes('pos-terminal-handoff'));
  assert.ok(ids.includes('field-handoff-offline'));
  assert.ok(ids.includes('evidence-vault-local-ocr'));
  assert.ok(ids.includes('hosted-registry-webhooks'));
  assert.ok(ids.includes('zk-address-predicate'));
  assert.ok(ids.includes('agid-s-qr-nfc'));
  assert.ok(ids.includes('locker-pudo-simulator'));
  assert.ok(ids.includes('developer-console-fixtures'));
});

test('every template has actionable assets, boundaries, attacker inputs, controls, and verification', () => {
  const pack = buildAddressPrivacyThreatModelTemplatePack();

  for (const template of pack.templates) {
    assert.ok(template.protectedAssets.length > 0, template.id);
    assert.ok(template.trustBoundaries.length > 0, template.id);
    assert.ok(template.attackerControlledInputs.length > 0, template.id);
    assert.ok(template.misuseCases.length >= 2, template.id);
    assert.ok(template.requiredInvariants.some(rule => /No raw address/i.test(rule)), template.id);
    assert.ok(template.requiredInvariants.some(rule => /AOID/i.test(rule)), template.id);
    assert.ok(template.forbiddenOutputs.includes('plain address body'), template.id);
    assert.ok(template.safePublicOutputs.includes('nullifierHash'), template.id);
    assert.ok(template.highRiskModeRequirements.length > 0, template.id);
    assert.ok(template.verificationCommands.some(command => command.includes('verify:')), template.id);
  }
});

test('ZK, registry, and AGID-S templates explicitly defend against linkability and plaintext leakage', () => {
  const zk = getAddressPrivacyThreatModelTemplate('zk-address-predicate');
  const registry = getAddressPrivacyThreatModelTemplate('hosted-registry-webhooks');
  const agidS = getAddressPrivacyThreatModelTemplate('agid-s-qr-nfc');

  assert.ok(zk.misuseCases.some(item => item.categories.includes('linkability')));
  assert.ok(zk.dataMinimizationRules.some(rule => /Witnesses never leave/i.test(rule)));
  assert.ok(registry.misuseCases.some(item => /Nullifier reused/i.test(item.title)));
  assert.ok(registry.dataMinimizationRules.some(rule => /roots, commitments, nullifiers/i.test(rule)));
  assert.ok(agidS.misuseCases.some(item => /Copied AGID-S/i.test(item.title)));
  assert.ok(agidS.dataMinimizationRules.some(rule => /not plaintext/i.test(rule)));
});

test('rendered markdown templates are safe for public release scanning', () => {
  const pack = buildAddressPrivacyThreatModelTemplatePack();

  for (const template of pack.templates) {
    const markdown = renderAddressPrivacyThreatModelTemplateMarkdown(template);
    const scan = scanNoRawAddressReleaseText(markdown);

    assert.equal(scan.valid, true, template.id);
    assert.match(markdown, /^# /);
    assert.ok(markdown.includes('## Misuse Cases'));
    assert.ok(markdown.includes('## Required Invariants'));
    assert.ok(markdown.includes('## Verification Commands'));
  }
});

test('validation catches damaged templates before export', () => {
  const broken = clonePack(buildAddressPrivacyThreatModelTemplatePack());
  broken.templates[0].protectedAssets = [];
  broken.templates[0].misuseCases = broken.templates[0].misuseCases.slice(0, 1);

  const validation = validateAddressPrivacyThreatModelTemplatePack(broken);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes(`missing-assets:${broken.templates[0].id}`));
  assert.ok(validation.errors.includes(`not-enough-misuse-cases:${broken.templates[0].id}`));
});
