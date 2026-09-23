import assert from 'node:assert/strict';
import {test} from 'node:test';
import {profileUzbekistanDetail,profileUzbekistanMapView,profileUzbekistanOfficeList,profileUzbekistanPublicOffer,sourceDigest,validateUzbekistanAuditReport} from './inspect-postal-context-uz-sources.mjs';
import {readFileSync} from 'node:fs';

const report=JSON.parse(readFileSync(new URL('../reports/postal-context-m2/uz-source-review-2026-08-29.json',import.meta.url),'utf8'));
const ref=bytes=>({id:'fixture',reviewed_bytes:bytes.length,expected_digest:sourceDigest(bytes)});

test('Uzbekistan review binds exact primary-source receipts and remains blocked',()=>{
 assert.deepEqual(validateUzbekistanAuditReport(report),{references:10,officeIndices:1593,observedRings:1,productionGeometryRecords:0,countryM2Achieved:false});
 assert.equal(report.references.filter(item=>item.contentVerified).length,10);
});

test('office list records exact national index-list limits',()=>{
 assert.equal(report.officeIndexProfile.rows,1593);
 assert.equal(report.officeIndexProfile.uniqueSixDigitIndices,1593);
 assert.equal(report.officeIndexProfile.validOfficeCoordinateRows,1591);
 assert.equal(report.officeIndexProfile.invalidOfficeCoordinateRows,2);
 assert.deepEqual(report.officeIndexProfile.invalidCoordinates.map(item=>item.postcode),['190108','190100']);
 assert.equal(report.officeIndexProfile.geometryFields,0);
});

test('single detail ring proves bounded operator geometry but not completeness',()=>{
 assert.equal(report.detailSampleProfile.sampledPostcode,'100000');
 assert.equal(report.detailSampleProfile.ringVertices,98);
 assert.equal(report.detailSampleProfile.ringClosed,true);
 assert.equal(report.detailSampleProfile.selfIntersectionPairs,0);
 assert.equal(report.detailSampleProfile.nationalDetailCoverageValidated,false);
 assert.deepEqual(report.detailSampleProfile.serverStyle,{fill:'#b51eff',fillOpacity:0.3,stroke:'#595959',strokeWidth:2,strokeOpacity:1});
});

test('operator app search, translucent Polygon and fit are explicit evidence',()=>{
 assert.equal(report.operatorAppProfile.postcodeTextSearchVerifiedInClient,true);
 assert.equal(report.operatorAppProfile.yandexPolygonConstructionVerified,true);
 assert.equal(report.operatorAppProfile.translucentFillVerified,true);
 assert.equal(report.operatorAppProfile.fitBoundsVerified,true);
 assert.equal(report.appPath.operatorAppRealSearchToAreaVerified,true);
 assert.equal(report.appPath.uzbekistanCountryEndToEndVerified,false);
});

test('public access is not promoted to an AGID data licence',()=>{
 assert.equal(report.rights.publicOfferAppliesToWebsiteAndMobileApp,true);
 assert.equal(report.rights.registrationOrUseMayConstituteAcceptance,true);
 assert.equal(report.rights.bulkReuseGrantVerified,false);
 assert.equal(report.rights.derivativePolygonGrantVerified,false);
 assert.equal(report.rights.redistributionGrantVerified,false);
 assert.equal(report.rights.persistentPublicApiServingGrantVerified,false);
 assert.equal(report.rights.accountsRegistrationsOrContractAcceptances,0);
});

test('profilers fail closed on byte drift and validate their grains',()=>{
 const offices=Buffer.from(JSON.stringify({result:Array.from({length:1593},(_,i)=>({index:String(100000+i),lat:'41',lng:i===0?'oops':'69'}))}));
 assert.throws(()=>profileUzbekistanOfficeList(offices,ref(offices)),/office-list-profile/);
 const detail=Buffer.from(JSON.stringify({result:{postal_office:{index:'100000'},locations:{fill:'#a',fill_opacity:'0.3',stroke:'#b',stroke_width:'2',stroke_opacity:'1',locations:[[0,0],[0,1],[1,1],[0,0]]}}}));
 assert.throws(()=>profileUzbekistanDetail(detail,ref(detail)),/detail-profile/);
 const map=Buffer.from('maps/new/post/offices/ maps/new/post/offices/detail/${e}/ maps/new/post/offices/by-address/ new window.ymaps.Polygon fillOpacity strokeOpacity setBounds');
 assert.deepEqual(profileUzbekistanMapView(map,ref(map)),{officeListEndpoint:true,detailEndpoint:true,addressEndpoint:true,yandexPolygon:true,serverFillOpacity:true,serverStrokeOpacity:true,fitBounds:true});
 const offer=Buffer.from(JSON.stringify([{id:5,title_ru:'Политика конфиденциальности',text_ru:'Публичная оферта об использовании веб-сайта и мобильного приложения. Акцепт условий.',text_uz:''}]));
 assert.equal(profileUzbekistanPublicOffer(offer,ref(offer)).explicitBulkReuseLicence,false);
 assert.throws(()=>profileUzbekistanMapView(Buffer.concat([map,Buffer.from('x')]),ref(map)),/content-drift/);
});

test('digest is deterministic and names its algorithm',()=>{
 const value=sourceDigest(Buffer.from('AGID Uzbekistan M2'));
 assert.match(value,/^sha256:[0-9a-f]{64}$/);
 assert.equal(value,sourceDigest(Buffer.from('AGID Uzbekistan M2')));
});
