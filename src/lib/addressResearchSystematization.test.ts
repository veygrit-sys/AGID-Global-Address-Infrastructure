import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESS_RESEARCH_DOMAINS,
  ADDRESS_RESEARCH_PUBLICATION_TRACKS,
  ADDRESS_RESEARCH_REPOSITORY_TARGETS,
  buildAddressResearchRepositoryTemplates,
  buildAddressResearchSystematization,
  validateAddressResearchRepositoryTemplates,
  validateAddressResearchSystematization,
} from './addressResearchSystematization';

test('address research systematization validates as a thick research registry', () => {
  const system = buildAddressResearchSystematization();

  assert.deepEqual(validateAddressResearchSystematization(system), []);
  assert.equal(system.disciplineNameJa, '住所情報学');
  assert.equal(system.disciplineNameEn, 'Address Information Science and Engineering');
  assert.equal(system.domains.length, 10);
  assert.ok(system.thickeningLadder.includes('collect counterexamples'));
  assert.ok(system.thickeningLadder.includes('turn definitions into executable specs'));
  assert.match(system.commonNonClaims.join(' '), /全世界の住所完全データ/);
});

test('all ten research domains have primitives, axioms, counterexamples, metrics, fixtures, and non-claims', () => {
  const expected = [
    'address-data-model',
    'address-normalization-theory',
    'address-search-theory',
    'address-index-theory',
    'address-morphism-theory',
    'address-validation-theory',
    'address-privacy-theory',
    'address-authentication-theory',
    'address-update-history-theory',
    'address-distributed-database-theory',
  ];

  assert.deepEqual(ADDRESS_RESEARCH_DOMAINS.map(domain => domain.id), expected);

  for (const domain of ADDRESS_RESEARCH_DOMAINS) {
    assert.ok(domain.objectOfStudy.length > 0, `${domain.id} should name an object of study`);
    assert.ok(domain.primitives.length >= 3, `${domain.id} should define primitives`);
    assert.ok(domain.axioms.length >= 2, `${domain.id} should define axioms`);
    assert.ok(domain.counterexamples.length >= 2, `${domain.id} should keep counterexamples`);
    assert.ok(domain.metrics.length >= 2, `${domain.id} should define metrics`);
    assert.ok(domain.executableSpecs.length >= 1, `${domain.id} should point to executable specs`);
    assert.ok(domain.fixtures.length >= 1, `${domain.id} should point to fixtures`);
    assert.ok(domain.nonClaims.length >= 1, `${domain.id} should include non-claims`);
  }
});

test('dependency graph keeps claims scoped across model, morphism, privacy, auth, and distributed DB', () => {
  const byId = new Map(ADDRESS_RESEARCH_DOMAINS.map(domain => [domain.id, domain]));

  assert.deepEqual(byId.get('address-data-model')?.dependsOn, []);
  assert.ok(byId.get('address-normalization-theory')?.dependsOn.includes('address-data-model'));
  assert.ok(byId.get('address-morphism-theory')?.dependsOn.includes('address-normalization-theory'));
  assert.ok(byId.get('address-authentication-theory')?.dependsOn.includes('address-privacy-theory'));
  assert.ok(byId.get('address-distributed-database-theory')?.dependsOn.includes('address-update-history-theory'));
  assert.match(byId.get('address-authentication-theory')?.nonClaims.join(' ') ?? '', /実回路完成|法的KYC/);
  assert.match(byId.get('address-validation-theory')?.axioms.join(' ') ?? '', /形式検証の成功は住所存在を意味しない/);
});

test('bridges connect the discipline to AddressQL, Address Login, AGID/AOID, and Skipship with boundaries', () => {
  const system = buildAddressResearchSystematization();
  const bridges = new Map(system.bridges.map(bridge => [bridge.target, bridge]));

  assert.match(bridges.get('AddressQL')?.role ?? '', /Executable query language/);
  assert.match(bridges.get('AddressQL')?.boundary ?? '', /complete/);
  assert.match(bridges.get('Address Login')?.boundary ?? '', /does not imply permission/);
  assert.match(bridges.get('AGID/AOID')?.boundary ?? '', /not raw addresses/);
  assert.match(bridges.get('Skipship')?.boundary ?? '', /carrier-specific/);
});

