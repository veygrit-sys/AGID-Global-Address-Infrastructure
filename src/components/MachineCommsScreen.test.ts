import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'MachineCommsScreen.tsx'), 'utf8');
const rootSource = readFileSync(join(here, '..', 'RootApp.tsx'), 'utf8');

test('machine comms screen renders safe machine protocol concepts without raw-address UI', () => {
  assert.match(source, /AGID\/AOID Machine Link/);
  assert.match(source, /buildMachineCommunicationDemo/);
  assert.match(source, /negotiateMachineCommunication/);
  assert.match(source, /payloadKeys/);
  assert.match(source, /transcriptHash/);
  assert.match(source, /No raw address/);
  assert.match(source, /AGID\/AOID本体なし/);
  assert.doesNotMatch(source, /streetAddress|houseNumber|recipientName|phoneNumber/);
});

test('RootApp registers the machine communication standalone route', () => {
  assert.match(rootSource, /MachineCommsScreen/);
  assert.match(rootSource, /window\.location\.pathname === '\/machine'/);
  assert.match(rootSource, /<MachineCommsScreen \/>/);
});
