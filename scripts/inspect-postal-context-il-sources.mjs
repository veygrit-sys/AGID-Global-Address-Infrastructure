import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchBoundedOfficialResponse,probeOfficialReference,sourceDigest} from './lib/postal-context-source-probe.mjs';
const P=JSON.parse(readFileSync(new URL('../data/postal_country_packs/il/postal-context/m2-source-review.json',import.meta.url)));
const S=P.street_probe,HOSTS=new Set(['data.gov.il','israelpost.co.il','www.israelpost.co.il','www.upu.int']);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,expected)=>object(v)&&JSON.stringify(Object.keys(v).sort())===JSON.stringify([...expected].sort());
function json(bytes){
  if(!bytes.length||bytes.length>P.limits.max_response_bytes)throw new Error('il-byte-limit');
  let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new Error('il-invalid-json-or-utf8');}
  if(!object(value)||value.success!==true||!object(value.result))throw new Error('il-api-unsuccessful');
  return value.result;
}
const code=v=>typeof v==='number'?(Number.isSafeInteger(v)&&v>0?String(v):null):typeof v==='string'&&/^\d{1,10}$/.test(v)&&/[1-9]/.test(v)?v:null;
const name=v=>typeof v==='string'&&v.length<=P.limits.max_name_characters&&!/[\u0000-\u001f\u007f<>]/.test(v)?v.normalize('NFC').trim().replace(/\s+/g,' '):null;
const bump=(map,key)=>map.set(key,(map.get(key)??0)+1);
const sets=(map,key,value)=>{if(!map.has(key))map.set(key,new Set());map.get(key).add(value);};
const excess=map=>[...map.values()].reduce((n,c)=>n+Math.max(0,c-1),0);
const timestamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(v)&&Number.isFinite(Date.parse(v+'Z'));

export function profileIlStreetMetadata(bytes){
  const d=json(bytes);
  if(d.id!==S.dataset_id||d.name!==S.dataset_name||d.organization?.name!==S.organization_name||!Array.isArray(d.resources)
    ||d.num_resources!==d.resources.length||typeof d.license_id!=='string'||typeof d.license_title!=='string'||!timestamp(d.metadata_modified))throw new Error('il-package-identity-or-fields');
  const resources=d.resources.filter(r=>r.id===S.resource_id);if(resources.length!==1)throw new Error('il-resource-identity');
  const r=resources[0];
  if(r.format!=='CSV'||r.datastore_active!==true||!timestamp(r.last_modified)||typeof r.url!=='string'||typeof r.hash!=='string')throw new Error('il-resource-metadata');
  const url=new URL(r.url),prefix=`/dataset/${S.dataset_id}/resource/${S.resource_id}/download/`;
  if(url.protocol!=='https:'||url.hostname!=='aws-e.data.gov.il'||url.username||url.password||url.port||!url.pathname.startsWith(prefix)||!url.pathname.endsWith('.csv')||url.search||url.hash)throw new Error('il-resource-url');
  const snapshot={datasetId:d.id,datasetName:d.name,organizationName:d.organization.name,resourceId:r.id,
    packageModified:d.metadata_modified,resourceModified:r.last_modified,downloadUrl:r.url,
    declaredLicenseId:d.license_id,declaredLicenseTitle:d.license_title,declaredResourceHash:r.hash};
  if([snapshot.declaredLicenseId,snapshot.declaredLicenseTitle,snapshot.declaredResourceHash].some(v=>v.length>256||/[\u0000-\u001f<>]/.test(v)))throw new Error('il-license-metadata');
  return {...snapshot,declaredResourceCount:d.num_resources,metadataTimezone:'not-stated',snapshotMetadataDigest:sourceDigest(Buffer.from(JSON.stringify(snapshot))),
    downloadFetched:false,currentTermsPinned:false,productionRedistributionCleared:false,postalAssignmentAuthority:false,
    assignmentValidity:null,sourceDataRecords:0};
}

