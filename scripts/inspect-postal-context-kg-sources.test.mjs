import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readKyrgyzDirectoryLiteral, profileKyrgyzDirectory } from './lib/postal-context-kg-directory.mjs';
import { inspectKyrgyzSources, profileKyrgyzCatalog, profileKyrgyzReference, kyrgyzFailure } from './inspect-postal-context-kg-sources.mjs';
const html = literal => Buffer.from(`<html><head><script type="application/ld+json">{"datePublished":"2025-10-16T11:15:00+00:00","dateModified":"2025-10-28T04:52:38+00:00"}</script></head><table id="index-table"><th>Branch</th><th>Postal code</th><th>Address</th></table><script>const data = ${literal};const areaSelect = document.getElementById('area-select');</script></html>`);
const data = rows => JSON.stringify({SYN_AREA:{SYN_CITY:{_self:rows}}});
const rows=[['SYN_BRANCH','012345','SYN_CONTEXT'],['SYN_BRANCH','012345','SYN_CONTEXT'],['SYN_OTHER','012345','SYN_OTHER_CONTEXT'],['SYN_MOBILE','ОС Передвижное','SYN_VILLAGE']];
test('KG synthetic observations preserve leading zeros, mobile marker and repeated codes without collapsing rows',()=>{
  const q=profileKyrgyzDirectory(html(data(rows)),'text/html; charset=UTF-8');
  assert.equal(q.rows,4);assert.equal(q.numericCodeRows,3);assert.equal(q.leadingZeroCodeRows,3);assert.equal(q.mobileMarkerRows,1);
  assert.deepEqual(q.numericCodes,{distinct:1,repeatedGroups:1,excessOccurrences:2});assert.equal(q.exactObservationKeys.excessOccurrences,1);
  assert.equal(q.rates.mobileMarker,.25);assert.equal(q.rates.exactDuplicateExcess,.25);assert.equal(q.rates.unknownNonNumeric,0);
  assert.equal(q.productionEligible,false);assert.equal(q.sourceRowsPersisted,0);assert.equal(q.currentAssignmentVerified,false);assert.equal(q.dates.validFrom,null);
  assert.doesNotMatch(JSON.stringify(q),/SYN_BRANCH|012345|SYN_CONTEXT/);
});
test('KG unknown, missing and noncanonical cells are measured, never padded or normalized into assignments',()=>{
  const q=profileKyrgyzDirectory(html(data([['','', ''],['SYN',' 012345 ','SYN'],['SYN','１２３４５６','SYN'],['SYN','KG-123456','SYN'],['SYN','ОС Передвижное ','SYN']])),'text/html');
  assert.equal(q.missingCodeRows,1);assert.equal(q.missingBranchRows,1);assert.equal(q.missingAddressContextRows,1);assert.equal(q.numericCodeRows,0);
  assert.equal(q.nonCanonicalCodeRows,2);assert.equal(q.unknownNonNumericRows,5);assert.equal(q.mobileMarkerRows,0);
});
test('KG comparison keys flag normalization-equivalent observations without rewriting source',()=>{
  const q=profileKyrgyzDirectory(html(data([['SYN','123456','SYN  CONTEXT'],['SYN','123456','SYN CONTEXT']])),'text/html');
  assert.equal(q.exactObservationKeys.excessOccurrences,0);assert.equal(q.normalizedObservationKeys.excessOccurrences,1);
});
test('KG literal permits inert trailing commas only and rejects executable/property/duplicate-key forms',()=>{
  assert.equal(readKyrgyzDirectoryLiteral('{"a":["x",],}').a[0],'x');
  for(const value of ['{"a":(()=>{throw 1})()}','{"a":globalThis.process}','{"a":`template`}','{"a":1}','{"a":null}','{"a":true}','{"a":[...[]]}','{"a":[],"a":[]}','{["a"]:[]}','{get a(){return []}}','{"__proto__":{}}','{"constructor":{}}','{"prototype":{}}','{"":[]}','{};globalThis.KG_EXECUTED=true'])assert.throws(()=>readKyrgyzDirectoryLiteral(value));
  assert.equal(globalThis.KG_EXECUTED,undefined);
});
test('KG limits, encoding, MIME, table schema, hierarchy and row shape fail closed',()=>{
  assert.throws(()=>readKyrgyzDirectoryLiteral(' '.repeat(2097153)),/kg-literal-limit/);
  assert.throws(()=>profileKyrgyzDirectory(Buffer.from([255]),'text/html'),/kg-invalid-utf8/);
  assert.throws(()=>profileKyrgyzDirectory(html(data(rows)),'application/json'),/kg-document-mime/);
  for(const literal of ['[]','{}','{"a":{"b":[]}}',data([]),data([['a','123456']]),data([['a','123456','b','extra']])])assert.throws(()=>profileKyrgyzDirectory(html(literal),'text/html'));
  assert.throws(()=>profileKyrgyzDirectory(Buffer.concat([html(data(rows)),html(data(rows))]),'text/html'),/kg-literal-count/);
  assert.throws(()=>profileKyrgyzDirectory(Buffer.from('placeholder'),'text/html'),/kg-table-schema/);
});
test('KG catalog counts do not imply national coverage or a postal-directory licence',()=>{
  const q=profileKyrgyzCatalog({success:true,result:{count:1,results:[{private:false,id:'syn',name:'synthetic-statistics',title:'Synthetic office count',license_id:'cc-by',license_url:'https://example.invalid/terms',resources:[],author:'PRIVATE_AUTHOR',maintainer_email:'PRIVATE_EMAIL'}]}});
  assert.equal(q.count,1);assert.equal(q.notNationalAbsenceProof,true);assert.equal(q.exactDirectoryLicenceVerified,false);assert.doesNotMatch(JSON.stringify(q),/PRIVATE_/);
  assert.throws(()=>profileKyrgyzCatalog({success:true,result:{count:1,results:[{private:true}]}}),/not-public/);
  assert.throws(()=>profileKyrgyzCatalog({success:true,result:{count:0,results:[{}]}}),/shape/);
});
test('KG changed PDF, script-only marker and network errors cannot become verified sources',()=>{
  const r=profileKyrgyzReference(Buffer.from('%PDF-changed'),{mime:'application/pdf',expected_digest:'sha256:'+ '0'.repeat(64),visually_reviewed_pages:[1]},'application/pdf');assert.equal(r.sourceDocumentDigest,null);assert.equal(r.contentVerified,false);
  const s=profileKyrgyzReference(Buffer.from('<script>marker</script><p>placeholder</p>'),{mime:'text/html',markers:['marker']},'text/html');assert.equal(s.contentVerified,false);
  assert.equal(kyrgyzFailure({cause:{code:'UNABLE_TO_VERIFY_LEAF_SIGNATURE'}}),'tls-verification-failed');assert.equal(kyrgyzFailure(Error('SECRET_TOKEN')),'network-or-parser-error');
});
test('KG bounded mocked orchestration reports failed references and changed literal without M2 claims',async()=>{
  let directoryRequests=0;const visited=[];
  const fake=async(url,options)=>{visited.push(url);assert.equal(options.redirect,'manual');assert.ok(options.signal);if(url.includes('new-postal-codes'))return new Response(html(data(directoryRequests++?rows.slice(0,3):rows)),{headers:{'content-type':'text/html'}});if(url.includes('package_search'))return new Response(JSON.stringify({success:true,result:{count:0,results:[]}}),{headers:{'content-type':'application/json'}});return new Response(null,{status:503});};
  const r=await inspectKyrgyzSources(fake,'mock-no-network');assert.equal(r.directoryDownloads.length,2);assert.equal(r.catalogQueries.length,3);assert.equal(r.references.length,7);
  assert.equal(r.repeatComparison.literalDigestMatches,false);assert.equal(r.repeatComparison.bothProfiled,true);assert.equal(r.countryM2Achieved,false);assert.equal(r.assignmentQuality.missingCodeRate,null);
  assert.ok(r.references.every(v=>v.sourceDocumentDigest===null));assert.equal(visited.length,12);assert.ok(visited.every(url=>url.startsWith('https://')&&!url.includes('nsdi.kg')));
  assert.doesNotMatch(JSON.stringify(r),/SYN_BRANCH|012345|SYN_CONTEXT/);
});
