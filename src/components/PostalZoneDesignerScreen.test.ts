import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'PostalZoneDesignerScreen.tsx'), 'utf8');

test('Postal Zone Designer screen wires the design workspace, country selector, and template selector', () => {
  assert.match(source, /buildPostalZoneDesignerWorkspace/);
  assert.match(source, /listPostalZoneDesignerCountries/);
  assert.match(source, /listPostalZoneDesignerTemplates/);
  assert.match(source, /value=\{countryCode\}/);
  assert.match(source, /value=\{templateId\}/);
});

test('Postal Zone Designer screen exposes math, GIS, governance, privacy, VPL, and edit ledger sections', () => {
  assert.match(source, /mathChecks/);
  assert.match(source, /gisChecks/);
  assert.match(source, /governance/);
  assert.match(source, /privacy/);
  assert.match(source, /Virtual Postal Locality/);
  assert.match(source, /vplDesign/);
  assert.match(source, /publicSafeByAverageAddressCount/);
  assert.match(source, /editLedger/);
  assert.match(source, /safeExport/);
});

test('Postal Zone Designer screen exposes country, format, boundary, and VPL design flow controls', () => {
  assert.match(source, /countryProfile/);
  assert.match(source, /sourceNote/);
  assert.match(source, /formatOptions\.slice/);
  assert.match(source, /simulateCrossMunicipality/);
  assert.match(source, /extraMunicipalityIds/);
  assert.match(source, /friendlyTheoremLabel/);
  assert.match(source, /virtualLocalityCodes\.observedMinHammingDistance/);
  assert.match(source, /virtualLocalityNeed\.rationale/);
});

test('Postal Zone Designer screen lets operators forge postal zones while looking at a map', () => {
  assert.match(source, /PostalForgeMapCanvas/);
  assert.match(source, /buildPostalForgeMapZones/);
  assert.match(source, /mapBuilder/);
  assert.match(source, /mapFirstWorkspace/);
  assert.match(source, /mapFirstWorkbench/);
  assert.match(source, /AGID cells/);
  assert.match(source, /VPL hints/);
  assert.match(source, /safety boundaries/);
  assert.match(source, /onSelectMunicipality/);
});

test('Postal Zone Designer screen gives operators a guided postal-code creation console', () => {
  assert.match(source, /creationConsole/);
  assert.match(source, /candidatePostalCode/);
  assert.match(source, /createDraft/);
  assert.match(source, /copyCandidatePostalCode/);
  assert.match(source, /draftHistory/);
  assert.match(source, /selectedScopeText/);
  assert.match(source, /agid-page-scroll bg-\[#eef4f8\]/);
});

test('Postal Zone Designer screen is map-first and does not duplicate the forge map', () => {
  const mapFirstIndex = source.indexOf('aria-label={t.mapFirstWorkspace}');
  const consoleIndex = source.indexOf('{t.creationConsole}');
  assert.notEqual(mapFirstIndex, -1);
  assert.notEqual(consoleIndex, -1);
  assert.ok(mapFirstIndex < consoleIndex);

  const mapRenderCount = (source.match(/<PostalForgeMapCanvas/g) || []).length;
  assert.equal(mapRenderCount, 1);
});

test('Postal Zone Designer screen exposes Postal Forge creation operations', () => {
  assert.match(source, /buildAgidPostalForgeProgramPlan/);
  assert.match(source, /countryPackDashboard/);
  assert.match(source, /splitMergePlanner/);
  assert.match(source, /codePreview/);
  assert.match(source, /qualityGate/);
  assert.match(source, /countryPackRecord/);
  assert.match(source, /lazyLoad\.countryPackPath/);
  assert.match(source, /release\.gates/);
});

test('Postal Zone Designer screen includes a map-first postcode builder studio layout', () => {
  assert.match(source, /Postcode Builder/);
  assert.match(source, /generationMode/);
  assert.match(source, /displayLayers/);
  assert.match(source, /searchPlaceholder/);
  assert.match(source, /splitTool/);
  assert.match(source, /selectedAreaInfo/);
  assert.match(source, /verificationChecks/);
  assert.match(source, /multilingualPreview/);
  assert.match(source, /postalCodeList/);
  assert.match(source, /minimumSimulator/);
  assert.match(source, /approvalFlow/);
});

test('Postal Zone Designer screen shows real no-postal-country generation examples', () => {
  assert.match(source, /realCountryExample/);
  assert.match(source, /loadFijiExample/);
  assert.match(source, /generatedExamples/);
  assert.match(source, /exampleGeneration\.candidates/);
  assert.match(source, /exampleCandidateLabel/);
  assert.match(source, /rawAddressFree/);
});

test('Postal Zone Designer screen includes an explicit official-status guard', () => {
  assert.match(source, /does not claim official national status/);
  assert.match(source, /公式国家郵便番号とは表示しません/);
  assert.match(source, /officialGuard/);
  assert.match(source, /draftOnly/);
});

test('Postal Zone Designer screen source avoids storing personal data fields', () => {
  assert.doesNotMatch(source, /recipientSecret\s*:/);
  assert.doesNotMatch(source, /phoneNumber\s*:/);
  assert.doesNotMatch(source, /personalAddress\s*:/);
  assert.doesNotMatch(source, /privateKey\s*:/);
});
