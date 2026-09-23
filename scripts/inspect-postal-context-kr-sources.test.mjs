import assert from 'node:assert/strict';
import test from 'node:test';
import AdmZip from 'adm-zip';
import {config,profileKoreaReference,inspectKoreaSources,safeKoreaSourceUrl,koreaFailure} from './inspect-postal-context-kr-sources.mjs';
import {profileKoreaPoboxText,profileKoreaPoboxArchive} from './lib/postal-context-kr-pobox.mjs';
const row=['01234','SYN_PROVINCE','','','SYN_BOX','1','','','',''];
const text=(rows=[row])=>Buffer.from(config.pobox.header.join('|')+'\r\n'+rows.map(r=>r.join('|')).join('\r\n')+'\r\n');
const archive=(data=text(),extra=false)=>{const z=new AdmZip();z.addFile(config.pobox.text_entry,data);z.addFile(config.pobox.documentation_entry,Buffer.from('d0cf11e0a1b11ae1','hex'));if(extra)z.addFile('unexpected.txt',Buffer.from('x'));return z.toBuffer();};
const indexRef=config.references.find(r=>r.kind==='download-index');
const index=`<main>2026.08.10기준<table><tr><td>사서함주소 DB</td><td><a href="/search/areacd/areacd_pobox_DB.zip">download</a></td><td>2026.08.11</td></tr></table></main>`;
const field=(k,v)=>`<strong class="key">${k}</strong><div class="value">${v}</div>`;
const catalog=(r)=>`<input id="publicDataPk" value="${r.catalog_id}">${field('OpenAPI 명',r.title_marker)}${field('수정일','2025-12-08')}${field('확장자','PPTX')}${field('전체 행','1')}${field('설명','본인확인 및 이용목적 심사')}(제 1유형)`;
const html=(value)=>new Response(value,{status:200,headers:{'content-type':'text/html; charset=utf-8'}});

