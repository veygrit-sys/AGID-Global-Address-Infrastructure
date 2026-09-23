import { buildAddressMorphismUnificationPlan } from '../src/lib/addressMorphismUnificationPlan';

const plan = buildAddressMorphismUnificationPlan();

console.log(JSON.stringify({
  version: plan.version,
  target: plan.target,
  readiness: plan.readiness,
  chaptersNeedingWork: plan.chapters
    .filter(chapter => chapter.status !== 'ready-to-unify')
    .map(chapter => ({
      chapter: chapter.chapter,
      canonicalFile: chapter.canonicalFile,
      status: chapter.status,
      nextAction: chapter.nextAction,
    })),
  sourcePolicy: plan.sourcePolicy,
  migrationSteps: plan.migrationSteps,
}, null, 2));
