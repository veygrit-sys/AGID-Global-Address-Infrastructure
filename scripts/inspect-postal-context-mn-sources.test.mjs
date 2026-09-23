import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
import {config,profileMongoliaCrcCounts,profileMongoliaNsoSelectors,profileMongoliaReference,inspectMongoliaSources,inspectMongoliaObservations} from './inspect-postal-context-mn-sources.mjs';
const article=(total=2721,aimags=1993,standard='2024')=>`2025-05-23 MNS 6775:${standard} 5 оронтой 9 оронтой 2025 оны байдлаар ${total} шуудангийн нэгдсэн код байгаагаас 21 аймагт ${aimags}, Улаанбаатар хотын 9 дүүрэгт 728`;
const select=(i,opts)=>`<select id="ctl0${i}_ValuesListBox">${opts.map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select>`;
const selectors=()=>select(1,[[1,'Soum and district'],[2,'Bag and khoroo'],[3,'Territory (in thousand square kilometers)'],[4,'Population density (persons per square kilometers)']])+select(2,[...Array.from({length:29},(_,i)=>[100+i,'Synthetic '+i]),['7','Ulaanbaatar'],['711',' Ulaanbaatar']])+select(3,Array.from({length:11},(_,i)=>[i,2024-i]));
const html='<html><head><title>Synthetic</title></head><body>reference only</body></html>';
const ref={id:'synthetic',kind:'reviewed-html',title:'Synthetic',reviewed_digest:sourceDigest(html),reviewed_bytes:Buffer.byteLength(html)};

