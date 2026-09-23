import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareIndexRepositories, type CreationPlanRepo } from './prepare-index-repository-generator.ts';

function scopeNote(repository: CreationPlanRepo) {
  if (repository.region === 'oceania') {
    return 'The Oceania index tracks Pacific island states, New Zealand-related packs, Papua New Guinea, maritime-adjacent regions, and staged country repositories.';
  }
  if (repository.region === 'australian_external_territories') {
    return 'The Australian external territories index keeps remote island, polar, and special-territory placement explicit before any physical country or child repository is created.';
  }
  if (repository.region === 'polynesia') {
    return 'The Polynesia index tracks island and atoll address infrastructure, no-postal-code or postal-weak regions, ferry and aviation links, and multilingual naming.';
  }
  return 'The Oceania index coordinates Pacific island states, Australian external territories, New Zealand-related territories, Polynesia, remote islands, and staged country packs.';
}

function policySections() {
  return `## Island, Maritime, And Remote Delivery Policy

Oceania packs can include island, atoll, ferry, aviation, maritime-adjacent,
remote, polar, no-postal-code, and postal-weak delivery modes. These modes must
be represented as technical address infrastructure and never as publication of
personal addresses or precise private coordinates.
`;
}

export function prepareOceaniaIndexRepositories(outputRoot = path.resolve('reports/oceania-index-repositories')) {
  return prepareIndexRepositories({
    canonicalContinent: 'oceania',
    continentTitle: 'AGID Oceania Index',
    planPath: 'data/global_entities/agid-oceania-repository-creation-plan.json',
    infrastructureLabel: 'Oceania address infrastructure',
    scopeNote,
    policySections,
    sourcePolicy: [
      'Prefer official government, postal, maritime, aviation, open GIS, hydrographic, and openly licensed map sources.',
      'Keep large GIS extracts, tiles, building polygons, search indexes, routing networks, hydrographic datasets, and generated caches outside GitHub.',
      'Track upstream licenses before publishing any country, island, atoll, territory, or maritime-adjacent data pack.',
      'No-postal-code, postal-weak, island, maritime, polar, remote, or special regions require explicit display and source policy before data publication.',
    ],
  }, outputRoot);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputIndex = process.argv.findIndex(argument => argument === '--output');
  const outputRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : undefined;
  console.log(JSON.stringify(prepareOceaniaIndexRepositories(outputRoot), null, 2));
}
