import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const sy=ledger.countries.find(country=>country.countryCode==='SY');
const sourceReport=readFileSync(new URL('reports/postal-context-m2/sy-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/sy-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Syria remains blocked with explicit no-postcode authority separation',()=>{
 assert.equal(sy.status,'blocked');assert.equal(sy.attempts,1);assert.equal(sy.evidence,null);assert.equal(sy.blocker.requiresExplicitApproval,false);
 assert.equal(sy.m2Definition.id,'M2_scoped_no_postcode_address_context');assert.equal(sy.blocker.evidence.postalCode,null);assert.equal(sy.blocker.evidence.postcodeRequired,false);assert.equal(sy.blocker.evidence.officialPostalGeometryRecords,0);assert.equal(sy.blocker.evidence.publishedImmutableDataArtifacts,0);assert.equal(sy.blocker.evidence.realAgidRuntimeVerified,false);
});

test('Syria ledger pins source and engineering reports',()=>{
 assert.equal(digest(sourceReport),sy.lastAttempt.reportDigest);assert.equal(digest(checks),sy.lastAttempt.engineeringReportDigest);assert.equal(sy.blocker.evidence.sourceReviewDigest,sy.lastAttempt.reportDigest);assert.equal(sy.blocker.evidence.engineeringChecksDigest,sy.lastAttempt.engineeringReportDigest);
});
