import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyResearchPaperTopic,
  getResearchPaperVolumeSeparationPlan,
  validateResearchPaperVolumeBoundary,
} from './researchPaperVolumeSeparation';

test('defines three strict research paper volumes', () => {
  const plan = getResearchPaperVolumeSeparationPlan();

  assert.equal(plan.volumes.length, 3);
  assert.deepEqual(
    plan.volumes.map(volume => volume.id),
    ['amt-core', 'agid-aoid-application', 'zk-address-predicate'],
  );
  assert.match(plan.principle, /semantic theory/i);
  assert.match(plan.principle, /application identifier layer/i);
  assert.match(plan.principle, /cryptographic disclosure layer/i);
});

test('accepts an AMT core section that stays semantic', () => {
  const result = validateResearchPaperVolumeBoundary({
    volumeId: 'amt-core',
    sections: [{
      title: 'Candidate Generation and Abstention',
      body: 'This section defines observation maps, candidate generation, structural dissimilarity, clustering, unresolved states, and PID issuance gates under non-injective observations.',
    }],
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('warns when AMT core references AGID/AOID or ZK only as a companion boundary', () => {
  const result = validateResearchPaperVolumeBoundary({
    volumeId: 'amt-core',
    sections: [{
      title: 'Companion Paper Boundary',
      body: 'AGID-S and zero-knowledge circuit work are companion paper examples and are out of scope for the AMT core manuscript.',
    }],
  });

  assert.equal(result.valid, true);
  assert.equal(result.warnings.length, 2);
  assert.ok(result.warnings.some(warning => warning.code === 'amt-core-agid-aoid-implementation-detail'));
  assert.ok(result.warnings.some(warning => warning.code === 'amt-core-zk-implementation-detail'));
});

test('rejects AMT core sections that mix implementation and cryptographic details into the theory', () => {
  const result = validateResearchPaperVolumeBoundary({
    volumeId: 'amt-core',
    sections: [{
      title: 'Implementation Details',
      body: 'The AMT paper defines the AGID-S QR payload, AOID sync, POS terminal workflow, Ethereum registry, and ZK circuit nullifier construction.',
    }],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.code === 'amt-core-agid-aoid-implementation-detail'));
  assert.ok(result.errors.some(error => error.code === 'amt-core-zk-implementation-detail'));
});

test('rejects application paper sections that overclaim AMT proofs or ZK soundness', () => {
  const result = validateResearchPaperVolumeBoundary({
    volumeId: 'agid-aoid-application',
    sections: [{
      title: 'Claims',
      body: 'This application paper will reprove the AMT impossibility theorem and proves zero-knowledge soundness for every production SNARK.',
    }],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.code === 'application-reproves-amt'));
  assert.ok(result.errors.some(error => error.code === 'application-claims-zk-soundness'));
});

test('rejects ZK paper sections that redefine application specs or confuse proof with truth', () => {
  const result = validateResearchPaperVolumeBoundary({
    volumeId: 'zk-address-predicate',
    sections: [{
      title: 'Wrong Scope',
      body: 'The ZK paper defines the AGID encode/decode SDK, AOID QR sync, POS terminal UI, and claims that ZK proves real-world address truth.',
    }],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.code === 'zk-redefines-application-spec'));
  assert.ok(result.errors.some(error => error.code === 'zk-confuses-proof-with-truth'));
});

test('classifies topics into the right primary volume and bridge volumes', () => {
  assert.equal(
    classifyResearchPaperTopic('candidate generation, unresolved state, PID lineage').primaryVolume,
    'amt-core',
  );

  const app = classifyResearchPaperTopic('AGID-S QR, AOID private record, POS SDK conformance based on AMT');
  assert.equal(app.primaryVolume, 'agid-aoid-application');
  assert.deepEqual(app.bridgeVolumes, ['amt-core']);

  const zk = classifyResearchPaperTopic('ZK nullifier proof bundle for AOID ownership using an AMT envelope');
  assert.equal(zk.primaryVolume, 'zk-address-predicate');
  assert.deepEqual(zk.bridgeVolumes, ['amt-core', 'agid-aoid-application']);
  assert.ok(zk.warnings.length >= 2);
});
