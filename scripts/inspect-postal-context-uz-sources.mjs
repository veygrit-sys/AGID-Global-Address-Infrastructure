import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

export const config=JSON.parse(readFileSync(new URL('../data/postal_country_packs/uz/postal-context/m2-source-review.json',import.meta.url),'utf8'));
const fail=message=>{throw new Error(`uz-${message}`)};
export const sourceDigest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const bind=(bytes,reference)=>{
 if(!Buffer.isBuffer(bytes)||bytes.length!==reference.reviewed_bytes||sourceDigest(bytes)!==reference.expected_digest)fail(`${reference.id}-content-drift`);
};
const finiteCoordinate=([lat,lon])=>Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
const orient=(a,b,c)=>(b[1]-a[1])*(c[0]-a[0])-(b[0]-a[0])*(c[1]-a[1]);
const intersects=(a,b,c,d)=>{
 const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);
 return ((o1>0&&o2<0)||(o1<0&&o2>0))&&((o3>0&&o4<0)||(o3<0&&o4>0));
};

export function profileUzbekistanOfficeList(bytes,reference){
 bind(bytes,reference);
 const rows=JSON.parse(bytes).result;
 if(!Array.isArray(rows))fail('office-list-shape');
 const indices=rows.map(row=>String(row.index??''));
 const validCoordinates=rows.filter(row=>finiteCoordinate([Number(row.lat),Number(row.lng)]));
 const invalid=rows.filter(row=>!finiteCoordinate([Number(row.lat),Number(row.lng)]));
 const result={
  rows:rows.length,
  uniqueSixDigitIndices:new Set(indices.filter(value=>/^\d{6}$/.test(value))).size,
  duplicateIndices:indices.length-new Set(indices).size,
  validOfficeCoordinateRows:validCoordinates.length,
  invalidOfficeCoordinateRows:invalid.length,
  invalidCoordinates:invalid.map(row=>({postcode:String(row.index),lat:String(row.lat),lng:String(row.lng)})),
  distinctTwoDigitPrefixes:new Set(indices.map(value=>value.slice(0,2))).size,
  geometryFields:Object.keys(rows[0]??{}).filter(key=>/geometry|polygon|locations|boundary|geojson|wkt/i.test(key)).length
 };
 if(result.rows!==1593||result.uniqueSixDigitIndices!==1593||result.duplicateIndices!==0||result.validOfficeCoordinateRows!==1591||result.invalidOfficeCoordinateRows!==2||result.geometryFields!==0)fail('office-list-profile');
 return result;
}

export function profileUzbekistanDetail(bytes,reference){
 bind(bytes,reference);
 const result=JSON.parse(bytes).result;
 const ring=result?.locations?.locations;
 if(result?.postal_office?.index!=='100000'||!Array.isArray(ring)||ring.length<4||!ring.every(finiteCoordinate))fail('detail-shape');
 const closed=ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1];
 let twiceArea=0;
 for(let i=0;i<ring.length-1;i++)twiceArea+=ring[i][1]*ring[i+1][0]-ring[i+1][1]*ring[i][0];
 let intersections=0;
 for(let i=0;i<ring.length-1;i++)for(let j=i+1;j<ring.length-1;j++){
  if(Math.abs(i-j)<=1||(i===0&&j===ring.length-2))continue;
  if(intersects(ring[i],ring[i+1],ring[j],ring[j+1]))intersections++;
 }
 const lats=ring.map(point=>point[0]),lons=ring.map(point=>point[1]);
 const style=result.locations;
 const profile={
  postcode:result.postal_office.index,
  ringVertices:ring.length,
  ringClosed:closed,
  selfIntersectionPairs:intersections,
  nonZeroSignedArea:Math.abs(twiceArea)>0,
  boundsLatLon:[Math.min(...lats),Math.min(...lons),Math.max(...lats),Math.max(...lons)],
  serverStyle:{fill:style.fill,fillOpacity:Number(style.fill_opacity),stroke:style.stroke,strokeWidth:Number(style.stroke_width),strokeOpacity:Number(style.stroke_opacity)}
 };
 if(profile.ringVertices!==98||!profile.ringClosed||profile.selfIntersectionPairs!==0||!profile.nonZeroSignedArea||JSON.stringify(profile.boundsLatLon)!==JSON.stringify([41.305219,69.269033,41.327734,69.310162]))fail('detail-profile');
 return profile;
}

export function profileUzbekistanMapView(bytes,reference){
 bind(bytes,reference);
 const text=bytes.toString('utf8');
 const profile={
  officeListEndpoint:/maps\/new\/post\/offices\//.test(text),
  detailEndpoint:/maps\/new\/post\/offices\/detail\/\$\{e\}\//.test(text),
  addressEndpoint:/maps\/new\/post\/offices\/by-address\//.test(text),
  yandexPolygon:/new window\.ymaps\.Polygon/.test(text),
  serverFillOpacity:/fillOpacity/.test(text),
  serverStrokeOpacity:/strokeOpacity/.test(text),
  fitBounds:/setBounds/.test(text)
 };
 if(Object.values(profile).some(value=>!value))fail('mapview-profile');
 return profile;
}

