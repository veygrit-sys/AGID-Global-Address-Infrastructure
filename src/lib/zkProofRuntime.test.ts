import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getActiveZkPredicateBackend,
  getZkProofRuntimeProfile,
  getZkProofRuntimeRecommendation,
  pointInZkBoundingBox,
  pointInZkCircle,
  qualityThresholdSatisfied,
} from './zkProofRuntime';

describe('ZK proof runtime policy', () => {
  it('keeps TypeScript as the envelope layer and prefers non-TS backends for proof predicates and circuits', () => {
    const profile = getZkProofRuntimeProfile();

    assert.equal(profile.envelopeRuntime.primaryLanguage, 'TypeScript');
    assert.equal(profile.predicateRuntime.preferredLanguage, 'Rust');
    assert.equal(profile.formalProofRuntime.preferredLanguage, 'Noir/Circom/Rust-ZKVM');
    assert.notEqual(profile.formalProofRuntime.primaryLanguage, 'TypeScript');

    const predicateRecommendation = getZkProofRuntimeRecommendation('witness-predicate-evaluation');
    assert.equal(predicateRecommendation.rewriteFromTypeScript, true);
    assert.ok(predicateRecommendation.preferredBackends.includes('rust-wasm'));

    const envelopeRecommendation = getZkProofRuntimeRecommendation('proof-envelope-api');
    assert.equal(envelopeRecommendation.rewriteFromTypeScript, false);
  });

  it('evaluates quality-threshold predicates through the active ZKP predicate backend boundary', () => {
    const backend = getActiveZkPredicateBackend();

    assert.match(backend, /^(rust-wasm|typescript-fallback)$/u);
    assert.deepEqual(qualityThresholdSatisfied(92, 85), { satisfied: true, backend });
    assert.deepEqual(qualityThresholdSatisfied(84, 85), { satisfied: false, backend });
    assert.deepEqual(qualityThresholdSatisfied(101, 85), { satisfied: false, backend });
    assert.deepEqual(qualityThresholdSatisfied(92, 101), { satisfied: false, backend });
  });

  it('evaluates hidden point membership for normal and antimeridian bounding boxes', () => {
    assert.equal(
      pointInZkBoundingBox({ lat: 35, lon: 139 }, { north: 36, south: 34, west: 138, east: 140 }).satisfied,
      true
    );
    assert.equal(
      pointInZkBoundingBox({ lat: 35, lon: 141 }, { north: 36, south: 34, west: 138, east: 140 }).satisfied,
      false
    );
    assert.equal(
      pointInZkBoundingBox({ lat: 10, lon: 179 }, { north: 20, south: 0, west: 170, east: -170 }).satisfied,
      true
    );
    assert.equal(
      pointInZkBoundingBox({ lat: 10, lon: 0 }, { north: 20, south: 0, west: 170, east: -170 }).satisfied,
      false
    );
  });

  it('evaluates hidden point membership for circle predicates', () => {
    assert.equal(
      pointInZkCircle({ lat: 35.001, lon: 139 }, { lat: 35, lon: 139 }, 200).satisfied,
      true
    );
    assert.equal(
      pointInZkCircle({ lat: 36, lon: 139 }, { lat: 35, lon: 139 }, 200).satisfied,
      false
    );
    assert.equal(
      pointInZkCircle({ lat: 35, lon: 139 }, { lat: 35, lon: 139 }, -1).satisfied,
      false
    );
  });
});
