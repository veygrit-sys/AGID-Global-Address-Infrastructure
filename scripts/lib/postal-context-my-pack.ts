import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {sourceDigest} from './postal-context-source-probe.mjs';
import {MY_POSTCODE_URLS,readMalaysiaPostcodes,normalizeMalaysiaAssignments,profileMalaysiaPostcodes} from './postal-context-my-postcodes.mjs';
import {POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION, type PostalContextGraph, type PostalContextNode, type PostalContextAssertion, type PostalContextSource, type PostalContextDigest} from '../../src/lib/postalContextGraph';
import {POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION} from '../../src/lib/postalContextSpatial';
import {POSTAL_CONTEXT_PACK_LIMITS} from '../../src/lib/postalContextTopology';
import {POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION,computePostalContextGraphManifestDigest,loadPostalContextPack,type PostalContextPackDescriptor} from '../../src/server/postalContextPackStore';

const json=(v:unknown)=>Buffer.from(JSON.stringify(v)+'\n');
const digest=(v:Buffer):PostalContextDigest=>sourceDigest(v) as PostalContextDigest;
type Receipt={observedAt:string;edition:string;synthetic:boolean;csvDigest:string;catalogDigest:string;termsDigest:string};

/** Local observation experiment only. It never enables a production country. */
export function buildMalaysiaObservationPack(csv:Buffer,receipt:Receipt){
  const rows=readMalaysiaPostcodes(csv),assignments=normalizeMalaysiaAssignments(rows),quality=profileMalaysiaPostcodes(rows);
  const at=new Date(receipt.observedAt);
  if(!Number.isFinite(at.getTime())||at.toISOString()!==receipt.observedAt||at.getTime()>Date.now())throw Error('my-observation-time');
  if(receipt.edition!=='2026-06'||receipt.observedAt.slice(0,7)<receipt.edition||typeof receipt.synthetic!=='boolean')throw Error('my-receipt-edition');
  for(const v of [receipt.csvDigest,receipt.catalogDigest,receipt.termsDigest])if(!/^sha256:[a-f0-9]{64}$/.test(v))throw Error('my-receipt-digest');
  if(digest(csv)!==receipt.csvDigest)throw Error('my-csv-digest');
  if(!receipt.synthetic){
    const review=JSON.parse(readFileSync(new URL('../../data/postal_country_packs/my/postal-context/m2-source-review.json',import.meta.url),'utf8'));
    for(const [id,value] of [['malaysia-mcmc-postcodes-csv',receipt.csvDigest],['malaysia-mcmc-postcodes-catalog',receipt.catalogDigest],['cc-by-4-legal',receipt.termsDigest]])if(review.references.find((r:{id:string})=>r.id===id)?.reviewed_digest!==value)throw Error('my-unreviewed-source');
    if(review.csv_observed_at!==receipt.observedAt||review.dataset_license!=='CC-BY-4.0')throw Error('my-unreviewed-observation');
  }
  const releaseId=`my-mcmc-${receipt.edition}-${receipt.csvDigest.slice(7,19)}-${receipt.observedAt.replace(/\D/g,'')}`;
  const validTime={from:receipt.observedAt,to:new Date(at.getTime()+1).toISOString()},knownTime={from:receipt.observedAt,to:null};
  const licenseId=receipt.synthetic?'AGID-SYNTHETIC-ONLY':'CC-BY-4.0';
  const source:PostalContextSource={sourceId:receipt.synthetic?'my-synthetic-dictionary':'malaysia-mcmc-postcodes',sourceType:receipt.synthetic?'synthetic':'official',assignmentAuthority:receipt.synthetic?'synthetic_fixture_assignment':'official_postal_dictionary',geometryAuthority:'none',sourceVersion:receipt.edition,sourceDate:receipt.observedAt.slice(0,10),licenseId,digest:receipt.csvDigest as PostalContextDigest};
  const nodes=new Map<string,PostalContextNode>(),edges=new Set<string>(),assertions:PostalContextAssertion[]=[];
  const add=(id:string,kind:PostalContextNode['kind'],featureKind:PostalContextNode['featureKind'],label:string,postalCode?:string)=>{nodes.set(id,{id,kind,featureKind,label,geometryType:'none',countryCode:'MY',visibility:'public',...(postalCode?{postalCode}:{})});};
  const edge=(fromNodeId:string,toNodeId:string)=>{const k=JSON.stringify([fromNodeId,toNodeId]);if(edges.has(k))return;edges.add(k);assertions.push({id:`my-rel:${sourceDigest(k).slice(7)}`,fromNodeId,toNodeId,relation:'admin_within',validTime,knownTime,source,method:'source_relation',quality:{status:'verified',validatedAt:receipt.observedAt},purposes:['postal_lookup','display','validation']});};
  add('my:country','administrative_area','country','Malaysia');
  for(const a of assignments){const state=`my:state:${sourceDigest(a.state).slice(7)}`,city=`my:city:${sourceDigest(JSON.stringify([a.state,a.city])).slice(7)}`,postal=`my:postal:${a.postcode}`;
    add(state,'administrative_area','administrative',a.state);add(city,'locality','locality',a.city);add(postal,'postal_feature','unknown',a.postcode,a.postcode);edge(state,'my:country');edge(city,state);edge(postal,city);
  }
  if(nodes.size>POSTAL_CONTEXT_PACK_LIMITS.nodes||assertions.length>POSTAL_CONTEXT_PACK_LIMITS.assertions)throw Error('my-pack-budget');
  const geometry={schemaVersion:POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,countryCode:'MY',releaseId,features:[]},geometryBytes=json(geometry);
  const evidence={schemaVersion:'postal-context-my-observation/v1',countryCode:'MY',receipt,sourceUrls:MY_POSTCODE_URLS,quality,attribution:receipt.synthetic?'Synthetic test only.':'Malaysian Communications and Multimedia Commission, Postcode Dataset (2026-06), via data.gov.my. CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Supplied as-is, without warranties. No endorsement implied.',changes:['NFC and outer ASCII-space label normalization with raw values retained','exact normalized tuple coalescing with source row lineage','same postcode with distinct city/state remains ambiguous','observation-window label graph with no geometry or civic/building relations'],sourceEffectiveDates:null,snapshotOnly:true,validTime,sourceDateMeaning:'acquisition date, not per-row effective date',assignmentAuthority:'MCMC published dictionary, not direct live Pos Malaysia confirmation',dataPublicationApproved:false,countryM2Achieved:false};
  const evidenceBytes=json(evidence),assignmentBytes=Buffer.from(rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
  const graph:PostalContextGraph={schemaVersion:POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,release:{schemaVersion:POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,repositoryId:'agid-postal-my',countryCode:'MY',releaseId,policyVersion:'my-mcmc-observation-only-v1',releasedAt:receipt.observedAt,validTime,manifestDigest:`sha256:${'0'.repeat(64)}`,artifacts:[{path:'geometry.json',mediaType:'application/vnd.agid.postal-context-geometry+json',digest:digest(geometryBytes),byteLength:geometryBytes.length,recordCount:0,licenseRefs:[licenseId]},{path:'source-evidence.json',mediaType:'application/json',digest:digest(evidenceBytes),byteLength:evidenceBytes.length,licenseRefs:[licenseId]},{path:'assignments.jsonl',mediaType:'application/x-ndjson',digest:digest(assignmentBytes),byteLength:assignmentBytes.length,recordCount:rows.length,licenseRefs:[licenseId]}]},nodes:[...nodes.values()],assertions};
  graph.release.manifestDigest=computePostalContextGraphManifestDigest(graph.release) as PostalContextDigest;
  const graphBytes=json(graph);if(graphBytes.length>POSTAL_CONTEXT_PACK_LIMITS.graphBytes)throw Error('my-graph-budget');
  const descriptor:PostalContextPackDescriptor={schemaVersion:POSTAL_CONTEXT_PACK_DESCRIPTOR_SCHEMA_VERSION,repositoryId:'agid-postal-my',countryCode:'MY',releaseId,policyVersion:graph.release.policyVersion,sequence:1,previousDescriptorDigest:null,graphManifestDigest:graph.release.manifestDigest,createdAt:receipt.observedAt,maturity:'M2_experimental',synthetic:receipt.synthetic,promotionEligible:false,containsResidentialAddressPoints:false,artifacts:[{role:'graph',path:'graph.json',mediaType:'application/vnd.agid.postal-context-graph+json',schemaVersion:POSTAL_CONTEXT_GRAPH_SCHEMA_VERSION,byteLength:graphBytes.length,digest:digest(graphBytes),recordCounts:{nodes:nodes.size,assertions:assertions.length}},{role:'geometry',path:'geometry.json',mediaType:'application/vnd.agid.postal-context-geometry+json',schemaVersion:POSTAL_CONTEXT_GEOMETRY_SCHEMA_VERSION,byteLength:geometryBytes.length,digest:digest(geometryBytes),recordCounts:{features:0,positions:0}}]};
  const descriptorBytes=json(descriptor);
  return {graph,descriptor,evidence,descriptorDigest:digest(descriptorBytes),files:new Map([['descriptor.json',descriptorBytes],['graph.json',graphBytes],['geometry.json',geometryBytes],['source-evidence.json',evidenceBytes],['assignments.jsonl',assignmentBytes]])};
}

export function materializeMalaysiaObservationPack(directory:string,built:ReturnType<typeof buildMalaysiaObservationPack>){
  mkdirSync(directory); // No overwrite of an existing output directory.
  for(const [name,bytes] of built.files)writeFileSync(join(directory,name),bytes,{flag:'wx'});
  return loadPostalContextPack(join(directory,'descriptor.json'),built.descriptorDigest,{expectedCountryCode:'MY',allowExperimental:true,allowSynthetic:built.descriptor.synthetic});
}