test('KR PO-box observation grain preserves leading zeros, blanks and duplicate rows',()=>{
  const q=profileKoreaPoboxText(text([row,row]));assert.equal(q.rows,2);assert.equal(q.distinctPostcodes,1);assert.equal(q.multipleObservationPostcodes,1);assert.equal(q.leadingZeroRows,2);assert.equal(q.exactDuplicateExcess,1);assert.equal(q.rates.exactDuplicateExcess,0.5);
  assert.equal(q.missingByColumn[6].count,2);assert.equal(q.missingByColumn[6].rate,1);assert.equal(q.comparableFullEndpoints,0);assert.equal(q.rates.invertedFullEndpoints,null);assert.equal(q.emptyEndpointsFilled,0);assert.equal(q.rowsDeduplicated,0);assert.equal(q.blankEndpointSemanticsVerified,false);
  assert.equal(q.geometryType,'po_box');assert.equal(q.coordinateGeometry,'none');assert.equal(q.productionEligible,false);assert.equal(q.currentAssignmentRowsValidated,0);assert.doesNotMatch(JSON.stringify(q),/SYN_PROVINCE|SYN_BOX|01234/);
});
test('KR complete endpoints are compared only within their explicit denominator',()=>{
  const full=[...row];full.splice(5,4,'2','10','2','9');const q=profileKoreaPoboxText(text([row,full]));assert.equal(q.comparableFullEndpoints,1);assert.equal(q.invertedFullEndpoints,1);assert.equal(q.rates.invertedFullEndpoints,1);
});
test('KR legacy six digits, current five digits and range numbers are not conflated',()=>{
  const bad=[...row];bad[0]='123456';bad[5]='-1';bad[9]='12345';const q=profileKoreaPoboxText(text([bad]));assert.equal(q.invalidCodes,1);assert.equal(q.invalidRangeNumbers,1);assert.equal(q.invalidLegacyCodes,1);assert.equal(q.distinctPostcodes,0);assert.equal(q.currentAssignmentRowsValidated,0);
});
test('KR UTF8, exact header, column count, controls and text limits fail closed',()=>{
  assert.throws(()=>profileKoreaPoboxText(Buffer.from([255])),/kr-invalid-text-encoding/);
  assert.throws(()=>profileKoreaPoboxText(text().subarray(3)),/kr-header-drift/);
  assert.throws(()=>profileKoreaPoboxText(text([[...row,'extra']])),/kr-row-shape/);
  const bad=[...row];bad[4]='SYN\tBOX';assert.throws(()=>profileKoreaPoboxText(text([bad])),/kr-row-shape/);
  assert.throws(()=>profileKoreaPoboxText(Buffer.alloc(1048577)),/kr-text-byte-limit/);
  assert.throws(()=>profileKoreaPoboxText(Buffer.from(config.pobox.header.join('|')+'\n')),/kr-row-limit/);
});
test('KR ZIP validates both CRCs, hashes entries and never interprets HWP as geometry',()=>{
  const p=profileKoreaPoboxArchive(archive());assert.equal(p.entries.length,2);assert.ok(p.entries.every(e=>e.crcVerified&&/^sha256:[a-f0-9]{64}$/.test(e.digest)));assert.equal(p.allEntriesCrcVerified,true);assert.equal(p.text.rows,1);assert.equal(p.hwpContentReviewed,false);assert.equal(p.hwpIsNotGeometry,true);assert.equal(p.countryM2Achieved,false);
});
test('KR ZIP rejects short input, non-ZIP, extra entries and wrong documentation format',()=>{
  for(const b of [Buffer.alloc(0),Buffer.alloc(3),Buffer.from('not a zip')])assert.throws(()=>profileKoreaPoboxArchive(b),/kr-zip-signature-or-size/);
  assert.throws(()=>profileKoreaPoboxArchive(archive(text(),true)),/kr-zip-entry-count/);
  const z=new AdmZip(archive());z.updateFile(config.pobox.documentation_entry,Buffer.from('not HWP'));assert.throws(()=>profileKoreaPoboxArchive(z.toBuffer()),/kr-documentation-format-drift/);
});
test('KR ZIP rejects path-like names, encryption, unsupported method and inflated size',()=>{
  const z=new AdmZip();z.addFile('other/20260811_사서함.txt',text());z.addFile(config.pobox.documentation_entry,Buffer.from('d0cf11e0a1b11ae1','hex'));assert.throws(()=>profileKoreaPoboxArchive(z.toBuffer()),/kr-zip-entry-policy/);
  for(const kind of ['encrypted','method','oversize','crc']){
    const b=archive(),i=b.indexOf(Buffer.from('504b0102','hex'));assert.ok(i>0);
    if(kind==='encrypted')b.writeUInt16LE(b.readUInt16LE(i+8)|1,i+8);
    if(kind==='method')b.writeUInt16LE(99,i+10);
    if(kind==='oversize')b.writeUInt32LE(1048577,i+24);
    if(kind==='crc')b.writeUInt32LE((b.readUInt32LE(i+16)^1)>>>0,i+16);
    assert.throws(()=>profileKoreaPoboxArchive(b),kind==='oversize'?/kr-uncompressed-byte-limit/:kind==='crc'?/kr-zip-integrity/:/kr-zip-entry-policy/);
  }
});
test('KR catalog binds ID, title and modified date without treating PPTX rows as features',()=>{
  const r=config.references.find(r=>r.id==='mois-juso-electronic-map'),s=catalog(r),p=profileKoreaReference(Buffer.from(s),r,'text/html').profile;
  assert.equal(p.catalogRowCount,1);assert.equal(p.listedFormat,'PPTX');assert.equal(p.licence,'KOGL-Type-1');assert.equal(p.applicationAndPurposeReview,true);assert.equal(p.identityConfirmation,true);assert.equal(p.geometryArtifactDownloaded,false);assert.equal(p.catalogCountsAreNotFeatureCounts,true);
  for(const wrong of [s.replace(r.catalog_id,'0'),s.replace(r.title_marker,'unrelated'),s.replace('2025-12-08','unknown')])assert.throws(()=>profileKoreaReference(Buffer.from(wrong),r,'text/html'),/kr-catalog-binding/);
  assert.throws(()=>profileKoreaReference(Buffer.from(s),r,'application/json'),/kr-reference-mime/);
});
test('KR scripts and navigation cannot pass visible-content binding',()=>{
  const r=config.references[0],body=r.markers.join(' ');
  for(const tag of ['script','nav','header','footer'])assert.equal(profileKoreaReference(Buffer.from(`<${tag}>${body}</${tag}>`),r,'text/html').contentVerified,false);
  assert.equal(profileKoreaReference(Buffer.from('<main>'+body+'</main>'),r,'text/html').contentVerified,true);
});
test('KR current index binds the private-box download row; edition drift remains explicit',()=>{
  assert.equal(profileKoreaReference(Buffer.from(index),indexRef,'text/html').profile.editionMatches,true);
  assert.equal(profileKoreaReference(Buffer.from(index.replace('2026.08.11','2026.09.11')),indexRef,'text/html').profile.editionMatches,false);
  assert.throws(()=>profileKoreaReference(Buffer.from(index.replace('areacd_pobox_DB.zip','other.zip')),indexRef,'text/html'),/kr-index-binding/);
});
test('KR URLs and failure receipts never publish session identifiers or arbitrary errors',()=>{
  const u=safeKoreaSourceUrl('https://www.koreapost.go.kr/a;jsessionid=secret?pSiteIdx=125&token=secret#secret');assert.doesNotMatch(u,/secret/);assert.match(u,/REDACTED/);assert.match(u,/pSiteIdx=125/);
  assert.equal(koreaFailure(Error('secret')), 'network-or-parser-error');assert.equal(koreaFailure(Error('kr-archive-digest-drift')),'kr-archive-digest-drift');
});
test('KR repeat probe keeps failed references and unknown national metrics without data promotion',async()=>{
  let zipCalls=0;
  const fake=async url=>{const r=config.references.find(r=>r.url===url);if(url===config.pobox.url){zipCalls++;return new Response(archive(),{headers:{'content-type':'application/zip'}});}if(r===indexRef)return html(index);if(r.kind==='catalog')return html(catalog(r));if(r.kind==='juso-guidance')throw Error('private error');return html(r.markers.join(' '));};
  const report=await inspectKoreaSources(fake,'synthetic-test');assert.equal(zipCalls,2);assert.equal(report.references.length,10);assert.equal(report.references.filter(r=>r.status==='review-failed').length,2);assert.ok(report.poboxDownloads.every(r=>r.failureKind==='kr-archive-digest-drift'&&r.profile===null));assert.equal(report.repeatComparison.archiveBytesMatch,false);assert.equal(report.assignmentQuality.duplicateAssignmentRate,null);assert.equal(report.countryM2Achieved,false);assert.equal(report.publishedDataArtifacts,0);
});
test('KR stale index skips all data downloads and failed catalog content retains response hash',async()=>{
  let zipCalls=0;
  const fake=async url=>{if(url===config.pobox.url){zipCalls++;throw Error('must not download');}const r=config.references.find(r=>r.url===url);return html(r===indexRef?index.replace('2026.08.11','2026.09.11'):'wrong content');};
  const report=await inspectKoreaSources(fake);assert.equal(zipCalls,0);const r=report.references.find(r=>r.failureKind==='kr-catalog-binding');assert.equal(r.httpStatus,200);assert.match(r.responseDigest,/^sha256:/);assert.equal(r.sourceDocumentDigest,null);assert.equal(report.repeatComparison.indexEditionMatches,false);
});
