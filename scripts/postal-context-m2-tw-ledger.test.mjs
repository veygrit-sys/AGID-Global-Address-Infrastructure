import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const tw=ledger.countries.find(country=>country.countryCode==='TW');
const uz=ledger.countries.find(country=>country.countryCode==='UZ');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/tw/postal-context/repository-manifest.json',root),'utf8'));
const sourceProfile=JSON.parse(readFileSync(new URL('data/postal_country_packs/tw/postal-context/source-profile.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/tw-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/tw-checks-2026-08-29.json',root));
const format=JSON.parse(readFileSync(new URL('src/data/address_formats/asia/east_asia/TW.json',root),'utf8'));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Taiwan remains blocked under its real-area app criterion',()=>{
 assert.equal(tw.status,'blocked');
 assert.equal(tw.attempts,1);
 assert.equal(tw.evidence,null);
 assert.equal(tw.blocker.requiresExplicitApproval,true);
 assert.equal(tw.m2Definition.id,'M2_current_six_digit_delivery_area_visualization');
 assert.equal(manifest.promotion.target_stage,tw.m2Definition.id);
 assert.equal(tw.blocker.evidence.officialReferencesReviewed,10);
 assert.equal(tw.blocker.evidence.officialPostalGeometryRecords,0);
 assert.equal(tw.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('Taiwan current public resource remains typed discovery metadata',()=>{
 const source=sourceProfile.sources.find(item=>item.source_id==='chunghwa-post-3plus3-data');
 assert.equal(source.redistribution_class,'R3_controlled_fee_or_contract');
 assert.match(source.production_scope,/four-row Big5 link catalog.*external account.*sealed application.*approval/i);
 assert.equal(tw.blocker.evidence.publicLinkCatalogRows,4);
 assert.equal(tw.blocker.evidence.currentPostalAssignmentRowsValidated,0);
 assert.equal(tw.blocker.evidence.publicStandaloneAddressTextFileAvailable,false);
 assert.equal(tw.blocker.evidence.controlledSourceAccessAttempted,false);
 assert.match(tw.lastAttempt.nextAction,/Never turn address ranges.*doorplate points.*buildings.*administrative boundaries.*Voronoi/i);
});

test('Taiwan shared map capability is not promoted to country completion',()=>{
 assert.equal(tw.blocker.evidence.sharedAppAreaPathVerified,true);
 assert.equal(tw.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(tw.blocker.evidence.realTaiwanPostalApiVerified,false);
 assert.equal(tw.blocker.evidence.realTaiwanAppAreaVisualizationVerified,false);
 assert.match(tw.m2Definition.definition,/official\/derived\/virtual/);
 assert.match(tw.m2Definition.definition,/translucent fill/);
 assert.equal(format.postalCode.format,'NNN NNN');
 assert.equal(format.postalCode.regex,'^\\d{3}\\s?\\d{3}$');
});

test('Taiwan ledger pins exact reports and Uzbekistan becomes next',()=>{
 assert.equal(digest(sourceReport),tw.lastAttempt.reportDigest);
 assert.equal(digest(checks),tw.lastAttempt.engineeringReportDigest);
 assert.equal(tw.blocker.evidence.sourceReviewDigest,tw.lastAttempt.reportDigest);
 assert.equal(tw.blocker.evidence.engineeringChecksDigest,tw.lastAttempt.engineeringReportDigest);
 assert.equal(uz.status,'pending');
 assert.equal(uz.attempts,0);
});
