import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareIndexRepositories, type CreationPlanRepo } from './prepare-index-repository-generator.ts';

function scopeNote(repository: CreationPlanRepo) {
  if (repository.region === 'western_europe') {
    return 'The Western Europe index tracks mature postal systems, overseas-territory links, high-quality open data, multilingual naming, and staged city or region splits.';
  }
  if (repository.region === 'northern_europe') {
    return 'The Northern Europe index tracks Nordic and island address systems, sparse-area routing, polar-adjacent territories, and high-quality source licensing.';
  }
  if (repository.region === 'central_europe') {
    return 'The Central Europe index tracks dense cross-border logistics, multilingual historical names, EU-compatible source policy, and staged country packs.';
  }
  if (repository.region === 'southern_europe') {
    return 'The Southern Europe index tracks island, mountain, coastal, city, and overseas-adjacent address infrastructure with explicit source and split policy.';
  }
  if (repository.region === 'spanish_autonomous_regions') {
    return 'The Spanish autonomous regions index keeps regional placement explicit for Spain-related child plans while physical repositories stay staged until data pressure justifies them.';
  }
  if (repository.region === 'eastern_europe') {
    return 'The Eastern Europe index tracks changing administrative boundaries, disputed-boundary display policy, multilingual scripts, and staged country or city repositories.';
  }
  return 'The Europe index coordinates Western, Northern, Central, Southern, Eastern Europe, special autonomous regions, overseas-adjacent packs, and staged country repositories.';
}

function policySections() {
  return `## Postal, Boundary, And Overseas Policy

Europe packs can include mature postal-code systems, overseas-adjacent address
links, island delivery, mountain delivery, border-region handling, historical
place names, disputed-boundary display, and multilingual-script aliases. Those
modes must be represented as technical address infrastructure and never as
publication of personal addresses.
`;
}

export function prepareEuropeIndexRepositories(outputRoot = path.resolve('reports/europe-index-repositories')) {
  return prepareIndexRepositories({
    canonicalContinent: 'europe',
    continentTitle: 'AGID Europe Index',
    planPath: 'data/global_entities/agid-europe-repository-creation-plan.json',
    infrastructureLabel: 'Europe address infrastructure',
    scopeNote,
    policySections,
    sourcePolicy: [
      'Prefer official government, postal, cadastral, open GIS, hydrographic, and openly licensed map sources.',
      'Keep large GIS extracts, tiles, building polygons, search indexes, routing networks, and generated caches outside GitHub.',
      'Track upstream licenses before publishing any country, region, island, territory, or city data pack.',
      'Disputed, overseas-adjacent, autonomous, border, island, or special regions require explicit display and source policy before data publication.',
    ],
  }, outputRoot);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputIndex = process.argv.findIndex(argument => argument === '--output');
  const outputRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : undefined;
  console.log(JSON.stringify(prepareEuropeIndexRepositories(outputRoot), null, 2));
}
