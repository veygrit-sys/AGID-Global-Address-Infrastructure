import assert from 'node:assert/strict';
import { test } from 'node:test';

import { OPEN_SOURCE_FEATURE_AREAS } from './openCoreProductStrategy';
import {
  getOpenSourceDonationReadiness,
  validateOpenSourceDonationReadiness,
} from './openSourceDonationReadiness';

test('covers every open-source feature area with a donation readiness score', () => {
  const assessment = getOpenSourceDonationReadiness();
  const expected = OPEN_SOURCE_FEATURE_AREAS.map(area => area.id).sort();
  const actual = assessment.areaReadiness.map(area => area.areaId).sort();

  assert.deepEqual(actual, expected);
  assert.equal(assessment.overallGrade, 'small-grant-ready');
  assert.ok(assessment.overallScore >= 65);
  assert.ok(assessment.overallScore <= 80);
});

test('checks multiple professional perspectives', () => {
  const roles = getOpenSourceDonationReadiness().professionalReviews.map(review => review.role);

  assert.ok(roles.includes('Open-source maintainer'));
  assert.ok(roles.includes('Security engineer'));
  assert.ok(roles.includes('Privacy lawyer / DPO'));
  assert.ok(roles.includes('Humanitarian program officer'));
  assert.ok(roles.includes('Logistics / POS operator'));
  assert.ok(roles.includes('Grant program officer'));
  assert.ok(roles.length >= 10);
});

test('lists realistic funders without treating recognition as direct money', () => {
  const opportunities = getOpenSourceDonationReadiness().fundingOpportunities;
  const byOrganization = new Map(opportunities.map(item => [item.organization, item]));

  assert.equal(byOrganization.get('NLnet Foundation')?.fit, 'high');
  assert.match(byOrganization.get('NLnet Foundation')?.realisticAsk ?? '', /EUR 25,000-50,000/);
  assert.match(byOrganization.get('Open Technology Fund')?.bestOpenSourcePackage ?? '', /AGID-S/);
  assert.match(byOrganization.get('Web3 Foundation')?.officialRange ?? '', /Level 1 up to USD 10,000/);
  assert.match(byOrganization.get('UNICEF Venture Fund')?.officialRange ?? '', /USD 100,000/);
  assert.match(byOrganization.get('Digital Public Goods Alliance')?.realisticAsk ?? '', /USD 0 direct/);
});

test('does not bend the philosophy for fundraising', () => {
  const assessment = getOpenSourceDonationReadiness();
  const principles = assessment.principlesNotToBend.join(' ');
  const doNotDo = assessment.areaReadiness.flatMap(area => area.doNotDo).join(' ');

  assert.match(principles, /Mode 0 Local Only/);
  assert.match(principles, /Do not require ZK, Ethereum, hosted registry, or paid services/);
  assert.match(principles, /Do not reposition AGID\/AOID as a token-first crypto project/);
  assert.match(doNotDo, /Do not make a hosted registry mandatory/);
});

test('validates the donation readiness assessment', () => {
  const validation = validateOpenSourceDonationReadiness();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});
