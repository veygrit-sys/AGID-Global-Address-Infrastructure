import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const uz=ledger.countries.find(country=>country.countryCode==='UZ');
const vn=ledger.countries.find(country=>country.countryCode==='VN');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/uz/postal-context/repository-manifest.json',root),'utf8'));
const sourceProfile=JSON.parse(readFileSync(new URL('data/postal_country_packs/uz/postal-context/source-profile.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/uz-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/uz-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Uzbekistan remains blocked under its real operator-area criterion',()=>{
 assert.equal(uz.status,'blocked');
 assert.equal(uz.attempts,1);
 assert.equal(uz.evidence,null);
 assert.equal(uz.blocker.requiresExplicitApproval,true);
 assert.equal(uz.m2Definition.id,'M2_current_operator_postal_area_visualization');
 assert.equal(manifest.promotion.target_stage,uz.m2Definition.id);
 assert.equal(uz.blocker.evidence.officialReferencesReviewed,10);
 assert.equal(uz.blocker.evidence.officialPostalGeometryRecordsValidatedForProduction,0);
 assert.equal(uz.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('operator polygon evidence stays separate from reuse authority and completeness',()=>{
 const source=sourceProfile.sources.find(item=>item.source_id==='uzpost-index-map');
 assert.equal(source.redistribution_class,'R4_operational_public_get_without_reuse_grant');
 assert.match(source.production_scope,/one exact detail response.*not national completeness.*reuse rights/i);
 assert.equal(uz.blocker.evidence.currentOfficeIndices,1593);
 assert.equal(uz.blocker.evidence.invalidOfficeCoordinateRows,2);
 assert.equal(uz.blocker.evidence.operatorAreaDetailSamples,1);
 assert.equal(uz.blocker.evidence.operatorAppAreaVisualizationVerified,true);
 assert.equal(uz.blocker.evidence.completePolygonCoverageValidated,false);
});

test('shared map capability and operator app do not promote AGID completion',()=>{
 assert.equal(uz.blocker.evidence.sharedAppAreaPathVerified,true);
 assert.equal(uz.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(uz.blocker.evidence.realUzbekistanAgidPostalApiVerified,false);
 assert.equal(uz.blocker.evidence.realUzbekistanAgidAppAreaVisualizationVerified,false);
 assert.match(uz.m2Definition.definition,/official\/derived\/virtual/);
 assert.match(uz.m2Definition.definition,/translucent fill/);
 assert.match(uz.blocker.retryPolicy,/Do not register.*accept the public offer.*bulk-harvest/i);
});

test('Uzbekistan ledger pins exact reports and Vietnam becomes next',()=>{
 assert.equal(digest(sourceReport),uz.lastAttempt.reportDigest);
 assert.equal(digest(checks),uz.lastAttempt.engineeringReportDigest);
 assert.equal(uz.blocker.evidence.sourceReviewDigest,uz.lastAttempt.reportDigest);
 assert.equal(uz.blocker.evidence.engineeringChecksDigest,uz.lastAttempt.engineeringReportDigest);
 assert.equal(vn.status,'pending');
 assert.equal(vn.attempts,0);
});