export function profileIlStreetPage(bytes,offset){
  if(!S.offsets.includes(offset))throw new Error('il-offset-not-reviewed');
  const d=json(bytes),expectedFields=S.fields.map(f=>f.id);
  if(d.resource_id!==S.resource_id||d.limit!==S.limit||d.records_format!=='objects'||d.include_total!==true||d.total_was_estimated!==false
    ||!Number.isSafeInteger(d.total)||d.total<0||!Array.isArray(d.fields)||!Array.isArray(d.records))throw new Error('il-page-envelope');
  if(JSON.stringify(d.fields.map(f=>({id:f.id,type:f.type})))!==JSON.stringify(S.fields))throw new Error('il-street-schema');
  const n=d.records.length;
  if(!n||n>P.limits.max_rows_per_response||n!==Math.min(S.limit,d.total-offset))throw new Error('il-page-count');
  const ids=new Map(),pairs=new Map(),localities=new Set(),streetLocalities=new Map(),localityNames=new Map(),pairNames=new Map(),tuples=[];
  let missingNames=0,invalidCodes=0,invalidNames=0,numericTransportFields=0,stringTransportFields=0,code9000Rows=0,sameLocalityAndStreetLabelRows=0;
  let previousId=-1,strictlyIncreasingRowIds=true;
  for(const row of d.records){
    if(!keys(row,expectedFields)||!Number.isSafeInteger(row._id)||row._id<=0)throw new Error('il-row-shape');
    const locality=code(row['סמל_ישוב']),street=code(row['סמל_רחוב']),localityName=name(row['שם_ישוב']),streetName=name(row['שם_רחוב']);
    if(!locality||!street)invalidCodes++;
    if(localityName===null||streetName===null)invalidNames++;
    if(!localityName||!streetName)missingNames++;
    for(const key of ['סמל_ישוב','סמל_רחוב']){if(typeof row[key]==='number')numericTransportFields++;else if(typeof row[key]==='string')stringTransportFields++;}
    if(row._id<=previousId)strictlyIncreasingRowIds=false;previousId=row._id;bump(ids,row._id);
    if(street==='9000')code9000Rows++;
    if(localityName&&streetName&&localityName===streetName)sameLocalityAndStreetLabelRows++;
    if(locality&&street){const pair=JSON.stringify([locality,street]);bump(pairs,pair);localities.add(locality);sets(streetLocalities,street,locality);
      sets(localityNames,locality,localityName);sets(pairNames,pair,streetName);}
    tuples.push(JSON.stringify([locality,street,localityName,streetName]));
  }
  const duplicates=excess(ids),duplicatePairs=excess(pairs);
  return {offset,observedRows:n,reportedTotal:d.total,reportedTotalIsPostalCoverage:false,distinctLocalityCodes:localities.size,
    distinctStreetCodes:streetLocalities.size,streetCodesSharedAcrossLocalities:[...streetLocalities.values()].filter(v=>v.size>1).length,
    excessDuplicateRowIds:duplicates,duplicateRowIdRate:duplicates/n,excessDuplicateCompositeKeys:duplicatePairs,duplicateCompositeKeyRate:duplicatePairs/n,
    missingNameRows:missingNames,missingNameRate:missingNames/n,invalidCodeRows:invalidCodes,invalidCodeRate:invalidCodes/n,invalidNameRows:invalidNames,
    numericTransportCodeFields:numericTransportFields,stringTransportCodeFields:stringTransportFields,code9000Rows,sameLocalityAndStreetLabelRows,
    localityCodesWithMultipleLabels:[...localityNames.values()].filter(v=>v.size>1).length,compositeKeysWithMultipleStreetLabels:[...pairNames.values()].filter(v=>v.size>1).length,
    strictlyIncreasingRowIds,firstRowId:d.records[0]._id,lastRowId:d.records.at(-1)._id,
    normalizedTupleMultisetDigest:sourceDigest(Buffer.from(JSON.stringify(tuples.sort()))),
    observedShapeValid:invalidCodes+invalidNames+missingNames+duplicates===0&&strictlyIncreasingRowIds,
    stableCivicIdentityVerified:false,geometryType:'none',postalAssignments:0,civicAddressRelations:0,exactBuildingRelations:0,coordinates:0,agidRelations:0,
    sourceRowsPersisted:0,fullSnapshotVerified:false,assignmentValidity:null};
}

