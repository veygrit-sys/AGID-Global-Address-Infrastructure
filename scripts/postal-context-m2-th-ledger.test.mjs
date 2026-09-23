import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const th=ledger.countries.find(country=>country.countryCode==='TH');
const tj=ledger.countries.find(country=>country.countryCode==='TJ');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/th/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/th-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/th-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Thailand remains blocked under its exception-aware app criterion',()=>{
 assert.equal(th.status,'blocked');
 assert.equal(th.attempts,1);
 assert.equal(th.evidence,null);
 assert.equal(th.blocker.requiresExplicitApproval,false);
 assert.equal(th.m2Definition.id,'M2_exception_aware_postal_area_visualization');
 assert.equal(manifest.promotion.target_stage,th.m2Definition.id);
 assert.equal(th.blocker.evidence.distinctHistoricalReferenceCodes,979);
 assert.equal(th.blocker.evidence.assignmentExceptionTokens,219);
 assert.equal(th.blocker.evidence.officialPostalGeometryRecords,0);
 assert.equal(th.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('Thailand shared map capability is not promoted to country completion',()=>{
 assert.equal(th.blocker.evidence.sharedAppAreaPathVerified,true);
 assert.equal(th.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(th.blocker.evidence.realThaiPostalApiVerified,false);
 assert.equal(th.blocker.evidence.realThaiAppAreaVisualizationVerified,false);
 assert.match(th.m2Definition.definition,/official\/derived\/virtual/);
 assert.match(th.m2Definition.definition,/translucent fill/);
});

test('Thailand ledger pins source and engineering reports',()=>{
 assert.equal(digest(sourceReport),th.lastAttempt.reportDigest);
 assert.equal(digest(checks),th.lastAttempt.engineeringReportDigest);
 assert.equal(th.blocker.evidence.sourceReviewDigest,th.lastAttempt.reportDigest);
 assert.equal(th.blocker.evidence.engineeringChecksDigest,th.lastAttempt.engineeringReportDigest);
});

test('Tajikistan remains the next untouched country',()=>{
 assert.equal(tj.status,'pending');
 assert.equal(tj.attempts,0);
 assert.equal(tj.manifest,null);
});
