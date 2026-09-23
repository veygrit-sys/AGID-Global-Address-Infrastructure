import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_FUNCTION_SPECS,
  ADDRESSQL_OPEN_SOURCE_PLAN,
  ADDRESSQL_PAPER_PLAN,
  ADDRESSQL_RESEARCH_VERSION,
  getAddressQlMvpFunctions,
  validateAddressQlResearchPlan,
} from './addressQlResearch';

test('AddressQL research plan validates as a separate OSS project', () => {
  assert.equal(ADDRESSQL_RESEARCH_VERSION, 'addressql-research-v0.1');
  assert.deepEqual(validateAddressQlResearchPlan(), []);
  assert.equal(ADDRESSQL_OPEN_SOURCE_PLAN.repositoryName, 'addressql');
  assert.equal(ADDRESSQL_OPEN_SOURCE_PLAN.owner, 'dawnportinfo-design');
  assert.equal(ADDRESSQL_OPEN_SOURCE_PLAN.separateFromAmtPaper, true);
});

test('AddressQL keeps a bounded function surface with clear MVP subset', () => {
  const mvp = getAddressQlMvpFunctions();

  assert.equal(ADDRESSQL_FUNCTION_SPECS.length, 52);
  assert.equal(mvp.length, 28);
  assert.ok(mvp.some(spec => spec.name === 'COUNTRY_RESOLVE'));
  assert.ok(mvp.some(spec => spec.name === 'COUNTRY_POSTAL_STATUS'));
  assert.ok(mvp.some(spec => spec.name === 'ADDRESS_MATCH'));
  assert.ok(mvp.some(spec => spec.name === 'POSTAL_STATUS'));
  assert.ok(mvp.some(spec => spec.name === 'POSTAL_FORMAT'));
  assert.ok(mvp.some(spec => spec.name === 'POSTAL_NORMALIZE'));
  assert.ok(mvp.some(spec => spec.name === 'POSTAL_EQUIVALENT'));
  assert.ok(mvp.some(spec => spec.name === 'DELIVERY_AVAILABLE'));
  assert.ok(mvp.some(spec => spec.name === 'ADDRESS_COMMIT'));
  assert.ok(mvp.some(spec => spec.name === 'ADDRESS_PROVE'));
  assert.ok(mvp.some(spec => spec.name === 'ADDRESS_ENVELOPE_CREATE'));
  assert.ok(mvp.some(spec => spec.name === 'ADDRESS_ACK'));
});

test('AddressQL marks raw address hash as discouraged and proof as envelope based', () => {
  const hash = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_HASH');
  const prove = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_PROVE');

  assert.ok(hash);
  assert.equal(hash.phase, 'discouraged');
  assert.equal(hash.privacyRisk, 'unsafe_by_default');
  assert.match(hash.nonClaims.join(' '), /dictionary-attackable/);

  assert.ok(prove);
  assert.ok(prove.inputs.includes('envelope'));
  assert.ok(!prove.inputs.includes('address'));
  assert.ok(prove.compatibleWith.includes('ZK_ADDRESS_PREDICATES'));
});

test('AddressQL adds congestion theory as a bounded mobility layer', () => {
  const congestionFunctions = ADDRESSQL_FUNCTION_SPECS.filter(spec => spec.category === 'congestion_mobility');
  const travelTime = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_TRAVEL_TIME');
  const congestion = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_CONGESTION_SCORE');
  const bottlenecks = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_BOTTLENECKS');

  assert.equal(congestionFunctions.length, 5);
  assert.equal(travelTime?.determinism, 'volatile');
  assert.equal(congestion?.outputKind, 'CongestionScore');
  assert.equal(bottlenecks?.determinism, 'stable_by_source_version');
  assert.match(bottlenecks?.nonClaims.join(' ') ?? '', /may be incomplete/);
});

test('AddressQL country and postal functions model country selection and no-postal fallback', () => {
  const countryFunctions = ADDRESSQL_FUNCTION_SPECS.filter(spec => spec.category === 'country_metadata');
  const postalFunctions = ADDRESSQL_FUNCTION_SPECS.filter(spec => spec.name.startsWith('POSTAL_'));
  const postalEquivalent = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'POSTAL_EQUIVALENT');
  const countryPostalStatus = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'COUNTRY_POSTAL_STATUS');

  assert.equal(countryFunctions.length, 6);
  assert.equal(postalFunctions.length, 10);
  assert.ok(countryFunctions.some(spec => spec.name === 'COUNTRY_RESOLVE'));
  assert.ok(countryFunctions.some(spec => spec.name === 'COUNTRY_SOURCE_POLICY'));
  assert.ok(postalFunctions.some(spec => spec.name === 'POSTAL_REQUIRED'));
  assert.ok(postalFunctions.some(spec => spec.name === 'POSTAL_SUGGEST'));
  assert.equal(postalEquivalent?.phase, 'mvp');
  assert.match(postalEquivalent?.nonClaims.join(' ') ?? '', /not official postal codes/);
  assert.ok(countryPostalStatus?.compatibleWith.includes('POSTAL_THEORY'));
});

test('AddressQL country and postal functions remain source-versioned metadata, not political or identity claims', () => {
  const countryResolve = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'COUNTRY_RESOLVE');
  const postalFormat = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'POSTAL_FORMAT');
  const postalRequired = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'POSTAL_REQUIRED');

  assert.equal(countryResolve?.determinism, 'stable_by_source_version');
  assert.match(countryResolve?.nonClaims.join(' ') ?? '', /not sovereignty adjudication/);
  assert.equal(postalFormat?.privacyRisk, 'low');
  assert.match(postalFormat?.nonClaims.join(' ') ?? '', /format does not prove/);
  assert.match(postalRequired?.nonClaims.join(' ') ?? '', /purpose-relative/);
});

test('AddressQL declares determinism for database adapter safety', () => {
  const normalize = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_NORMALIZE');
  const estimate = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'DELIVERY_ESTIMATE');
  const mask = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_MASK');

  assert.equal(normalize?.determinism, 'stable_by_source_version');
  assert.equal(estimate?.determinism, 'volatile');
  assert.equal(mask?.determinism, 'immutable');
});

test('AddressQL paper plan is separate from AMT but compatible through boundaries', () => {
  assert.equal(ADDRESSQL_PAPER_PLAN.length, 6);
  assert.ok(ADDRESSQL_PAPER_PLAN.every(paper => paper.mustNotMixWithAmtPaper));
  assert.ok(ADDRESSQL_PAPER_PLAN.some(paper => paper.id === 'addressql-privacy-proof'));
  assert.ok(ADDRESSQL_PAPER_PLAN.some(paper => paper.id === 'addressql-congestion-mobility'));
  assert.ok(ADDRESSQL_PAPER_PLAN.some(paper => paper.id === 'addressql-adapter-conformance'));
});

test('AddressQL docs state separation, function classes, and release gates', () => {
  const readme = readFileSync('docs/addressql/README.md', 'utf8');
  const spec = readFileSync('docs/addressql/specification-v0.1.md', 'utf8');
  const research = readFileSync('docs/addressql/research-plan.md', 'utf8');

  assert.match(readme, /must not be merged into the AMT paper/);
  assert.match(readme, /dawnportinfo-design\/addressql/);
  assert.match(spec, /ADDRESS_ENVELOPE_CREATE/);
  assert.match(spec, /ADDRESS_HASH/);
  assert.match(spec, /unsafe-by-default/);
  assert.match(spec, /Determinism/);
  assert.match(research, /AddressQL: Query Semantics for Structured Address Data/);
  assert.match(research, /Adapter Conformance/);
});
