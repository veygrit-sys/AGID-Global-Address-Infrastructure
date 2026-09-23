import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const manifest=JSON.parse(read('data/postal_country_packs/bn/postal-context/repository-manifest.json'));
const profile=JSON.parse(read('data/postal_country_packs/bn/postal-context/m2-source-review.json'));
const reportPath='reports/postal-context-m2/bn-source-review-2026-08-28.json';

test('BN formalizes the missing source-attested national M2 without promoting metadata or requiring fabricated geometry',()=>{
 assert.equal(manifest.repository.maturity,'M1_metadata');assert.equal(manifest.promotion.current_stage,'M1_metadata');
 assert.equal(manifest.promotion.target_stage,'M2_source_attested');assert.deepEqual(manifest.promotion.stages,[profile.m2_definition]);
 assert.equal(manifest.promotion.m2_review.previous_definition,null);assert.equal(manifest.promotion.m2_review.existing_target_preserved,true);
 assert.match(profile.m2_definition.definition,/current national.*all four districts.*immutable artifacts.*real AGID/);
 for(const key of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[key],false);
 assert.equal(profile.definition_review.geometry_not_required_for_assignment_m2,true);
});

test('BN current operator, historical booklet, government mirror and legal references cannot validate addresses by identity alone',()=>{
 const sources=getOfficialPostalSourcesForCountry('BN'),preferred=getPreferredPostalSourceIdsForCountry('BN');
 for(const id of ['brunei-post-postcode-booklet','upu-brunei-addressing','brunei-survey-house-numbering','brunei-survey-digital-map-products','brunei-survey-geoportal','brunei-survey-geoportal-user-guide','brunei-deps-bpp-2021','brunei-land-registration-framework','brunei-posbru-current-operator','brunei-aiti-postal-licence','brunei-mtic-posbru-transition','brunei-skn-postcode-booklet','brunei-deps-terms']){
  const source=sources.find(s=>s.id===id);assert.ok(source);assert.ok(source.sourceRole==='context-only'||source.sourceRole==='legal-framework-only');assert.ok(!preferred.includes(id));
  for(const identity of [{sourceIds:[id]},{url:source.url},{source:source.label}])assert.equal(classifyPostalSourceTrust({countryCode:'BN',...identity}).strength,'weak',id);
 }
 assert.equal(sources.find(s=>s.id==='brunei-posbru-current-operator')?.authority,'postal-operator');
 assert.equal(sources.find(s=>s.id==='brunei-skn-postcode-booklet')?.authority,'government');
});

test('BN pinned historical booklet retains mixed grain, heading discrepancy and serial gap without inventing data',()=>{
 const r=JSON.parse(read(reportPath)),v=r.bookletObservation.validation,q=r.bookletObservation.quality;
 assert.equal(r.countryM2Achieved,false);assert.equal(r.realAgidRuntimeVerified,false);assert.equal(r.rightsForPublicM2ArtifactCleared,false);
 assert.equal(v.sourceDigest,profile.booklet_probe.expected_digest);assert.equal(v.pdfPages,52);assert.equal(v.extractedTables,54);assert.equal(q.rowsObserved,551);
 assert.equal(v.groups.locality.rows,438);assert.equal(v.groups.locality.distinctPostcodes,438);assert.equal(v.groups.locality.distinctNormalizedNames,427);
 assert.equal(v.groups['government-organization'].rows,94);assert.equal(v.groups['government-organization'].distinctPostcodes,31);assert.equal(v.groups['government-organization'].rowsInRepeatedPostcodeGroups,72);
 assert.equal(v.groups['postal-branch'].rows,19);assert.equal(v.groups['postal-branch'].serialSequenceMismatches,1);assert.equal(v.allKindsDistinctPostcodes,485);
 assert.deepEqual(q.headingComparisons.map((c:{difference:number})=>c.difference),[-2,2,3,3]);assert.equal(q.headingCountsReconciled,false);
 assert.equal(v.currentNationalCoverageEstablished,false);assert.equal(v.geometryType,'none');assert.equal(v.rowsExported,0);assert.equal(v.exactCivicOrBuildingRelations,0);
 assert.match(v.pdfCreationDate,/20181226/);assert.match(r.bookletObservation.lastModified,/2026/);assert.equal(v.currentAssignmentEdition,null);
 for(const g of Object.values(v.groups) as Array<Record<string,number>>)for(const key of ['missingNameRows','missingPostcodeRows','invalidPostcodeRows','duplicateNameCodeRows'])assert.equal(g[key],0);
});

test('BN authority changes and positive DEPS reuse terms do not clear unrelated postal rights or private records',()=>{
 assert.match(profile.rights_review.deps_positive_basis,/permits reuse.*attribution.*change notice.*no endorsement.*does not license SKN/);
 for(const k of ['persist_source_rows','allow_authentication','allow_private_queries'])assert.equal(profile.booklet_probe[k],false);
 assert.equal(profile.rights_review.source_rights_for_m2_cleared,false);assert.equal(profile.rights_review.public_destination_approved,false);
 const r=JSON.parse(read(reportPath));
 for(const id of ['brunei-posbru-current-operator','brunei-aiti-postal-licence','brunei-mtic-posbru-transition','brunei-skn-postcode-guide','brunei-deps-terms'])assert.equal(r.references.find((x:{id:string})=>x.id===id).contentVerified,true,id);
 for(const k of ['tlsVerificationDisabled','authenticationPerformed','privateQueriesPerformed','contractClickThroughPerformed'])assert.equal(r[k],false);
 assert.equal(r.sourceSnapshotsRetainedForPublication,0);assert.equal(r.publishedDataArtifacts,0);
 assert.ok(!read(reportPath).includes('"coordinates":'));
});

test('BN ledger pins report bytes, keeps M2 unachieved and defers read-only review until after pending countries',()=>{
 const ledger=JSON.parse(read('docs/postal-context-m2-rollout.json')),bn=ledger.countries.find((c:{countryCode:string})=>c.countryCode==='BN');
 assert.equal(bn.status,'blocked');assert.equal(bn.evidence,null);assert.deepEqual(bn.m2Definition,profile.m2_definition);assert.equal(bn.lastAttempt.report,reportPath);
 assert.equal(bn.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));
 assert.equal(bn.blocker.requiresExplicitApproval,false);assert.equal(Date.parse(bn.blocker.retryAfter)-Date.parse(bn.blocker.observedAt),7*86400000);
});
