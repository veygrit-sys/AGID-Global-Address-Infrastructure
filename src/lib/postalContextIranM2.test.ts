import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const parse=(p:string)=>JSON.parse(read(p));
const manifest=parse('data/postal_country_packs/ir/postal-context/repository-manifest.json');
const contract=parse('data/postal_country_packs/ir/postal-context/m2-source-review.json');
const path='reports/postal-context-m2/ir-source-review-2026-08-28.json',report=parse(path);
test('IR M2 criterion retains ten-digit, non-area, postal-service exception, GNAF, time and jurisdiction gates',()=>{
 assert.deepEqual(manifest.promotion.stages.find((s:{id:string})=>s.id==='M2_licensed_assignment'),contract.m2_definition);
 assert.match(contract.m2_definition.definition,/Iran Post assignment release.*ten-digit strings.*five-digit forwarding.*P\.O\. Box\/poste restante.*AGID loader\/API/);
 assert.match(contract.m2_definition.definition,/GNAF.*display\/retention rights.*independent authority.*No guaranteed polygons/);
 assert.equal(manifest.repository.maturity,'M1_metadata');assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.promotion.hard_blockers.length,9);
 assert.match(manifest.postal_system.temporal_rule,/valid_from.*valid_to.*supersession/);assert.match(manifest.postal_system.territorial_rule,/not a sovereignty/);
 for(const k of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[k],false);
 const format=parse('src/data/address_formats/asia/middle_east/IR.json');assert.equal(format.addressRules.postalCode.required,false);
});
test('IR source identities alone stay weak while operator authority and separate contexts are preserved',()=>{
 const sources=getOfficialPostalSourcesForCountry('IR'),preferred=getPreferredPostalSourceIdsForCountry('IR');
 const ids=new Set(parse('data/postal_country_packs/ir/postal-context/source-profile.json').sources.map((s:{source_id:string})=>s.source_id));
 const reviewed=sources.filter(s=>ids.has(s.id));assert.equal(reviewed.length,6);
 for(const s of reviewed){assert.equal(s.validationReadiness,'metadata-only');assert.ok(!preferred.includes(s.id));
  for(const input of [{sourceIds:[s.id]},{url:s.url},{source:s.label}])assert.equal(classifyPostalSourceTrust({countryCode:'IR',...input}).strength,'weak');}
 assert.equal(sources.find(s=>s.id==='iran-post')?.trustTier,'authoritative');assert.equal(sources.find(s=>s.id==='iran-open-data')?.trustTier,'community');
});
test('IR observed entry failures do not fabricate HTTP status, source bytes, rights or current assignments',()=>{
 assert.equal(report.references.length,6);const refs=new Map<string,any>(report.references.map((r:{id:string})=>[r.id,r]));
 for(const id of ['iran-post','iran-post-www','iran-post-gnaf','gavahi-post-ir']){assert.equal(refs.get(id).failureKind,'connect-timeout');assert.equal(refs.get(id).httpStatus,null);}
 assert.equal(refs.get('iran-nsdi').httpStatus,502);assert.deepEqual(refs.get('iran-nsdi').redirects,['https://iransdi.ncc.gov.ir/']);
 const upu=refs.get('upu-iran-addressing-2023');assert.equal(upu.httpStatus,404);assert.deepEqual(upu.redirects,['https://upu.int/','https://www.upu.int/']);
 for(const r of report.references){assert.equal(r.contentVerified,false);assert.equal(r.byteLength,null);assert.equal(r.responseDigest,null);assert.equal(r.sourceDocumentDigest,null);assert.equal(r.sourceVersion,null);assert.equal(r.assignmentRowsValidated,0);}
});
test('IR cached format context cannot replace a fresh PDF, real data, rights or AGID verification',()=>{
 assert.equal(contract.cache_context.may_substitute_for_live_evidence,false);assert.equal(contract.cache_context.fresh_source_bytes_acquired,false);assert.equal(contract.cache_context.fresh_pdf_visually_verified,false);assert.equal(contract.cache_context.current_source_digest,null);assert.equal(contract.cache_context.examples_or_contacts_retained,false);
 assert.equal(report.cacheCanReplaceCurrentBytes,false);for(const k of ['missingCodeRate','invalidCodeRate','duplicateAssignmentRate'])assert.equal(report.assignmentQuality[k],null);
 for(const k of ['assignmentRowsValidated','sourceDataSnapshotsRetained','sourceRowsPersisted','postalLookupRequests','coordinateQueries','certificateRequests','authenticatedRequests','bulkDataDownloads','publishedDataArtifacts','paidOperations'])assert.equal(report[k],0);
 for(const k of ['contractAcceptancePerformed','tlsVerificationDisabled','realAgidRuntimeVerified','countryM2Achieved'])assert.equal(report[k],false);
 assert.doesNotMatch(read(path),/PRIVATE@|"features"\s*:|bodyBase64|errorStack|recipient_name/);
});
test('IR ledger pins its negative evidence receipt and separates the review date from new authority',()=>{
 const ir=parse('docs/postal-context-m2-rollout.json').countries.find((c:{countryCode:string})=>c.countryCode==='IR');
 assert.equal(ir.status,'blocked');assert.equal(ir.attempts,1);assert.equal(ir.evidence,null);assert.deepEqual(ir.m2Definition,contract.m2_definition);
 assert.equal(ir.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(path)).digest('hex'));assert.equal(ir.blocker.evidence.validatedAssignmentRows,0);assert.equal(ir.blocker.evidence.reviewedSourceBytes,0);
 assert.equal(Date.parse(ir.blocker.retryAfter)-Date.parse(ir.blocker.observedAt),7*86400000);assert.equal(ir.blocker.requiresExplicitApproval,false);
 assert.match(ir.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
});