test('publication tracks convert thin theory names into paper and OSS-ready tracks', () => {
  const trackIds = ADDRESS_RESEARCH_PUBLICATION_TRACKS.map(track => track.id);

  assert.deepEqual(trackIds, [
    'foundations',
    'search-index',
    'morphism-normalization',
    'privacy-authentication',
    'distributed-gazetteers',
  ]);
  assert.ok(ADDRESS_RESEARCH_PUBLICATION_TRACKS.every(track => track.minimumArtifact.length > 0));
  assert.ok(
    ADDRESS_RESEARCH_PUBLICATION_TRACKS
      .find(track => track.id === 'privacy-authentication')
      ?.domainIds.includes('address-authentication-theory'),
  );
});

test('repository targets split umbrella research from specialized morphism theory without remote actions', () => {
  const system = buildAddressResearchSystematization();
  const targets = new Map(system.repositoryTargets.map(target => [target.repository, target]));
  const umbrella = targets.get('address-research');
  const morphism = targets.get('address-morphism-theory');

  assert.deepEqual(ADDRESS_RESEARCH_REPOSITORY_TARGETS.map(target => target.repository), [
    'address-research',
    'address-morphism-theory',
  ]);
  assert.ok(umbrella?.canonicalArtifacts.includes('src/lib/addressResearchSystematization.ts'));
  assert.ok(umbrella?.verificationCommands.includes('npm run verify:address-research-systematization'));
  assert.ok(morphism?.canonicalDomainIds.includes('address-morphism-theory'));
  assert.ok(morphism?.canonicalArtifacts.some(artifact => artifact.includes('address-morphism-theory-v2')));
  assert.match(morphism?.nonClaims.join(' ') ?? '', /deliverability|identity|KYC/);

  for (const target of system.repositoryTargets) {
    assert.equal(target.creationBoundary.localScaffoldOnly, true);
    assert.equal(target.creationBoundary.remoteCreationRequiresExplicitUserRequest, true);
    assert.equal(target.creationBoundary.productionTrafficAllowed, false);
    assert.equal(target.creationBoundary.rawAddressMaterialAllowed, false);
    assert.match(target.nonClaims.join(' '), /remote GitHub/);
  }
});

test('repository templates define local README, package, registry, docs, and boundary tests', () => {
  const templates = buildAddressResearchRepositoryTemplates();

  assert.deepEqual(validateAddressResearchRepositoryTemplates(templates), []);
  assert.deepEqual(templates.map(template => template.repository), [
    'address-research',
    'address-morphism-theory',
  ]);

  for (const template of templates) {
    const paths = template.files.map(file => file.path);
    assert.equal(template.localOnly, true);
    assert.equal(template.remoteActionsAllowed, false);
    assert.equal(template.readinessClaim, 'local-scaffold-only');
    assert.match(template.packageName, /^@agid\/address-/);
    assert.ok(template.blockedMaterials.includes('raw address'));
    assert.ok(template.blockedMaterials.includes('production credential'));
    assert.ok(paths.includes('README.md'));
    assert.ok(paths.includes('package.json'));
    assert.ok(paths.includes('docs/repository-boundary.md'));
    assert.ok(paths.includes('docs/non-claims.md'));
    assert.ok(paths.includes('src/repositoryRegistry.ts'));
    assert.ok(paths.includes('tests/repository-boundary.test.ts'));
    assert.ok(template.verificationCommands.includes('npm run verify:repository-boundary'));
    assert.ok(template.files.every(file => !file.path.includes('..') && !file.path.startsWith('/')));
  }

  const morphism = templates.find(template => template.repository === 'address-morphism-theory');
  assert.match(morphism?.files.flatMap(file => file.safetyNotes).join(' ') ?? '', /deliverability|identity|KYC/);
});

test('research note documents the thickening method and executable registry', () => {
  const doc = readFileSync('docs/research/address-information-science-systematization-ja.md', 'utf8');

  assert.match(doc, /住所情報学/);
  assert.match(doc, /薄い理論を厚くする/);
  assert.match(doc, /object of study/);
  assert.match(doc, /counterexample/);
  assert.match(doc, /src\/lib\/addressResearchSystematization\.ts/);
  assert.match(doc, /AddressQL/);
  assert.match(doc, /Skipship/);
  assert.match(doc, /address-research/);
  assert.match(doc, /address-morphism-theory/);
  assert.match(doc, /repository template/);
  assert.match(doc, /README\.md/);
  assert.match(doc, /tests\/repository-boundary\.test\.ts/);
  assert.match(doc, /remote GitHub/);
  assert.match(doc, /全世界の住所完全データ/);
});
