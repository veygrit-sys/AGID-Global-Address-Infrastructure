import assert from 'node:assert/strict';import {test} from 'node:test';
import {readMalaysiaPostcodes,normalizeMalaysiaAssignments,profileMalaysiaPostcodes,profileMalaysiaCatalog,reconcileMalaysiaCatalog,MY_POSTCODE_URLS} from './postal-context-my-postcodes.mjs';
const csv=s=>Buffer.from('state,city,postcode\n'+s);
test('MY preserves leading zeroes, raw labels and exact duplicate lineage without hiding ambiguity',()=>{
 const rows=readMalaysiaPostcodes(csv('Synthetic State,Synthetic City,01234\nSynthetic State  ,Synthetic City,01234\nSynthetic State,Other Synthetic City ,01234\n'));
 const a=normalizeMalaysiaAssignments(rows),p=profileMalaysiaPostcodes(rows);assert.equal(a.length,2);assert.ok(a.every(r=>r.postcode==='01234'&&r.geometry===null&&r.sourceEffectiveFrom===null));assert.equal(rows[1].rawState,'Synthetic State  ');assert.deepEqual(a.flatMap(x=>x.sourceRows).sort(),[2,3,4]);assert.equal(p.duplicateNormalizedTuples,1);assert.equal(p.ambiguousPostalCodes,1);assert.equal(p.leadingZeroRows,3);assert.equal(p.nationalCoverageIndependentlyVerified,false);
});
test('MY CSV refuses bad bytes, quotes, extra/private columns, malformed codes and blanks',()=>{
 for(const input of [Buffer.from([255]),csv('Synthetic,Synthetic,1234'),csv('Synthetic,Synthetic,１２３４５'),csv('Synthetic,Synthetic, 01234'),csv('Synthetic,Synthetic,01234,owner'),csv('Synthetic,"Quoted",01234'),csv('Synthetic,Synthetic,01234\n\n'),csv('Synthetic,\tCity,01234'),csv('  ,Synthetic,01234'),Buffer.alloc(2097153)])assert.throws(()=>readMalaysiaPostcodes(input),/my-/);
 assert.throws(()=>readMalaysiaPostcodes(csv('S,C,01234'),'text/html'),/csv-mime/);
});
test('MY accepts reviewed LF/CRLF and Unicode labels without postcode number coercion',()=>{
 const a=readMalaysiaPostcodes(csv('Synthetic,Caf\u00e9,00000\n')),b=readMalaysiaPostcodes(Buffer.from('state,city,postcode\r\nSynthetic,Cafe\u0301,00000\r\n'));assert.deepEqual(normalizeMalaysiaAssignments(a),normalizeMalaysiaAssignments(b));assert.equal(a[0].postcode,'00000');
});
test('MY identifiers distinguish same-named cities in different state namespaces',()=>{
 const a=normalizeMalaysiaAssignments(readMalaysiaPostcodes(csv('State A,Same City,01234\nState B,Same City,01234')));assert.notEqual(a[0].id,a[1].id);
});
function catalog(data){const p={id:'poskod',meta:{agency:'MCMC'},frequency:'YEARLY',link_csv:MY_POSTCODE_URLS.csv,link_parquet:MY_POSTCODE_URLS.parquet,link_editions:null,fields:['state','city','postcode'].map(name=>({name})),data_source:['MCMC'],data_as_of:'2026-06',last_updated:'2026-06-16 12:00',caveat:'verify the current validity',data};return Buffer.from('<a href="https://creativecommons.org/licenses/by/4.0/">License</a><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({props:{pageProps:p}})+'</script>');}
test('MY catalog binds provider, edition, exact URLs and full row multiset',()=>{
 const rows=readMalaysiaPostcodes(csv('Synthetic,Synthetic,01234')),p=profileMalaysiaCatalog(catalog([{state:'Synthetic',city:'Synthetic',postcode:'01234'}]));assert.equal(reconcileMalaysiaCatalog(rows,p).allRowsEqualAsMultiset,true);assert.equal(p.immutableEditionLink,null);assert.throws(()=>reconcileMalaysiaCatalog(rows,{...p,preview:[]}),/disagreement/);assert.throws(()=>profileMalaysiaCatalog(Buffer.from(catalog([]).toString().replace('2026-06','2027-06'))),/edition/);assert.throws(()=>profileMalaysiaCatalog(catalog([{state:'S',city:'C',postcode:1234}])) ,/schema/);
});