export function profileUzbekistanPublicOffer(bytes,reference){
 bind(bytes,reference);
 const item=JSON.parse(bytes).find(value=>value.id===5);
 if(!item||!/Политика конфиденциальности/.test(item.title_ru)||!/Публичная оферта/.test(item.text_ru))fail('public-offer-shape');
 const text=[item.text_ru,item.text_uz].filter(Boolean).join(' ');
 const profile={
  recordId:item.id,
  displayedUnderPrivacyLabel:true,
  publicOffer:true,
  websiteAndMobileApp:/веб-сайта и мобильного приложения/i.test(text),
  acceptanceTerms:/акцепт|qabul/i.test(text),
  explicitBulkReuseLicence:/лиценз|bulk reuse|redistribut|копирован|авторск|интеллектуаль/i.test(text)
 };
 if(!profile.websiteAndMobileApp||!profile.acceptanceTerms||profile.explicitBulkReuseLicence)fail('public-offer-profile');
 return profile;
}

export function profileUzbekistanReference(bytes,reference){
 if(reference.kind==='office-list-json')return profileUzbekistanOfficeList(bytes,reference);
 if(reference.kind==='office-detail-json')return profileUzbekistanDetail(bytes,reference);
 if(reference.kind==='mapview-javascript')return profileUzbekistanMapView(bytes,reference);
 if(reference.kind==='public-offer-json')return profileUzbekistanPublicOffer(bytes,reference);
 bind(bytes,reference);
 if(reference.kind==='pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')fail(`${reference.id}-pdf-signature`);
 return {contentVerified:true};
}

export function validateUzbekistanAuditReport(report){
 if(report.countryCode!=='UZ'||report.criterionId!==config.m2_criterion.id)fail('report-identity');
 if(report.references.length!==config.references.length||new Set(report.references.map(item=>item.id)).size!==report.references.length)fail('reference-set');
 for(const reference of config.references){
  const receipt=report.references.find(item=>item.id===reference.id);
  if(!receipt||receipt.requestedUrl!==reference.url||receipt.httpStatus!==200||receipt.byteLength!==reference.reviewed_bytes||receipt.responseDigest!==reference.expected_digest||receipt.contentVerified!==true)fail('receipt-binding');
 }
 if(report.officeIndexProfile.rows!==1593||report.officeIndexProfile.uniqueSixDigitIndices!==1593||report.officeIndexProfile.invalidOfficeCoordinateRows!==2||report.officeIndexProfile.geometryFields!==0)fail('office-profile');
 if(report.detailSampleProfile.sampledDetailRecords!==1||report.detailSampleProfile.totalListedIndices!==1593||report.detailSampleProfile.nationalDetailCoverageValidated||report.detailSampleProfile.ringVertices!==98||!report.detailSampleProfile.ringClosed)fail('detail-profile');
 if(!report.operatorAppProfile.operatorSearchToAreaVisualizationVerified||!report.operatorAppProfile.translucentFillVerified||!report.operatorAppProfile.fitBoundsVerified)fail('operator-app-profile');
 if(report.rights.bulkReuseGrantVerified||report.rights.derivativePolygonGrantVerified||report.rights.redistributionGrantVerified||report.rights.persistentPublicApiServingGrantVerified||report.rights.accountsRegistrationsOrContractAcceptances!==0)fail('rights-overclaim');
 if(report.officialPostalGeometryRecordsValidatedForProduction!==0||report.derivedPostalGeometryRecords!==0||report.publishedImmutableDataArtifacts!==0||report.realUzbekistanAgidPostalApiVerified||report.realUzbekistanAgidAppAreaVisualizationVerified||report.countryM2Achieved)fail('m2-overclaim');
 if(report.coverageLimits.detailRequestsPerformed!==1||report.coverageLimits.bulkDetailHarvestPerformed||report.rawSourceBodiesInGit!==0||report.paidOperations!==0||report.newAccountsRepositoriesOrDestinations!==0)fail('operation-overclaim');
 return {references:report.references.length,officeIndices:1593,observedRings:1,productionGeometryRecords:0,countryM2Achieved:false};
}

export function auditUzbekistanSourceDirectory(sourceDirectory,report){
 const profiles={};
 for(const reference of config.references)profiles[reference.id]=profileUzbekistanReference(readFileSync(join(sourceDirectory,reference.audit_file)),reference);
 validateUzbekistanAuditReport(report);
 return profiles;
}

if(process.argv[1]&&new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).pathname.endsWith('/inspect-postal-context-uz-sources.mjs')){
 const report=JSON.parse(readFileSync(process.argv[3]??new URL('../reports/postal-context-m2/uz-source-review-2026-08-29.json',import.meta.url),'utf8'));
 const profiles=process.argv[2]?auditUzbekistanSourceDirectory(process.argv[2],report):null;
 console.log(JSON.stringify({report:validateUzbekistanAuditReport(report),sourceProfiles:profiles}));
}
