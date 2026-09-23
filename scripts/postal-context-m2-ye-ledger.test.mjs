import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const ye=ledger.countries.find(country=>country.countryCode==='YE');
const ad=ledger.countries.find(country=>country.countryCode==='AD');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/ye/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/ye-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/ye-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Yemen remains blocked under its optional office-code criterion',()=>{
 assert.equal(ye.status,'blocked');assert.equal(ye.attempts,1);assert.equal(ye.evidence,null);assert.equal(ye.blocker.requiresExplicitApproval,false);
 assert.equal(ye.m2Definition.id,'M2_scoped_optional_office_code_address_context_visualization');assert.equal(manifest.promotion.target_stage,ye.m2Definition.id);
 assert.equal(ye.blocker.evidence.postcodeRequired,false);assert.equal(ye.blocker.evidence.operatorPoBoxOfficeAreaCodeMentioned,true);
 assert.equal(ye.blocker.evidence.currentPostalCodeRowsValidated,0);assert.equal(ye.blocker.evidence.officialPostalGeometryRecords,0);assert.equal(ye.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('P.O. box, office and placeholder map evidence never becomes an area',()=>{
 assert.equal(ye.blocker.evidence.poBoxNumberIsPostcode,false);assert.equal(ye.blocker.evidence.operatorCodeIsPostalArea,false);
 assert.equal(ye.blocker.evidence.officeMapLink,'#');assert.equal(ye.blocker.evidence.realYemenAgidPostalApiVerified,false);assert.equal(ye.blocker.evidence.realYemenAgidAppAreaVisualizationVerified,false);
 assert.match(ye.m2Definition.definition,/translucent fill/);assert.match(ye.m2Definition.definition,/official\/derived\/virtual/);
});

test('Yemen ledger pins exact reports and Europe starts with Andorra',()=>{
 assert.equal(digest(sourceReport),ye.lastAttempt.reportDigest);assert.equal(digest(checks),ye.lastAttempt.engineeringReportDigest);
 assert.equal(ye.blocker.evidence.sourceReviewDigest,ye.lastAttempt.reportDigest);assert.equal(ye.blocker.evidence.engineeringChecksDigest,ye.lastAttempt.engineeringReportDigest);
 assert.equal(ad.status,'pending');assert.equal(ad.region,'europe');
});

test('shared app capability does not promote Yemen without real data',()=>{
 assert.equal(ye.blocker.evidence.sharedAppAreaPathVerified,true);assert.equal(ye.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(ye.blocker.evidence.realYemenAgidPostalApiVerified,false);assert.equal(ye.blocker.evidence.realYemenAgidAppAreaVisualizationVerified,false);
 assert.match(ye.blocker.retryPolicy,/Do not request restricted data.*accept.*contract.*pay/i);
});
