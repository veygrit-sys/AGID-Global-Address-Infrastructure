import assert from 'node:assert/strict';
import {test} from 'node:test';
import {config,inspectSaudiArabiaObservations,parseCsv,profileCsv,profileReference} from './inspect-postal-context-sa-sources.mjs';

test('SA CSV parser preserves UTF-8 BOM, quoted commas, quotes, and embedded newlines',()=>{
 const rows=parseCsv(Buffer.from('\ufeffid,name,postal\r\n1,"a,b",01234\r\n2,"two\r\nlines",54321\r\n3,"say ""hi""",\r\n'));
 assert.deepEqual(rows,[['id','name','postal'],['1','a,b','01234'],['2','two\r\nlines','54321'],['3','say "hi"','']]);
 const profile=profileCsv(Buffer.from('\ufeffid,postal\r\n1,01234\r\n1,01234\r\n'));
 assert.equal(profile.rows,2);assert.equal(profile.exactDuplicateRows,1);assert.equal(profile.fields[1].candidatePostal,true);
});

test('SA CSV profiler rejects malformed widths and unterminated quotes',()=>{
 assert.throws(()=>profileCsv(Buffer.from('a,b\n1\n')),/sa-csv-width/);
 assert.throws(()=>parseCsv(Buffer.from('a,b\n1,"x\n')),/sa-csv-unclosed-quote/);
});

test('SA fixed digests bind all content and the manual UPU review',()=>{
 for(const ref of config.references.filter(ref=>ref.expected_digest))assert.throws(()=>profileReference(Buffer.from('changed'),ref),/sa-content-drift/);
 const upu=config.references.find(ref=>ref.id==='upu-sa');
 assert.deepEqual(upu.manual_pdf_review.visually_reviewed_physical_pages,[1,2]);
 assert.equal(upu.manual_pdf_review.examples_are_assignments,false);
});

test('SA observation set and URLs are fail-closed',()=>{
 assert.throws(()=>inspectSaudiArabiaObservations([]),/sa-observation-set/);
 const observations=config.references.map(ref=>({id:ref.id,requestedUrl:'https://invalid.example/',observedAt:ref.reviewed_observed_at}));
 assert.throws(()=>inspectSaudiArabiaObservations(observations),/sa-observation-binding/);
});
