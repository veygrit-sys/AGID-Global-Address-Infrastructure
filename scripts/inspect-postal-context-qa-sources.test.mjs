import assert from 'node:assert/strict';
import {test} from 'node:test';
import {config,odsPage,profileCatalog,profileLocator,profileReference,profileStreetStatistics,inspectQatarObservations} from './inspect-postal-context-qa-sources.mjs';

const stats=a=>({features:[{attributes:{FEATURE_COUNT:10,ZONE_NONNULL:10,STREET_NONNULL:8,DATE_NONNULL:1,MIN_UPDATE:0,MAX_UPDATE:0,...a}}]});
test('QA road statistics preserve grain, actual missingness and unknown whole-dataset freshness',()=>{
 const p=profileStreetStatistics(stats());assert.equal(p.streetMissingness.missing,2);assert.equal(p.streetMissingness.rate,.2);
 assert.equal(p.dateMissingness.missing,9);assert.equal(p.dateRangeDoesNotEstablishWholeDatasetFreshness,true);
 assert.equal(p.duplicatesOrTopologyValidated,false);assert.equal(p.individualRecordsRetrieved,0);
 assert.equal(profileStreetStatistics(stats({DATE_NONNULL:0,MIN_UPDATE:null,MAX_UPDATE:null})).nonNullUpdateDateRange,null);
});
test('QA aggregate parser rejects rows, invalid counts, false dates and truncated results',()=>{
 for(const data of [{error:{code:500}}, {...stats(),exceededTransferLimit:true}, {features:[...stats().features,...stats().features]}, {features:[{...stats().features[0],geometry:{x:1,y:1}}]}, stats({STREET_NONNULL:11}),stats({DATE_NONNULL:0}),stats({MIN_UPDATE:1,MAX_UPDATE:0}),stats({FEATURE_COUNT:0}),stats({OWNER:'never allowed'})])assert.throws(()=>profileStreetStatistics(data),/qa-statistics/);
});
test('QA embedded rights page is parsed as data, not executed or discarded as an empty shell',()=>{
 const html='<p>CC BY 4.0 &amp; attribution</p>',block={html:html.replaceAll('<','&lt;').replaceAll('>','&gt;')};
 const page='$scope.blocks = '+JSON.stringify(block)+';';assert.equal(odsPage(page),'<p>CC BY 4.0 & attribution</p>');
 assert.throws(()=>odsPage(page+page),/qa-page-block/);assert.throws(()=>odsPage('$scope.blocks = runCode();'),/qa-page-block/);
});
test('QA catalog records retain positive licences without promoting aggregate polygons',()=>{
 const p=profileCatalog({total_count:21,results:[{dataset_id:'synthetic-census',metas:{default:{title:'Synthetic municipal census',records_count:8,license:'CC BY',license_url:'https://creativecommons.org/licenses/by/4.0/',geometry_types:['Polygon']}},fields:[{name:'municipality'},{name:'geo_shape'}]}]});
 assert.equal(p.returned,1);assert.equal(p.totalMatches,21);assert.equal(p.searchIsExhaustiveNationalInventory,false);
 assert.equal(p.datasets[0].dataRowsRetrieved,0);assert.equal(p.catalogTimestampsAreNotAddressValidity,true);
 assert.equal(p.datasets[0].licenseUrl,'https://creativecommons.org/licenses/by/4.0/');
 assert.throws(()=>profileCatalog({total_count:1,results:[{dataset_id:'x'},{dataset_id:'x'}]}),/qa-catalog-ids/);
});
test('QA generic geocoder Postal and building fields do not prove assignments or accuracy',()=>{
 const p=profileLocator({capabilities:'Geocode',addressFields:[{name:'Postal'}],candidateFields:[{name:'Postal'},{name:'ZONE_NO'},{name:'STREET_NO'},{name:'BUILDING_NO'}]});
 assert.equal(p.hasGenericPostalField,true);assert.equal(p.candidateFieldIsAssignment,false);assert.equal(p.matchScoreIsCalibratedAccuracy,false);
 assert.equal(p.artifactRightsVerified,false);assert.equal(p.addressQueriesMade,0);assert.equal(p.currentDataEdition,null);
 assert.deepEqual(p.explicitCandidateIdentifierFields,['ZONE_NO','STREET_NO','BUILDING_NO']);
});
test('QA exact bytes bind manual PDF and official-page review; changed content is never reused',()=>{
 for(const ref of config.references.filter(r=>r.expected_digest))assert.throws(()=>profileReference(Buffer.from('changed'),ref),/qa-content-drift/);
 assert.throws(()=>inspectQatarObservations([]),/qa-observation-set/);
 const o=config.references.map(r=>({id:r.id,requestedUrl:'https://invalid.example/',observedAt:r.reviewed_observed_at}));
 assert.throws(()=>inspectQatarObservations(o),/qa-observation-binding/);
});
