import assert from 'node:assert/strict';
import test from 'node:test';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
import {config,profileKazakhstanApiDocument,profileKazakhstanReference,inspectKazakhstanSources,kazakhstanFailure,safeKazakhstanUrl,kazakhstanPlain} from './inspect-postal-context-kz-sources.mjs';
const encode=x=>Buffer.from(JSON.stringify(x)),a=config.api_documentation;
const sample=()=>({data:[{postcode:'X99X9X9',addressKaz:'SYN_KAZ',addressRus:'SYN_RUS',addressLat:'SYN_LAT',coordinateX:null,coordinateY:null,_links:{}}]});
const capture=(rows=sample(),structure='{"data":[{"coordinateX":"string","coordinateY":"string"}],}')=>({url:a.url,observedAt:'2026-08-28T16:59:50.182Z',title:a.title,text:[a.bearer_notice,a.endpoint_template,'РКА',a.example_heading,JSON.stringify(rows),a.structure_heading,structure].join('\n')});
const shell=r=>'<html><head><title>'+(r.title??'')+'</title></head><body><div id="'+r.root_id+'"></div></body></html>';
const legal=(r,body)=>'<main><h1>'+r.title+'</h1><a href="/rus/docs/'+r.document_id+'">text</a><article>'+body+'</article></main>';
const response=s=>new Response(s,{headers:{'content-type':'text/html'}});