const safeError=e=>/^il-[a-z-]+$/.test(e.message)?e.message:'network-or-parser-error';
const receipt=(metadata,bytes)=>({...metadata,observedAt:new Date().toISOString(),byteLength:bytes?.length??0,responseDigest:bytes?sourceDigest(bytes):null});
async function api(url,profile,fetcher){
  const r=await fetchBoundedOfficialResponse(url,{allowedHosts:HOSTS,fetcher,maxBytes:P.limits.max_response_bytes});
  const record=receipt(r.metadata,r.bytes);
  if(!r.bytes)return {...record,status:'http-error'};
  if((r.metadata.contentType??'').split(';')[0]!=='application/json')return {...record,status:'unexpected-mime'};
  try{return {...record,status:'profiled-not-postal-assignment',profile:profile(r.bytes)};}
  catch(e){return {...record,status:'parser-error',error:safeError(e)};}
}

export async function inspectIlSources(fetcher=fetch){
  if(S.limit!==50||S.offsets.length>P.limits.max_data_requests||JSON.stringify(S.offsets)!=='[0,50,0]')throw new Error('il-request-budget');
  const report={schemaVersion:'postal-context-il-source-review/v1',countryCode:'IL',observedAt:new Date().toISOString(),references:[],streetMetadata:[],streetPages:[],
    postalLookupRequests:0,bulkDownloadRequests:0,sourceRowsPersisted:0,sourceSnapshotsRetained:0,paidOperations:0,userAuthenticationPerformed:false,
    contractAcceptancePerformed:false,publishedDataArtifacts:0,realAgidRuntimeVerified:false,countryM2Achieved:false};
  for(const ref of P.reference_probes){try{report.references.push({...await probeOfficialReference(ref,HOSTS,fetcher),observedAt:new Date().toISOString()});}
    catch(e){report.references.push({id:ref.id,requestedUrl:ref.url,status:'fetch-error',contentVerified:false,error:safeError(e),observedAt:new Date().toISOString()});}}
  try{
    const first=await api(S.metadata_url,profileIlStreetMetadata,fetcher);report.streetMetadata.push(first);
    if(first.profile){
      for(const offset of S.offsets){const u=new URL(S.query_url);u.search=new URLSearchParams({resource_id:S.resource_id,limit:String(S.limit),offset:String(offset),sort:S.sort}).toString();
        const result=await api(u.href,b=>profileIlStreetPage(b,offset),fetcher);report.streetPages.push(result);if(!result.profile)break;}
      report.streetMetadata.push(await api(S.metadata_url,profileIlStreetMetadata,fetcher));
    }
  }catch(e){report.inspectionError=safeError(e);}
  const [first,second,repeat]=report.streetPages;
  report.sampleConsistency={initialPageCount:report.streetPages.slice(0,2).filter(p=>p.profile).length,
    initialRowObservations:[first,second].reduce((n,p)=>n+(p?.profile?.observedRows??0),0),
    pageRowIdRangesDisjoint:!!(first?.profile&&second?.profile)&&first.profile.lastRowId<second.profile.firstRowId,
    reportedTotalsAgree:report.streetPages.length===3&&report.streetPages.every(p=>p.profile?.reportedTotal===first?.profile?.reportedTotal),
    byteIdenticalRepeat:!!(first?.profile&&repeat?.profile)&&first.responseDigest===repeat.responseDigest,
    tupleMultisetIdenticalRepeat:!!(first?.profile&&repeat?.profile)&&first.profile.normalizedTupleMultisetDigest===repeat.profile.normalizedTupleMultisetDigest,
    metadataProjectionStable:report.streetMetadata.length===2&&report.streetMetadata.every(p=>p.profile)&&report.streetMetadata[0].profile.snapshotMetadataDigest===report.streetMetadata[1].profile.snapshotMetadataDigest,
    atomicSnapshotVerified:false,nationalPostalCoverageVerified:false};
  report.completedAt=new Date().toISOString();return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--report')throw new Error('usage: node scripts/inspect-postal-context-il-sources.mjs --report new.json');
  const output=resolve(args[1]);if(existsSync(output))throw new Error('report-already-exists');
  const report=await inspectIlSources();mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({country:'IL',references:report.references.map(r=>({id:r.id,status:r.status,httpStatus:r.httpStatus})),pages:report.streetPages.map(r=>r.profile??r.status),sample:report.sampleConsistency,countryM2Achieved:false}));
}
