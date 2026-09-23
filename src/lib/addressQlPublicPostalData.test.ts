import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAddressQlPublicPostalArtifacts,
  extractGeoNamesJapanPostalCodes,
  extractJapanPostPostalCodes,
  type AddressQlPublicPostalSource,
} from './addressQlPublicPostalData';

const digest = (character: string) => `sha256:${character.repeat(64)}`;

const officialSource: AddressQlPublicPostalSource = {
  id: 'japan-post-utf-csv',
  role: 'official-primary',
  authority: 'Japan Post Co., Ltd.',
  sourceVersion: '2026-06-30',
  archiveUrl:
    'https://www.post.japanpost.jp/service/search/zipcode/download/utf/zip/utf_ken_all.zip',
  releaseUrl:
    'https://www.post.japanpost.jp/service/search/zipcode/download/utf-zip.html',
  termsUrl:
    'https://www.post.japanpost.jp/service/search/zipcode/download/readme.html',
  correctionUrl: 'https://www.post.japanpost.jp/question/faq/',
  reuseRights: 'Japan Post asserts no copyright and permits redistribution.',
  coverageStatement: 'Ordinary-address postal codes; no delivery-point claim.',
  attribution: 'Japan Post Co., Ltd.',
};

const ossSource: AddressQlPublicPostalSource = {
  id: 'geonames-postal-jp',
  role: 'oss-cross-check',
  authority: 'GeoNames',
  sourceVersion: '2026-07-26',
  archiveUrl: 'https://download.geonames.org/export/zip/JP.zip',
  releaseUrl: 'https://download.geonames.org/export/zip/',
  termsUrl: 'https://download.geonames.org/export/zip/readme.txt',
  correctionUrl: 'https://forum.geonames.org/gforum/forums/show/7.page',
  reuseRights: 'CC BY 4.0 with GeoNames attribution.',
  coverageStatement: 'Community postal/locality cross-check; partial.',
  attribution: 'GeoNames (https://www.geonames.org/)',
};

test('public source parsers retain only canonical JP postcodes', () => {
  const csv = [
    '"00000","000","1000001","トウキョウト","チヨダク","チヨダ"',
    '"00000","000","1000002","トウキョウト","チヨダク","チヨダ"',
  ].join('\r\n');
  const tsv = [
    'JP\t100-0001\tSynthetic place\tSynthetic admin\t00\t\t\t\t\t0\t0\t1',
    'JP\t1000002\tSynthetic place\tSynthetic admin\t00\t\t\t\t\t0\t0\t1',
  ].join('\n');

  assert.deepEqual(extractJapanPostPostalCodes(csv), ['1000001', '1000002']);
  assert.deepEqual(extractGeoNamesJapanPostalCodes(tsv), ['1000001', '1000002']);
});

test('public postal artifacts remain conformance-only without an independent key', () => {
  const artifacts = buildAddressQlPublicPostalArtifacts({
    retrievedAt: '2026-07-26T00:00:00Z',
    validUntil: '2027-01-26T00:00:00Z',
    japanPostSource: officialSource,
    japanPostArchiveDigest: digest('a'),
    japanPostCsv:
      '"00000","000","1000001","トウキョウト","チヨダク","チヨダ"\n',
    geoNamesSource: ossSource,
    geoNamesArchiveDigest: digest('b'),
    geoNamesTsv:
      'JP\t100-0001\tSynthetic place\tSynthetic admin\t00\t\t\t\t\t0\t0\t1\n',
  });

  assert.equal(artifacts.runtimeConfig.adapters.length, 2);
  assert.ok(artifacts.runtimeConfig.adapters.every(item => item.mode === 'conformance'));
  assert.deepEqual(artifacts.trustStore.keys, {});
  assert.equal(
    (artifacts.sourceLedger.trust as Record<string, unknown>).approvedActivation,
    'blocked',
  );
  assert.doesNotMatch(JSON.stringify(artifacts.qualityReport), /1000001/);
});

test('public source parsers reject wrong-country and malformed rows', () => {
  assert.throws(
    () => extractGeoNamesJapanPostalCodes('US\t10001\tSynthetic\n'),
    /not a JP postal row/,
  );
  assert.throws(
    () => extractJapanPostPostalCodes('"00000","000","not-postal"\n'),
    /invalid postcode/,
  );
});