test('MN: separate conflicting publisher counts without national coverage assertion',()=>{
  const a=profileMongoliaCrcCounts(article(),{datedArticle:true}),b=profileMongoliaCrcCounts(article(2720,1992,'2019'));
  assert.equal(a.total-b.total,1);assert.equal(a.currentAssignmentsValidated,0);assert.equal(a.acceptedNationalCoverageDenominator,null);assert.equal(b.extendedCodeRepealVerified,false);
});
test('MN: count arithmetic, duplicate statement, edition and drift guards',()=>{
  assert.throws(()=>profileMongoliaCrcCounts(article(2721,1992),{datedArticle:true}),/denominator/);
  assert.throws(()=>profileMongoliaCrcCounts(article()+article(),{datedArticle:true}),/binding/);
  assert.throws(()=>profileMongoliaCrcCounts(article(2722,1994),{datedArticle:true}),/drift/);
  assert.throws(()=>profileMongoliaCrcCounts(article(2721,1993,'2019'),{datedArticle:true}),/edition/);
});
test('MN: NSO metadata grain, duplicate labels, mixed units and unknown missingness',()=>{
  const p=profileMongoliaNsoSelectors(selectors());assert.deepEqual(p.duplicateRegionLabels,[{label:'Ulaanbaatar',keys:['7','711']}]);assert.equal(p.regionOptions,31);assert.equal(p.latestAvailableYear,2024);assert.equal(p.missingValuesRate,null);assert.equal(p.resultRowsDownloaded,0);assert.equal(p.aggregationAcrossIndicatorsPermitted,false);
});
test('MN: NSO duplicate keys, changed years and selectors fail closed',()=>{
  assert.throws(()=>profileMongoliaNsoSelectors(selectors().replace('value="711"','value="7"')),/keys/);
  assert.throws(()=>profileMongoliaNsoSelectors(selectors().replace('2024','2025')),/edition/);
  assert.throws(()=>profileMongoliaNsoSelectors(selectors()+select(4,[[1,'extra']])),/count/);
  assert.throws(()=>profileMongoliaNsoSelectors(selectors().replace('ctl02','ctl03')),/order/);
});
test('MN: strict HTML byte, MIME, head, title and UTF8 gates',()=>{
  assert.equal(profileMongoliaReference(Buffer.from(html),ref,'text/html; charset=UTF-8').contentVerified,true);
  assert.throws(()=>profileMongoliaReference(Buffer.from(html+' '),ref,'text/html'),/drift/);
  assert.throws(()=>profileMongoliaReference(Buffer.from(html),ref,'application/json'),/mime/);
  for(const changed of [html.replace('Synthetic','Unexpected'),html.replace('</head>','<title>Extra</title></head>')])assert.throws(()=>profileMongoliaReference(Buffer.from(changed),{...ref,reviewed_digest:sourceDigest(changed),reviewed_bytes:Buffer.byteLength(changed)},'text/html'),/title/);
  const invalid=Buffer.from([255]);assert.throws(()=>profileMongoliaReference(invalid,{...ref,reviewed_digest:sourceDigest(invalid),reviewed_bytes:1},'text/html'));
});
test('MN: SVG title does not override the document head',()=>{
  const s=html.replace('</body>','<svg><title>icon</title></svg></body>');assert.equal(profileMongoliaReference(Buffer.from(s),{...ref,reviewed_digest:sourceDigest(s),reviewed_bytes:Buffer.byteLength(s)},'text/html').contentVerified,true);
});
test('MN: PDF exact digest, signature and MIME; dates do not confer rights',()=>{
  const b=Buffer.from('%PDF-synthetic'),r={kind:'reviewed-pdf',reviewed_digest:sourceDigest(b),reviewed_bytes:b.length,profile:{edition:'synthetic'}};
  assert.equal(profileMongoliaReference(b,r,'application/pdf').profile.rightsToDataVerified,false);
  assert.throws(()=>profileMongoliaReference(b,r,'text/html'),/mime/);
  const x=Buffer.from('not-a-pdf');assert.throws(()=>profileMongoliaReference(x,{...r,reviewed_digest:sourceDigest(x),reviewed_bytes:x.length},'application/pdf'),/signature/);
});
test('MN: response cap remains four MiB except explicit manual directory',()=>{
  const b=Buffer.alloc(4194305);assert.throws(()=>profileMongoliaReference(b,ref,'text/html'),/byte-limit/);
  assert.equal(config.references.filter(x=>x.max_bytes).length,1);assert.equal(config.references.find(x=>x.max_bytes).network_policy,'manual-bounded-document-review');
});
test('MN: observations reject absent, duplicate, rebound, altered timestamp or failure receipts',()=>{
  assert.throws(()=>inspectMongoliaObservations([]),/set/);
  const obs=config.references.map(r=>({id:r.id,requestedUrl:r.url,observedAt:r.reviewed_observed_at??'2026-08-28T19:32:19.272Z',failure:'curl-network-error'}));
  assert.throws(()=>inspectMongoliaObservations(obs),/failure-receipt/);
  assert.throws(()=>inspectMongoliaObservations(obs.map((o,i)=>i===0?{...o,requestedUrl:'https://example.com/'}:o)),/binding/);
});
test('MN: live verifier skips manual book, performs GET only and never calls private endpoints',async()=>{
  const seen=[];const r=await inspectMongoliaSources(async(url,options)=>{seen.push(url);assert.equal(options.redirect,'manual');assert.equal(options.body,undefined);assert.equal(options.headers,undefined);assert.equal(options.method,undefined);return new Response('unavailable',{status:503});});
  assert.equal(seen.length,17);assert.ok(!seen.includes('https://zipcode.mn/page/docs/1.pdf'));assert.equal(r.countryM2Achieved,false);assert.equal(r.currentAssignmentRowsValidated,0);assert.equal(r.assignmentQuality.nationalCoverage,null);
});
test('MN: unapproved redirects are not followed and upstream secrets are sanitized',async()=>{
  let n=0;const r=await inspectMongoliaSources(async()=>{n++;return new Response(null,{status:302,headers:{location:'https://attacker.invalid/?secret=never-log'}});});
  assert.equal(n,17);assert.ok(!JSON.stringify(r).includes('never-log'));assert.ok(r.references.filter(x=>x.failureKind).every(x=>x.failureKind==='unapproved-reference-host'));
  const errors=await inspectMongoliaSources(async()=>{throw Error('credential=never-log');});assert.ok(!JSON.stringify(errors).includes('never-log'));
});
test('MN: frozen definitions and reference evidence cannot be counted as M2',()=>{
  assert.equal(config.definition_basis.preserved_hard_blocker_count,11);assert.equal(config.m2_criterion.id,'M2_source_attested');assert.equal(config.rights_review.redistributionPermissionVerified,false);assert.equal(config.edition_policy.nineDigitRejectionAuthorized,false);assert.deepEqual(config.edition_policy.reportedCountConflict,[2721,2720]);assert.equal(config.references.find(x=>x.id==='upu-mongolia-addressing').profile.edition,'01/2019');
});
