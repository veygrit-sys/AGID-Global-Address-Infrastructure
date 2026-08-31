import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const co = ledger.countries.find(country => country.countryCode === 'CO');
const manifest = readJson('data/postal_country_packs/co/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/co/postal-context/source-profile.json');
const descriptorBytes = readFileSync(new URL('data/postal_country_packs/co/postal-context/m2/descriptor.json', root));
const graphBytes = readFileSync(new URL('data/postal_country_packs/co/postal-context/m2/graph.json', root));
const geometryBytes = readFileSync(new URL('data/postal_country_packs/co/postal-context/m2/geometry.json', root));
const buildBytes = readFileSync(new URL('reports/postal-context-m2/co-build-2026-09-01.json', root));
const sourceBytes = readFileSync(new URL('reports/postal-context-m2/co-source-review-2026-09-01.json', root));
const checksBytes = readFileSync(new URL('reports/postal-context-m2/co-checks-2026-09-01.json', root));
const reportBytes = readFileSync(new URL('docs/postal-context-colombia-m2.md', root));

test('CO reaches M2 only under its exact current national definition', () => {
  assert.equal(co.status, 'm2_verified');
  assert.equal(co.attempts, 1);
  assert.equal(co.blocker, null);
  assert.equal(co.evidence.criterionSatisfied, true);
  assert.equal(co.evidence.synthetic, false);
  assert.equal(co.m2Definition.id, 'M2_current_national_472_derived_area_visualization');
  assert.equal(manifest.repository.maturity, 'M2_national_derived_visualization');
});

test('current assignment denominator and official Polygon code set match exactly', () => {
  const source = JSON.parse(sourceBytes);
  assert.equal(source.assignmentValidation.records, 3681);
  assert.equal(source.assignmentValidation.distinctPostalCodes, 3681);
  assert.equal(source.assignmentValidation.assignmentOnlyCodes, 0);
  assert.equal(source.assignmentValidation.geometryOnlyCodes, 0);
  assert.equal(source.geometryValidation.officialSourceFeatures, 3681);
  assert.equal(source.rightsConclusion.compatibleWithProcessingStorageDerivationRedistributionAndPublicServing, true);
});

test('derived national geometry is deterministic, valid and non-fabricated', () => {
  const build = JSON.parse(buildBytes);
  assert.equal(build.geometry.outputProvenance, 'derived');
  assert.equal(build.geometry.outputMultiPolygons, 3681);
  assert.equal(build.geometry.positions, 312937);
  assert.equal(build.geometry.rings, 4586);
  assert.equal(build.geometry.inventedAreaRows, 0);
  assert.equal(build.policy.officialPostalGeometryClaimed, false);
  assert.equal(build.policy.addressOrBuildingRowsPublished, 0);
  assert.equal(manifest.release_scope.contains_production_geometry, true);
});

test('ledger pins every published CO artifact to immutable commits', () => {
  const expected = [
    [descriptorBytes, 'sha256:e43c1aea64e128eecc999ff33c898b99113bb2f07c84f521fcac47f8951d354a'],
    [graphBytes, 'sha256:a448a4dc5b76a4dd75186cf47e52ccc6242d719707f78d31d6c303ff8a0944df'],
    [geometryBytes, 'sha256:b7c12289fbfef36b6c1739e92f1e356c1529ddc933238d18ff347a8a61133d25'],
    [buildBytes, 'sha256:c5dddb91edf9eb0998567f785aac46bc8bb9fcaefaf719427e629ef5143b8470'],
    [sourceBytes, 'sha256:b3c245e7687d0a1bcf3a238b1e8a03443a170bc1085dc3029436c7fe2979c409'],
    [checksBytes, 'sha256:157076e67c5aeb6a80125298b3d26563705875a3c43e77acaba9b288bd5b4fa3'],
    [reportBytes, 'sha256:32fe63509a8456c30a92f9b3ad771a2282f0d63191e20a76e592e2ad9987e168'],
  ];
  assert.deepEqual(expected.map(([bytes]) => digest(bytes)), expected.map(([, value]) => value));
  assert.deepEqual(co.evidence.artifacts.map(artifact => artifact.digest), expected.map(([, value]) => value));
  assert.ok(co.evidence.artifacts.slice(0, 5).every(artifact => artifact.url.includes('/blob/5afa0ae7a01b23615a56a0d578881ce0ff54539a/')));
  assert.ok(co.evidence.artifacts.slice(5).every(artifact => artifact.url.includes('/blob/3a73f9fadefe31a4e3a4a064bcb6ba45d3bb1382/')));
});

test('runtime evidence includes real map fit, states, metadata and no fabrication', () => {
  assert.equal(co.evidence.validation.passed, 196);
  assert.equal(co.evidence.validation.failed, 0);
  assert.equal(co.evidence.runtime.descriptorDigest, digest(descriptorBytes));
  assert.match(co.evidence.runtime.verificationCommand, /110911/);
  assert.match(co.evidence.runtime.verificationCommand, /bounds fit/);
  assert.match(co.evidence.runtime.verificationCommand, /loading\/no-match\/multiple\/API-failure\/invalid-geometry/);
  assert.match(co.evidence.runtime.verificationCommand, /no fabricated area/);
  assert.equal(profile.m2_release.published_postal_codes, 3681);
});

test('CO completion advances exactly one country to Clipperton Island', () => {
  assert.equal(digest(sourceBytes), co.lastAttempt.reportDigest);
  assert.equal(digest(checksBytes), co.lastAttempt.engineeringReportDigest);
  const cp = ledger.countries.find(country => country.countryCode === 'CP');
  assert.equal(cp.status, 'pending');
  assert.equal(cp.attempts, 0);
});
