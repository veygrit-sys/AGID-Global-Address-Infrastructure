import assert from 'node:assert/strict';
import {test} from 'node:test';
import {config,inspectMyanmarSources,inspectMyanmarObservations,myanmarSection,profileMyanmarPcodeListing,profileMyanmarReference} from './inspect-postal-context-mm-sources.mjs';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';

const listing='<title>Test</title> legacy 79% As of Jan 2026, updates brought the database to 66,659. Of these, 81.9% (54,604 villages) have recorded coordinates. <a href="Myanmar_PCodes_Release_9.7_Jan2026_StRgn_Dist_Tsp_Town_Ward_VT.xlsm">metadata only</a>';
test('MM binds dated village denominator, not legacy percentage, postcode coverage or inspected rows',()=>{
  const p=profileMyanmarPcodeListing(listing);assert.equal(p.withoutCoordinates,12055);assert.equal(p.reportedPercent,81.9);assert.equal(p.legacyUndatedPercentNotUsed,79);assert.equal(p.dataRowsInspected,0);assert.equal(p.nationalPostalCoverageVerified,false);assert.equal(p.macroExecution,false);
});
test('MM rejects absent, duplicated, stale or inconsistent publisher aggregates',()=>{
  for(const text of [listing.replace('As of Jan 2026','As of Jan 2025'),listing+listing,listing.replace('54,604','67,604'),listing.replace('81.9%','79%'),listing.replace('9.7_Jan2026','9.6_Jul2025')])assert.throws(()=>profileMyanmarPcodeListing(text),/mm-/);
});
test('MM binds one reviewed section and excludes scripts and comments',()=>{
  const ref={section_start:'START',section_end:'END'};
  assert.equal(myanmarSection('<head>START</head><!-- START --><script>START</script>START safe END',ref),'START safe');
  for(const html of ['START safe','START START END','START END END'])assert.throws(()=>myanmarSection(html,ref),/mm-section-binding/);
});
test('MM changed markup may preserve a reviewed section but changed meaning fails closed',()=>{
  const ref={kind:'reviewed-section',title:'Test',section_start:'START',section_end:'END',expected_section_digest:sourceDigest('START safe')};
  const html='<title>Test</title><svg><title>Share icon</title></svg>START <b>safe</b> END';
  assert.equal(profileMyanmarReference(Buffer.from(html),ref,'text/html').contentVerified,true);
  assert.throws(()=>profileMyanmarReference(Buffer.from(html.replace('safe','unsafe')),ref,'text/html'),/mm-content-drift/);
  assert.throws(()=>profileMyanmarReference(Buffer.from(html),ref,'application/json'),/mm-html-mime/);
  assert.throws(()=>profileMyanmarReference(Buffer.from(html+'<title>Test</title>'),ref,'text/html'),/mm-title-binding/);
});
test('MM postal hyperlink is bound to label and exact reviewed URL, never just matching visible text',()=>{
  const ref={kind:'reviewed-section',title:'Test',section_start:'START',section_end:'END',expected_section_digest:sourceDigest('START safe'),profile:{postalLookupLink:'https://www.myanmarpost.com.mm/postcode?tab=information'}};
  const html='<title>Test</title>START safe END<a href="'+ref.profile.postalLookupLink+'">Post Code (Myanmar/English)</a>';
  assert.equal(profileMyanmarReference(Buffer.from(html),ref,'text/html').contentVerified,true);
  for(const h of [html.replace('www.myanmarpost.com.mm','example.invalid'),html.replace('Post Code (Myanmar/English)','another label'),html+html])assert.throws(()=>profileMyanmarReference(Buffer.from(h),ref,'text/html'),/mm-/);
});
test('MM PDF reference requires reviewed bytes, MIME and signature and never promotes examples',()=>{
  const bytes=Buffer.from('%PDF-synthetic-test-not-real-data');
  const ref={kind:'reviewed-pdf',reviewed_preflight_digest:sourceDigest(bytes),edition:'test-only',pages:2};
  const p=profileMyanmarReference(bytes,ref,'application/pdf');assert.equal(p.sourceDataRecords,0);assert.equal(p.profile.currentAssignmentsVerified,false);
  assert.throws(()=>profileMyanmarReference(bytes,ref,'text/html'),/mm-pdf-mime/);
  assert.throws(()=>profileMyanmarReference(Buffer.from('different'),ref,'application/pdf'),/mm-content-drift/);
  const fake=Buffer.from('not a PDF');assert.throws(()=>profileMyanmarReference(fake,{...ref,reviewed_preflight_digest:sourceDigest(fake)},'application/pdf'),/mm-pdf-mime/);
});
test('MM rejects oversize payloads and unreviewed offline bytes',()=>{
  assert.throws(()=>profileMyanmarReference(Buffer.alloc(config.limits.max_response_bytes+1),{},'text/html'),/reference-byte-limit/);
  assert.throws(()=>profileMyanmarReference(Buffer.from('unreviewed'),{kind:'reviewed-html'},'text/html',{preflight:true}),/mm-content-drift/);
});
test('MM never requests any MIMU host; a retry date is not permission',async()=>{
  const seen=[];const report=await inspectMyanmarSources(async url=>{seen.push(url);return new Response('not available',{status:404});});
  assert.equal(seen.length,6);assert.ok(seen.every(u=>!u.includes('themimu.info')));
  assert.equal(report.references.filter(r=>r.status==='permission-required-no-request').length,4);
  assert.equal(report.countryM2Achieved,false);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.currentAssignmentRowsValidated,0);assert.equal(report.assignmentQuality.nationalCoverage,null);
  assert.equal(report.mimuPermissionGate.permission_obtained,false);
});
test('MM cannot reach MIMU by redirect through an allowed host',async()=>{
  const seen=[];const report=await inspectMyanmarSources(async url=>{seen.push(url);return new Response(null,{status:302,headers:{location:'https://www.themimu.info/place-codes'}});});
  assert.equal(seen.length,6);assert.ok(seen.every(u=>!u.includes('themimu.info')));assert.ok(report.references.filter(r=>r.status==='review-failed').every(r=>r.failureKind==='unapproved-reference-host'));
});
test('MM network failures do not expose provider error payloads or claim source absence',async()=>{
  const report=await inspectMyanmarSources(async()=>{throw Error('credential=synthetic-sensitive-error');});
  assert.ok(!JSON.stringify(report).includes('synthetic-sensitive-error'));assert.ok(report.references.filter(r=>r.status==='review-failed').every(r=>r.failureKind==='network-or-parser-error'));assert.equal(report.sourceRowsPersisted,0);
});
test('MM offline observations require a complete unique reference set and original binding',()=>{
  assert.throws(()=>inspectMyanmarObservations([]),/mm-observation-set/);
  const rows=config.references.map(r=>({id:r.id,requestedUrl:r.url,observedAt:'2026-01-01T00:00:00Z',failure:'curl-network-error'}));
  assert.throws(()=>inspectMyanmarObservations(rows.map((r,i)=>i===0?{...r,id:rows[1].id}:r)),/mm-observation-set/);
  assert.throws(()=>inspectMyanmarObservations(rows.map((r,i)=>i===0?{...r,requestedUrl:'https://example.invalid'}:r)),/mm-observation-binding/);
  assert.throws(()=>inspectMyanmarObservations(rows.map((r,i)=>i===0?{...r,failure:'some arbitrary payload'}:r)),/mm-failure-receipt/);
  assert.throws(()=>inspectMyanmarObservations(rows.map((r,i)=>i===0?{...r,observedAt:'2099-01-01T00:00:00Z'}:r)),/mm-observation-binding/);
});
test('MM exact reference snapshot hash and receipt fields must agree',()=>{
  const rows=config.references.map(r=>({id:r.id,requestedUrl:r.url,observedAt:'2026-01-01T00:00:00Z',failure:'curl-network-error'}));
  const i=config.references.findIndex(r=>r.kind==='reviewed-pdf'),ref=config.references[i],bytes=Buffer.from('%PDF-synthetic-not-a-reviewed-document');
  rows[i]={id:ref.id,requestedUrl:ref.url,observedAt:ref.reviewed_observed_at,httpStatus:200,finalUrl:ref.url,redirects:[],contentType:'application/pdf',bytes,byteLength:bytes.length,responseDigest:sourceDigest(bytes)};
  assert.throws(()=>inspectMyanmarObservations(rows),/mm-content-drift/);
  rows[i].byteLength++;assert.throws(()=>inspectMyanmarObservations(rows),/mm-preflight-receipt-binding/);
});
