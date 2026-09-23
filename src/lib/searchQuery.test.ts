import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
evaluateSearchCapability,
expandSearchQuery,
normalizeSearchText,
rankSearchCandidates,
scoreSearchCandidate,
} from './searchQuery';

test('expands multilingual place queries into English and native search candidates', () => {
  assert.deepEqual(expandSearchQuery('東京都').slice(0, 2), ['東京都', 'Tokyo']);
  assert.ok(expandSearchQuery('Ciudad de México').includes('Mexico City'));
  assert.ok(expandSearchQuery('Bogotá').includes('Bogota'));
  assert.ok(expandSearchQuery('São Paulo').includes('Sao Paulo'));
  assert.ok(expandSearchQuery('কলকাতা').includes('Kolkata'));
  assert.ok(expandSearchQuery('eGoli').includes('Johannesburg'));
  assert.ok(expandSearchQuery('iKapa').includes('Cape Town'));
});

test('adds typo-tolerant candidate queries for common global place names', () => {
  assert.ok(expandSearchQuery('Tokio').includes('Tokyo'));
  assert.ok(expandSearchQuery('Mexcio City').includes('Mexico City'));
  assert.ok(expandSearchQuery('sngapore airprot').includes('singapore airport'));
  assert.ok(expandSearchQuery('tokyo stn').includes('tokyo station'));
  assert.ok(expandSearchQuery('Bogtoa').includes('Bogota'));
  assert.ok(expandSearchQuery('Sao Paolo').includes('Sao Paulo'));
  assert.ok(expandSearchQuery('Bangalore').includes('Bengaluru'));
  assert.ok(expandSearchQuery('Banaras').includes('Varanasi'));
  assert.ok(expandSearchQuery('Gqeberha').includes('Port Elizabeth'));
  assert.ok(expandSearchQuery('Pietersburg').includes('Polokwane'));
});

test('expands romanization, dialect, and historic address names for global search', () => {
  assert.ok(expandSearchQuery('Peking').includes('Beijing'));
  assert.ok(expandSearchQuery('Canton').includes('Guangzhou'));
  assert.ok(expandSearchQuery('Gaoxiong').includes('Kaohsiung'));
  assert.ok(expandSearchQuery('Tsimshatsui').includes('Tsim Sha Tsui'));
  assert.ok(expandSearchQuery('Pusan').includes('Busan'));
  assert.ok(expandSearchQuery('Kyouto').includes('Kyoto'));
  assert.ok(expandSearchQuery('Casa').includes('Casablanca'));
});

test('expands island descriptors across common languages and scripts', () => {
  assert.ok(expandSearchQuery('Bali Island').includes('bali'));
  assert.ok(expandSearchQuery('Île de Ré').includes('re island'));
  assert.ok(expandSearchQuery('Isla de Pascua').includes('pascua island'));
  assert.ok(expandSearchQuery('沖縄島').includes('沖縄 island'));
});

test('normalizes search text for accent-insensitive local matching', () => {
  assert.equal(normalizeSearchText('  São   José, Costa Rica  '), 'sao jose costa rica');
  assert.equal(normalizeSearchText('Av. Reforma #123'), 'avenida reforma 123');
});

test('scores exact, accent-insensitive, and typo-near candidates above unrelated text', () => {
  const queryVariants = expandSearchQuery('Bogtoa');

  assert.ok(scoreSearchCandidate('Bogotá, Colombia', queryVariants) > scoreSearchCandidate('Buenos Aires', queryVariants));
  assert.ok(scoreSearchCandidate('Bogota', queryVariants) >= 0.9);
});

test('ranks typo-tolerant multilingual search candidates with token and n-gram evidence', () => {
  const ranked = rankSearchCandidates('sngapore airprot', [
    { id: 'garden', label: 'Singapore Botanic Gardens' },
    { id: 'changi', label: 'Singapore Changi Airport', aliases: ['Changi International Airport'] },
    { id: 'jakarta', label: 'Soekarno-Hatta International Airport, Jakarta' },
  ]);

  assert.equal(ranked[0].item.id, 'changi');
  assert.ok(ranked[0].score >= 0.68);
  assert.ok(ranked[0].reasons.includes('fuzzy-token'));
});

test('uses open source fuzzy search evidence for abbreviated place queries', () => {
  const ranked = rankSearchCandidates('ny centr pk', [
    { id: 'central-station', label: 'New York Central Railroad Station' },
    { id: 'central-park', label: 'Central Park, Manhattan, New York', aliases: ['NYC Central Park'] },
    { id: 'park-avenue', label: 'Park Avenue, New York' },
  ]);

  assert.equal(ranked[0].item.id, 'central-park');
  assert.ok(ranked[0].reasons.includes('oss-minisearch'));
});

test('evaluates whether search has enough recall and ranking quality', () => {
  const report = evaluateSearchCapability([
    {
      query: 'tokyo stn',
      expectedId: 'tokyo-station',
      candidates: [
        { id: 'tokyo-tower', label: 'Tokyo Tower, Minato' },
        { id: 'tokyo-station', label: 'Tokyo Station, Marunouchi, Chiyoda', aliases: ['東京駅'] },
        { id: 'kyoto-station', label: 'Kyoto Station' },
      ],
    },
    {
      query: 'sngapore airprot',
      expectedId: 'changi',
      candidates: [
        { id: 'changi', label: 'Singapore Changi Airport' },
        { id: 'gardens', label: 'Gardens by the Bay, Singapore' },
        { id: 'jakarta-airport', label: 'Soekarno-Hatta International Airport' },
      ],
    },
    {
      query: 'sao paolo av paulista',
      expectedId: 'avenida-paulista',
      candidates: [
        { id: 'avenida-paulista', label: 'Avenida Paulista, São Paulo, Brazil' },
        { id: 'paulista-museum', label: 'Museu Paulista, São Paulo' },
        { id: 'rio-branco', label: 'Avenida Rio Branco, Rio de Janeiro' },
      ],
    },
  ]);

  assert.equal(report.passed, report.total);
  assert.equal(report.recallAt1, 1);
  assert.ok(report.meanReciprocalRank >= 0.99);
});
