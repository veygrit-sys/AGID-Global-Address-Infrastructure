import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareIndexRepositories, type CreationPlanRepo } from './prepare-index-repository-generator.ts';

function scopeNote(repository: CreationPlanRepo) {
  if (repository.region === 'northern_africa') {
    return 'The Northern Africa index tracks desert, coastal, border, Arabic/French/English naming, postal-weak regions, and disputed-region display policy.';
  }
  if (repository.region === 'western_africa') {
    return 'The Western Africa index tracks postal-weak country packs, fast-growing cities, informal addressing, port corridors, and multilingual source policy.';
  }
  if (repository.region === 'eastern_africa') {
    return 'The Eastern Africa index tracks postal-weak and no-postal-code regions, humanitarian delivery patterns, island packs, rural addressing, and cross-border corridors.';
  }
  if (repository.region === 'southern_africa') {
    return 'The Southern Africa index tracks country packs with rural delivery, mining and port corridors, sparse-area routing, and official/open-data source boundaries.';
  }
  if (repository.region === 'central_africa') {
    return 'The Central Africa index tracks large low-density regions, humanitarian and conflict-sensitive display policy, forest and river corridors, and staged country packs.';
  }
  return 'The Africa index coordinates Northern, Western, Eastern, Southern, and Central Africa country packs with postal-weak, humanitarian, rural, desert, island, and megacity modes.';
}

function policySections() {
  return `## Postal-Weak, Humanitarian, And Rural Policy

Many Africa country packs require AGID-first delivery, postal-equivalent zones,
informal settlement handling, rural and nomadic addressing, island and desert
delivery profiles, humanitarian delivery workflows, and city-growth tracking.
These modes must be declared as technical address infrastructure, not as raw
address publication.
`;
}

export function prepareAfricaIndexRepositories(outputRoot = path.resolve('reports/africa-index-repositories')) {
  return prepareIndexRepositories({
    canonicalContinent: 'africa',
    continentTitle: 'AGID Africa Index',
    planPath: 'data/global_entities/agid-africa-repository-creation-plan.json',
    infrastructureLabel: 'Africa address infrastructure',
    scopeNote,
    policySections,
    sourcePolicy: [
      'Prefer official government, postal, humanitarian open-data, open GIS, hydrographic, and openly licensed map sources.',
      'Keep large GIS extracts, tiles, building polygons, search indexes, routing networks, humanitarian datasets with personal data, and generated caches outside GitHub.',
      'Track upstream licenses before publishing any country, city, island, humanitarian, or territory data pack.',
      'Postal-weak, no-postal-code, informal, nomadic, disputed, humanitarian, island, desert, or special regions require explicit display and source policy before data publication.',
    ],
    noRawMaterial: [
      'raw personal address',
      'recipient record',
      'precise private coordinate',
      'witness material',
      'private key',
      'proof secret',
      'carrier operational record',
      'personal humanitarian record',
    ],
  }, outputRoot);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputIndex = process.argv.findIndex(argument => argument === '--output');
  const outputRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : undefined;
  console.log(JSON.stringify(prepareAfricaIndexRepositories(outputRoot), null, 2));
}