test('KZ documentation examples stay non-live and null coordinates never become zero or geometry',()=>{
  const p=profileKazakhstanApiDocument(encode(capture()));assert.equal(p.documentationExamples,1);assert.equal(p.documentedNullCoordinatePairs,1);assert.equal(p.nullCoordinatePairRate,1);assert.equal(p.declaredStructureParseableJson,false);assert.ok(p.documentedCoordinateTypes.every(t=>t.declaredString));assert.equal(p.exampleCoordinatesConvertedToZero,0);assert.equal(p.currentAssignmentRowsValidated,0);assert.equal(p.productionGeometryRecords,0);assert.equal(p.rawHttpDataBytesVerified,false);assert.equal(p.immutableDataArtifact,false);assert.equal(p.countryM2Achieved,false);assert.doesNotMatch(JSON.stringify(p),/SYN_KAZ|X99X9X9/);
});
test('KZ coordinate strings and valid documentation JSON still cannot establish CRS or live coverage',()=>{
  const s=sample();s.data[0].coordinateX='0';s.data[0].coordinateY='0';const p=profileKazakhstanApiDocument(encode(capture(s,'{"data":[]}')));assert.equal(p.documentedNullCoordinatePairs,0);assert.equal(p.nullCoordinatePairRate,0);assert.equal(p.declaredStructureParseableJson,true);assert.ok(p.documentedCoordinateTypes.every(t=>!t.declaredString));assert.equal(p.coordinateReferenceSystemVerified,false);assert.equal(p.liveRequestsMade,0);
});
test('KZ document capture rejects URL, title, authentication-text, timestamp, extra-field and section drift',()=>{
  for(const alter of [d=>d.url+='?token=secret',d=>d.title='wrong',d=>d.observedAt='unknown',d=>d.secret='private',d=>d.text=d.text.replace(a.bearer_notice,'none'),d=>d.text+=a.example_heading]){
    const d=capture();alter(d);assert.throws(()=>profileKazakhstanApiDocument(encode(d)),/kz-doc-/);
  }
});
test('KZ malformed, oversized, empty or unexpected example data cannot be profiled as an API contract',()=>{
  for(const b of [Buffer.alloc(0),Buffer.alloc(32769),Buffer.from([255]),Buffer.from('{}')])assert.throws(()=>profileKazakhstanApiDocument(b),/kz-doc-/);
  for(const modify of [s=>s.data=[],s=>s.data=Array(11).fill(s.data[0]),s=>s.data[0].postcode='999999',s=>s.data[0].owner='private',s=>s.data[0].coordinateX={}]){const s=sample();modify(s);assert.throws(()=>profileKazakhstanApiDocument(encode(capture(s))),/kz-doc-example-shape/);}
});
test('KZ legal content binds document identity, title and exact normalized article, not a changing footer',()=>{
  const ref={...config.references.find(r=>r.kind==='reviewed-legal'),expected_article_digest:sourceDigest('SYN normative text')},body='<p>SYN&nbsp; normative text</p>';
  for(const footer of ['2026-08-28','2026-09-01']){const p=profileKazakhstanReference(Buffer.from(legal(ref,body)+'<footer>'+footer+'</footer>'),ref,'text/html');assert.equal(p.contentVerified,true);assert.equal(p.profile.articleDigest,ref.expected_article_digest);assert.equal(p.profile.httpLastModifiedIsNotLegalEdition,true);assert.equal(p.sourceDataRecords,0);}
  assert.throws(()=>profileKazakhstanReference(Buffer.from(legal(ref,'changed')),ref,'text/html'),/kz-legal-article-drift/);
  assert.throws(()=>profileKazakhstanReference(Buffer.from(legal(ref,body).replace(ref.document_id,'wrong')),ref,'text/html'),/kz-legal-binding/);
});
test('KZ navigation, hidden scripts and duplicated legal articles cannot satisfy normative evidence',()=>{
  const ref=config.references.find(r=>r.kind==='reviewed-legal');
  for(const s of ['<script>'+legal(ref,'x')+'</script>',legal(ref,'x')+'<article>x</article>',legal(ref,'x').replace('<h1>','<h2>').replace('</h1>','</h2>')])assert.throws(()=>profileKazakhstanReference(Buffer.from(s),ref,'text/html'),/kz-legal-binding/);
  const ref2=config.references.find(r=>r.kind==='reference');for(const t of ['nav','script','header','footer'])assert.equal(profileKazakhstanReference(Buffer.from('<'+t+'>'+ref2.markers.join(' ')+'</'+t+'>'),ref2,'text/html').contentVerified,false);
});
test('KZ JS shells are recognized but are neither verified reference bodies nor empty datasets',()=>{
  for(const ref of config.references.filter(r=>r.kind==='app-shell')){const p=profileKazakhstanReference(Buffer.from(shell(ref)),ref,'text/html');assert.equal(p.status,'application-shell-not-data');assert.equal(p.contentVerified,false);assert.equal(p.profile.emptyHtmlDoesNotMeanDataAbsent,true);}
  const ref=config.references[1];assert.throws(()=>profileKazakhstanReference(Buffer.from(shell(ref).replace('id="root"','id="other"')),ref,'text/html'),/kz-shell-binding/);
});
test('KZ changed PDF requires fresh two-page visual review; no example is a production row',()=>{
  const ref=config.references.find(r=>r.kind==='reviewed-pdf');assert.deepEqual(ref.visually_reviewed_pages,[1,2]);assert.equal(ref.printed_edition,'07/2025');assert.throws(()=>profileKazakhstanReference(Buffer.from('%PDF-test'),ref,'application/pdf'),/kz-pdf-drift/);assert.throws(()=>profileKazakhstanReference(Buffer.from('html'),ref,'application/pdf'),/kz-pdf-format/);
});
test('KZ RKA length is not silently narrowed to digits or conflated with either postcode type',()=>{
  const r=config.references.find(r=>r.id==='kazakhstan-addressing-rules-2026');assert.equal(r.semantics.rkaLength,16);assert.equal(r.semantics.rkaLengthUnit,'characters');assert.equal(r.semantics.rkaAlphabetVerified,false);assert.equal(r.semantics.rkaIsNotPostcode,true);
  assert.equal(config.m2_criterion.id,'M2_typed_assignment_geometry');assert.match(config.m2_criterion.definition,/point or area geometry.*current-versus-legacy.*RKA\/building-link review.*actual AGID/);
});
test('KZ arbitrary errors and address-query parameters do not leak into receipts',()=>{
  assert.equal(kazakhstanFailure(Error('private error')),'network-or-parser-error');assert.equal(kazakhstanFailure(Error('curl-tls-verification-failed')),'curl-tls-verification-failed');assert.doesNotMatch(safeKazakhstanUrl('https://a:secret@open.post.kz/x?query=private&token=secret#private'),/secret|private/);assert.equal(kazakhstanPlain('<b>x</b>&nbsp;&quot;y&quot;'),'x "y"');
});
test('KZ bounded probe retains failures, shell and unverified-content hashes without data promotion',async()=>{
  const fake=async url=>{const r=config.references.find(r=>r.url===url);if(r.kind==='app-shell')return response(shell(r));if(r.kind==='reviewed-pdf')return new Response('%PDF-fake',{headers:{'content-type':'application/pdf'}});if(r.kind==='reviewed-legal')return response(legal(r,'changed'));if(r.kind==='manual-review')throw Error('private secret');return response(r.markers.join(' '));};
  const p=await inspectKazakhstanSources(fake,'synthetic-test',encode(capture()));assert.equal(p.references.length,11);assert.equal(p.references.filter(r=>r.status==='application-shell-not-data').length,3);
  const bad=p.references.find(r=>r.failureKind==='kz-legal-article-drift-requires-review');assert.equal(bad.httpStatus,200);assert.match(bad.responseDigest,/^sha256:/);assert.equal(bad.sourceDocumentDigest,null);
  assert.equal(p.assignmentQuality.missingCodeRate,null);assert.equal(p.countryM2Achieved,false);assert.equal(p.authenticatedRequests,0);assert.equal(p.publishedDataArtifacts,0);assert.doesNotMatch(JSON.stringify(p),/private secret|SYN_KAZ/);
});
test('KZ HTTP errors and unreviewed legal translations cannot gain source verification',async()=>{
  const p=await inspectKazakhstanSources(async url=>url.includes('/eng/')?response('unreviewed translation'):new Response('no',{status:503}),'synthetic-test');assert.equal(p.apiDocumentation,null);assert.equal(p.references.filter(r=>r.status==='http-error').length,10);assert.ok(p.references.every(r=>!r.contentVerified&&r.sourceDocumentDigest===null));
});
