import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {parsePostaTable,profileAlbaniaReference,profileCadastralWorkbook,sourceDigest,validateAlbaniaAuditReport} from './inspect-postal-context-al-sources.mjs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/al-source-review-2026-08-29.json',import.meta.url),'utf8'));
const fixtureReference=(bytes,kind='html',markers=[])=>({kind,mime:'text/html',markers,reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes)});

test('Albania review binds twenty-two exact official references and remains blocked',()=>{
 assert.deepEqual(validateAlbaniaAuditReport(report),{references:22,postaRows:535,distinctPostcodes:532,officialPostalGeometryRecords:0,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,22);
});

test('Posta public tables preserve 535 office rows, 532 codes and three duplicate groups',()=>{
 assert.equal(report.postaTableRowsObserved,535);assert.equal(report.distinctPostcodesObserved,532);assert.equal(report.duplicatePostcodeGroups,3);
 assert.deepEqual(report.duplicatePostcodesObserved,['4018','5008','8502']);assert.equal(report.currentEditionCompletePostalRows,0);
});

test('open cadastral workbook remains a property inventory and not postcode membership',()=>{
 const profile=report.openDataWorkbook.profile;
 assert.equal(profile.dataRows,562);assert.equal(profile.cadastralZoneValues,430);assert.equal(profile.distinctCadastralZones,333);
 assert.equal(profile.postalCodeColumns,0);assert.equal(profile.geometryColumns,0);assert.equal(profile.coordinateColumns,0);
 assert.equal(report.postalPolicy.cadastralZoneIsPostcodeArea,false);assert.equal(report.rawSourceBodiesInGit,0);
});

test('ASIG address layers and restricted terms cannot authorize postal geometry',()=>{
 assert.equal(report.rights.asigNonCommercialOnly,true);assert.equal(report.rights.asigAutomatedProgramsProhibited,true);
 assert.equal(report.rights.asigDownloadCredentialsRequired,true);assert.equal(report.postalPolicy.addressBuildingIsPostcodeArea,false);
 assert.equal(report.officialPostalGeometryRecords,0);assert.equal(report.derivedPostalGeometryRecords,0);
});

test('HTML table and reference profilers fail closed on drift, MIME and markers',()=>{
 const table=Buffer.from('<table><tr><td>1</td><td>Office A</td><td>1001</td></tr><tr><td>2</td><td>Office B</td><td>1002</td><td></td></tr></table>');
 assert.deepEqual(parsePostaTable(table.toString()),[{number:'1',office:'Office A',code:'1001'},{number:'2',office:'Office B',code:'1002'}]);
 const reference={...fixtureReference(table,'posta-table'),expected_rows:2};assert.equal(profileAlbaniaReference(table,reference,'text/html; charset=utf-8').source_data_rows_reviewed,2);
 assert.throws(()=>profileAlbaniaReference(Buffer.concat([table,Buffer.from('x')]),reference,'text/html'),/content-drift/);
 assert.throws(()=>profileAlbaniaReference(table,reference,'application/pdf'),/mime/);
 const html=Buffer.from('Open Data reusable');const htmlReference=fixtureReference(html,'html',['Open Data','reusable']);
 assert.equal(profileAlbaniaReference(html,htmlReference,'text/html').markers_verified,2);
 assert.throws(()=>profileAlbaniaReference(html,{...htmlReference,markers:['missing']},'text/html'),/content-marker/);
});

test('PDF and XLSX signatures are fail closed',()=>{
 const pdf=Buffer.from('%PDF-exact');const pdfRef={...fixtureReference(pdf,'reviewed-pdf'),mime:'application/pdf',manual_pdf_review:{pdf_pages:1}};
 assert.equal(profileAlbaniaReference(pdf,pdfRef,'application/pdf').visual_review_bound_by_exact_bytes,true);
 assert.throws(()=>profileCadastralWorkbook(Buffer.from('not-a-zip')),/xlsx-signature/);
});

test('sourceDigest is stable and names SHA-256',()=>{
 const value=sourceDigest(Buffer.from('AGID Albania M2'));assert.match(value,/^sha256:[0-9a-f]{64}$/);assert.equal(value,sourceDigest(Buffer.from('AGID Albania M2')));
});
