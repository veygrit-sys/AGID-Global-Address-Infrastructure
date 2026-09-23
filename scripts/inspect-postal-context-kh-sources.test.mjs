import assert from 'node:assert/strict';
import { test } from 'node:test';
import { config, resourceUrl, profileCambodiaPackage, profileCambodiaReference, cambodiaFailure, inspectCambodiaSources } from './inspect-postal-context-kh-sources.mjs';
import { KH_HEADERS, readCambodiaTable, profileCambodiaTable, reconcileCambodiaTables } from './lib/postal-context-kh-tables.mjs';
const encode=(level,rows)=>Buffer.from('\uFEFF'+[KH_HEADERS[level],...rows].map(row=>row.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n');
const row=(level,code='010000',id='1')=>({province:['1',id,'SYN_K','SYN_LATIN',code,'SYN_REFERENCE'],district:['1',id,'1','SYN_K','SYN_LATIN',code,'SYN_REFERENCE'],commune:['1',id,'101','1','SYN_K','SYN_LATIN',code,'SYN_REFERENCE']})[level];
const parse=(level,rows)=>readCambodiaTable(encode(level,rows),level);
const packageBody=()=>({success:true,result:{id:config.dataset.id,name:config.dataset.name,private:false,state:'active',organization:{name:'cambodia-organization'},version:'synthetic',resources:config.resources.map(r=>({id:r.id,url:resourceUrl(r),format:'CSV',size:0,hash:'not-sha256'}))}});

test('KH quoted CSV preserves UTF-8, zeroes and embedded lines without treating padding as missing assignments',()=>{
  const a=row('district','010100','101');a[3]='SYN_ខ្មែរ';a[4]='SYN "quoted",\nsecond line';
  const table=parse('district',[Array(7).fill(''),a,Array(7).fill('')]);
  assert.equal(table.rows[0].postal_code,'010100');assert.equal(table.rows[0].district,a[4]);assert.equal(table.rows[0].ordinal,2);assert.equal(table.rows[0].dataOrdinal,1);
  const q=profileCambodiaTable(table);assert.equal(q.rows,1);assert.equal(q.blankLogicalRecords,2);assert.equal(q.missingFields,0);assert.equal(q.leadingZeroPostalCodes,1);assert.equal(q.nonContiguousSerials,0);assert.equal(q.productionEligible,false);
});
test('KH schema, encoding, MIME, byte, row and quote drift fail closed',()=>{
  for(const [bytes,level,mime] of [[Buffer.from('postal_code\n010000'),'province','text/csv'],[Buffer.from([255]),'province','text/csv'],[encode('province',[row('province')]),'province','text/html'],[Buffer.alloc(2097153),'province','text/csv'],[Buffer.from(KH_HEADERS.province.join(',')+'\n"bad'),'province','text/csv'],[Buffer.from(KH_HEADERS.province.join(',')+'\n1,2'),'province','text/csv'],[encode('province',[Array(6).fill('')]),'province','text/csv'],[encode('province',[row('province')]),'unknown','text/csv']])assert.throws(()=>readCambodiaTable(bytes,level,mime),/kh-/);
  assert.throws(()=>parse('province',Array.from({length:10001},()=>row('province'))),/row-limit/);
  const long=row('province');long[2]='a'.repeat(8193);assert.throws(()=>parse('province',[long]),/field-limit/);
  assert.throws(()=>readCambodiaTable(Buffer.from(KH_HEADERS.province.join(',')+'\n"a"b,,,,,'),'province'),/quote/);
});
test('KH source duplicates, invalid codes and admin comparisons never cause automatic deduplication or correction',()=>{
  const a=row('district','010100','101'),b=[...a];b[0]='2';b[1]='102';
  const c=[...a];c[0]='3';c[5]='101';c[6]='';const q=profileCambodiaTable(parse('district',[a,b,c]));
  assert.equal(q.rows,3);assert.equal(q.postalCodes.excess,1);assert.deepEqual(q.postalCodes.duplicateOrdinals,[[1,2]]);assert.equal(q.invalidPostalCodes,1);assert.equal(q.missingFields,1);assert.equal(q.referenceMissing,1);assert.equal(q.postalVsAdministrativeCodeDisagreement,1);assert.equal(q.rates.invalidPostalCodes,1/3);assert.equal(q.currentAssignmentRowsValidated,0);
  const exact=[...a];exact[0]='2';assert.equal(profileCambodiaTable(parse('district',[a,exact])).exactContentKeys.excess,1);
});
test('KH joins distinguish absent, ambiguous and postal-prefix mismatched parents, without inferring boundaries',()=>{
  const p=parse('province',[row('province')]),d=parse('district',[row('district','010100','101')]),c=parse('commune',[row('commune','010101','10101')]);
  assert.equal(reconcileCambodiaTables(p,d,c).communeToDistrict.postalParentMismatchRows,0);
  const bad=row('commune','010201','10101');const q=reconcileCambodiaTables(p,d,parse('commune',[bad]));assert.equal(q.communeToDistrict.postalParentMismatchRows,1);assert.equal(q.originalPdfFullRowReconciliation,false);assert.equal(q.currentAssignmentVerified,false);
  bad[2]='999';assert.equal(reconcileCambodiaTables(p,d,parse('commune',[bad])).communeToDistrict.missingParentRows,1);
  const repeated=row('province');repeated[0]='2';assert.equal(reconcileCambodiaTables(parse('province',[row('province'),repeated]),d,c).districtToProvince.ambiguousParentRows,1);
  assert.throws(()=>reconcileCambodiaTables(d,p,c),/kh-join-level/);
});
test('KH CKAN binding accepts only public expected package/resource URLs, no resource metadata integrity inheritance',()=>{
  const body=packageBody(),q=profileCambodiaPackage(body);assert.equal(q.resources.length,6);assert.equal(q.resources[0].publisherHashUsedForIntegrity,false);assert.equal(q.currentAssignmentVerified,false);
  for(const mutate of [x=>x.result.private=true,x=>x.result.id='other',x=>x.result.organization.name='other',x=>x.result.resources.pop(),x=>x.result.resources[0].url='https://example.org/data.csv',x=>x.result.resources[0].format='JSON',x=>x.result.resources[0].id=x.result.resources[1].id]){const copy=structuredClone(body);mutate(copy);assert.throws(()=>profileCambodiaPackage(copy),/kh-/);}
  assert.throws(()=>profileCambodiaPackage(body,'unknown'),/kh-package-binding/);
  assert.throws(()=>profileCambodiaPackage(body,'law'),/kh-package-binding/);
});
test('KH changed PDF needs human re-review; HTML title/scripts alone are not content proof',()=>{
  const q=profileCambodiaReference(Buffer.from('%PDF-SYNTHETIC'),config.references[0],'application/pdf');assert.equal(q.contentVerified,false);assert.equal(q.sourceDocumentDigest,null);assert.equal(q.fullRowReconciliation,false);
  const ref={mime:'text/html',markers:['SYN_BODY']};assert.equal(profileCambodiaReference(Buffer.from('<head>SYN_BODY</head><script>SYN_BODY</script>'),ref,'text/html').contentVerified,false);
  assert.equal(profileCambodiaReference(Buffer.from('<p>SYN_BODY</p>'),ref,'text/html').contentVerified,true);
  assert.equal(profileCambodiaReference(Buffer.from('<p>SYN_BODY</p>'),ref,'text/plain').contentVerified,false);
  assert.equal(cambodiaFailure(Error('https://private.example/?token=secret')),'network-or-parser-error');
});
test('KH failed metadata cannot trigger CSV downloads or fabricate a PDF digest or M2 result',async()=>{
  const calls=[];const report=await inspectCambodiaSources(async(url)=>{calls.push(url);return new Response(null,{status:503});});
  assert.ok(calls.every(url=>!url.endsWith('.csv')));assert.equal(report.uniqueCapturedRows,null);assert.equal(report.primaryComparison.manualExceptionBoundToCapturedDigests,false);assert.equal(report.repeatComparison.districtDigestMatches,false);
  assert.ok(report.references.every(r=>r.sourceDocumentDigest===null));assert.equal(report.countryM2Achieved,false);assert.equal(report.sourceRowsPersisted,0);assert.equal(report.realAgidRuntimeVerified,false);
});
test('KH bounded all-resource replay groups aliases once, repeats metadata/CSV and never persists source rows',async()=>{
  const body=packageBody();const responses=new Map([[config.dataset.url,JSON.stringify(body)]]);
  for(const r of config.resources)responses.set(resourceUrl(r),encode(r.level,[row(r.level,r.level==='province'?'010000':r.level==='district'?'010100':'010101',r.level==='province'?'1':r.level==='district'?'101':'10101')]));
  const report=await inspectCambodiaSources(async(url)=>{const bytes=responses.get(url);return bytes?new Response(bytes,{headers:{'content-type':url.endsWith('.csv')?'text/csv':'application/json'}}):new Response(null,{status:404});});
  assert.equal(report.uniqueCapturedTables,3);assert.equal(report.uniqueCapturedRows,3);assert.equal(report.tableDownloads.length,7);assert.equal(report.repeatComparison.districtDigestMatches,true);assert.equal(report.repeatComparison.metadataProfileMatches,true);assert.equal(report.crossTableChecks.communeToDistrict.missingParentRows,0);assert.equal(report.countryM2Achieved,false);assert.equal(report.currentAssignmentRowsValidated,0);assert.doesNotMatch(JSON.stringify(report),/SYN_K|SYN_LATIN|SYN_REFERENCE/);
});
