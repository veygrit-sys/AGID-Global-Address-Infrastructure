import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const tl=ledger.countries.find(country=>country.countryCode==='TL');
const tm=ledger.countries.find(country=>country.countryCode==='TM');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/tl/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/tl-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/tl-checks-2026-08-29.json',root));
const format=JSON.parse(readFileSync(new URL('src/data/address_formats/asia/southeast_asia/TL.json',root),'utf8'));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Timor-Leste remains blocked under its current-area app criterion',()=>{
 assert.equal(tl.status,'blocked');
 assert.equal(tl.attempts,1);
 assert.equal(tl.evidence,null);
 assert.equal(tl.blocker.requiresExplicitApproval,false);
 assert.equal(tl.m2Definition.id,'M2_current_seven_character_delivery_area_visualization');
 assert.equal(manifest.promotion.target_stage,tl.m2Definition.id);
 assert.equal(tl.blocker.evidence.currentPostalAssignmentRowsValidated,0);
 assert.equal(tl.blocker.evidence.officialPostalGeometryRecords,0);
 assert.equal(tl.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('Timor-Leste format correction is exact and does not claim assignments',()=>{
 assert.equal(format.postalCode.format,'TLNNNNN');
 assert.equal(format.postalCode.regex,'^TL\\d{5}$');
 assert.equal(format.native.fields.find(field=>field.key==='postcode').placeholder,'TL10001');
 assert.equal(format.addressRules.postalCode.label,'TL plus 5 digits required');
 assert.equal(tl.blocker.evidence.currentAssignmentCompletenessValidated,false);
 assert.equal(tl.blocker.evidence.officialContactNumberClassifiedAsPostcode,false);
});

test('Timor-Leste shared map capability is not promoted to country completion',()=>{
 assert.equal(tl.blocker.evidence.sharedAppAreaPathVerified,true);
 assert.equal(tl.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(tl.blocker.evidence.realTimorLestePostalApiVerified,false);
 assert.equal(tl.blocker.evidence.realTimorLesteAppAreaVisualizationVerified,false);
 assert.match(tl.m2Definition.definition,/official\/derived\/virtual/);
 assert.match(tl.m2Definition.definition,/translucent fill/);
});

test('Timor-Leste ledger pins reports and Turkmenistan stays next',()=>{
 assert.equal(digest(sourceReport),tl.lastAttempt.reportDigest);
 assert.equal(digest(checks),tl.lastAttempt.engineeringReportDigest);
 assert.equal(tl.blocker.evidence.sourceReviewDigest,tl.lastAttempt.reportDigest);
 assert.equal(tl.blocker.evidence.engineeringChecksDigest,tl.lastAttempt.engineeringReportDigest);
 assert.equal(tm.status,'pending');
 assert.equal(tm.attempts,0);
 assert.equal(tm.manifest,null);
});
