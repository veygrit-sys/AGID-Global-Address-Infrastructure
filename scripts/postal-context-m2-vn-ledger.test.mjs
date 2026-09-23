import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const vn=ledger.countries.find(country=>country.countryCode==='VN');
const ye=ledger.countries.find(country=>country.countryCode==='YE');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/vn/postal-context/repository-manifest.json',root),'utf8'));
const sourceProfile=JSON.parse(readFileSync(new URL('data/postal_country_packs/vn/postal-context/source-profile.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/vn-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/vn-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Vietnam remains blocked under its real postal-area criterion',()=>{
 assert.equal(vn.status,'blocked'); assert.equal(vn.attempts,1); assert.equal(vn.evidence,null); assert.equal(vn.blocker.requiresExplicitApproval,true);
 assert.equal(vn.m2Definition.id,'M2_current_five_digit_postal_area_visualization'); assert.equal(manifest.promotion.target_stage,vn.m2Definition.id);
 assert.equal(vn.blocker.evidence.officialReferencesReviewed,7); assert.equal(vn.blocker.evidence.currentAssignmentRowsValidated,0);
 assert.equal(vn.blocker.evidence.officialPostalGeometryRecordsValidatedForProduction,0); assert.equal(vn.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('official text evidence stays separate from current rows and geometry',()=>{
 const portal=sourceProfile.sources.find(item=>item.source_id==='vietnam-national-postcode-portal');
 assert.equal(portal.geometry_authority,'none'); assert.match(portal.production_scope,/2018-linked directory.*not current Decision 2334.*not a canonical polygon/i);
 assert.equal(vn.blocker.evidence.officialDecisionDateConflictUnresolved,true); assert.equal(vn.blocker.evidence.postalPortalSearchToAreaVisualizationVerified,false);
 assert.equal(vn.blocker.evidence.currentAssignmentRowsValidated,0); assert.equal(vn.blocker.evidence.completePolygonCoverageValidated,false);
});

test('shared map capability cannot promote Vietnam completion',()=>{
 assert.equal(vn.blocker.evidence.sharedAppAreaPathVerified,true); assert.equal(vn.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(vn.blocker.evidence.realVietnamAgidPostalApiVerified,false); assert.equal(vn.blocker.evidence.realVietnamAgidAppAreaVisualizationVerified,false);
 assert.match(vn.m2Definition.definition,/official\/derived\/virtual/); assert.match(vn.m2Definition.definition,/translucent fill/);
 assert.match(vn.blocker.retryPolicy,/Do not register.*submit.*contract.*pay/i);
});

test('Vietnam ledger pins exact reports and Yemen becomes next',()=>{
 assert.equal(digest(sourceReport),vn.lastAttempt.reportDigest); assert.equal(digest(checks),vn.lastAttempt.engineeringReportDigest);
 assert.equal(vn.blocker.evidence.sourceReviewDigest,vn.lastAttempt.reportDigest); assert.equal(vn.blocker.evidence.engineeringChecksDigest,vn.lastAttempt.engineeringReportDigest);
 assert.equal(ye.status,'pending'); assert.equal(ye.attempts,0);
});
