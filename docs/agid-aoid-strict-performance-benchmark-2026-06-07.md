# AGID/AOID Strict Performance Benchmark

Generated: 2026-06-07T10:40:50.721Z

## Scope

This benchmark separates single-operation work, WebCrypto-backed cryptographic work, UI approximations, and bulk counts. It reports cold run, mean, median, p95, p99, max, and throughput. The measurements are local Node.js measurements, not mobile-device measurements.

Important limitation: current ZK-related modules generate ZK-ready envelopes and commitments, not full zero-knowledge proof circuits. Real prover/verifier costs must be benchmarked after a concrete proving backend is selected.

## Fixture

- AGID: `JP05AV8TJGHD`
- AOID: `05AV8TJGHDMQTYEF`
- Public QR payload bytes: 1200

## single

| Operation | n | cold ms | mean ms | median ms | p95 ms | p99 ms | max ms | ops/sec | note |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| AGID encode | 1 | 0.0987 | 0.0313 | 0.0313 | 0.0313 | 0.0313 | 0.0313 | 30,395 |  |
| AGID encode | 100 | 0.0549 | 0.0146 | 0.0109 | 0.0324 | 0.0536 | 0.0887 | 65,712 |  |
| AGID encode | 1,000 | 0.0289 | 0.00848 | 0.00570 | 0.0186 | 0.0379 | 0.4123 | 113,149 |  |
| AGID encode | 10,000 | 0.0279 | 0.00402 | 0.00330 | 0.00530 | 0.0194 | 0.1990 | 238,481 |  |
| AOID generate linked to AGID | 1 | 0.1824 | 0.0312 | 0.0312 | 0.0312 | 0.0312 | 0.0312 | 20,040 |  |
| AOID generate linked to AGID | 100 | 0.0147 | 0.0120 | 0.00600 | 0.0275 | 0.2046 | 0.2329 | 81,773 |  |
| AOID generate linked to AGID | 1,000 | 0.00730 | 0.00741 | 0.00400 | 0.0189 | 0.0461 | 0.4462 | 130,960 |  |
| AOID generate linked to AGID | 10,000 | 0.00800 | 0.00564 | 0.00370 | 0.0111 | 0.0226 | 0.8931 | 172,970 |  |
| AOID normalize and reserved-pattern check | 1 | 0.1019 | 0.0180 | 0.0180 | 0.0180 | 0.0180 | 0.0180 | 54,348 |  |
| AOID normalize and reserved-pattern check | 100 | 0.00200 | 0.00273 | 0.00140 | 0.0148 | 0.0191 | 0.0238 | 352,361 |  |
| AOID normalize and reserved-pattern check | 1,000 | 0.00220 | 0.00270 | 0.00150 | 0.00640 | 0.0188 | 0.1904 | 352,088 |  |
| AOID normalize and reserved-pattern check | 10,000 | 0.00210 | 0.00139 | 0.00120 | 0.00160 | 0.00260 | 0.2146 | 652,350 |  |
| AOID public descriptor | 1 | 0.2476 | 0.0148 | 0.0148 | 0.0148 | 0.0148 | 0.0148 | 66,225 |  |
| AOID public descriptor | 100 | 0.0142 | 0.0109 | 0.00880 | 0.0130 | 0.0230 | 0.1634 | 91,124 |  |
| AOID public descriptor | 1,000 | 0.00960 | 0.00955 | 0.00840 | 0.0155 | 0.0252 | 0.1606 | 103,665 |  |
| AOID public descriptor | 10,000 | 0.0107 | 0.00936 | 0.00800 | 0.0153 | 0.0277 | 0.5103 | 105,661 |  |
| AOID public redaction | 1 | 0.0776 | 0.00900 | 0.00900 | 0.00900 | 0.00900 | 0.00900 | 107,527 |  |
| AOID public redaction | 100 | 0.00870 | 0.0107 | 0.00760 | 0.00810 | 0.0228 | 0.2927 | 92,980 |  |
| AOID public redaction | 1,000 | 0.00860 | 0.00876 | 0.00760 | 0.0122 | 0.0248 | 0.1908 | 112,654 |  |
| AOID public redaction | 10,000 | 0.00890 | 0.00805 | 0.00720 | 0.0104 | 0.0238 | 0.2908 | 122,493 |  |
| QR payload public | 1 | 0.3390 | 0.1546 | 0.1546 | 0.1546 | 0.1546 | 0.1546 | 6,452 |  |
| QR payload public | 100 | 0.1623 | 0.0485 | 0.0448 | 0.0821 | 0.0922 | 0.1016 | 20,561 |  |
| QR payload public | 1,000 | 0.0441 | 0.0451 | 0.0384 | 0.0805 | 0.1593 | 0.2911 | 22,113 |  |
| QR payload full private | 1 | 0.3095 | 0.0459 | 0.0459 | 0.0459 | 0.0459 | 0.0459 | 21,598 |  |
| QR payload full private | 100 | 0.0480 | 0.0376 | 0.0349 | 0.0481 | 0.0637 | 0.1840 | 26,501 |  |
| QR payload full private | 1,000 | 0.0391 | 0.0385 | 0.0323 | 0.0648 | 0.1117 | 0.2917 | 25,900 |  |
| Saved QR record materialization | 1 | 0.0602 | 0.00210 | 0.00210 | 0.00210 | 0.00210 | 0.00210 | 434,783 |  |
| Saved QR record materialization | 100 | 0.00210 | 0.00021 | 0.00020 | 0.00030 | 0.00050 | 0.00050 | 3,436,426 |  |
| Saved QR record materialization | 1,000 | 0.00040 | 0.00050 | 0.00020 | 0.00030 | 0.00620 | 0.1718 | 1,685,488 |  |
| Saved QR record materialization | 10,000 | 0.00040 | 0.00011 | 0.00010 | 0.00010 | 0.00020 | 0.1152 | 5,521,811 |  |
| AGID grid features range=5 | 1 | 0.4057 | 0.00770 | 0.00770 | 0.00770 | 0.00770 | 0.00770 | 123,457 |  |
| AGID grid features range=5 | 100 | 0.00490 | 0.00409 | 0.00400 | 0.00430 | 0.00460 | 0.0111 | 240,154 |  |

## crypto

| Operation | n | cold ms | mean ms | median ms | p95 ms | p99 ms | max ms | ops/sec | note |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| WebCrypto ECDSA P-256 key generation | 1 | 0.2674 | 0.1634 | 0.1634 | 0.1634 | 0.1634 | 0.1634 | 6,072 | 10,000件は低速端末で重いので別途長時間ベンチ対象 |
| WebCrypto ECDSA P-256 key generation | 25 | 0.1649 | 0.1173 | 0.1195 | 0.1817 | 0.1822 | 0.1822 | 8,481 | 10,000件は低速端末で重いので別途長時間ベンチ対象 |
| WebCrypto ECDSA sign cached key | 1 | 0.1603 | 0.0935 | 0.0935 | 0.0935 | 0.0935 | 0.0935 | 10,582 |  |
| WebCrypto ECDSA sign cached key | 100 | 0.1183 | 0.0990 | 0.0852 | 0.1767 | 0.2345 | 0.2422 | 10,016 |  |
| WebCrypto ECDSA verify cached key | 1 | 0.1821 | 0.1366 | 0.1366 | 0.1366 | 0.1366 | 0.1366 | 7,283 |  |
| WebCrypto ECDSA verify cached key | 100 | 0.1421 | 0.1188 | 0.1010 | 0.2041 | 0.2430 | 0.2503 | 8,375 |  |
| WebCrypto HMAC sign cached key | 1 | 0.1916 | 0.0607 | 0.0607 | 0.0607 | 0.0607 | 0.0607 | 16,207 |  |
| WebCrypto HMAC sign cached key | 100 | 0.0700 | 0.0372 | 0.0334 | 0.0543 | 0.0674 | 0.0755 | 26,371 |  |
| WebCrypto HMAC verify cached key | 1 | 0.0796 | 0.0453 | 0.0453 | 0.0453 | 0.0453 | 0.0453 | 21,739 |  |
| WebCrypto HMAC verify cached key | 100 | 0.0471 | 0.0397 | 0.0349 | 0.0527 | 0.0677 | 0.2911 | 24,706 |  |
| Address credential issue | 1 | 0.5691 | 0.4689 | 0.4689 | 0.4689 | 0.4689 | 0.4689 | 2,129 |  |
| Address credential issue | 25 | 0.3949 | 0.3161 | 0.2490 | 0.5845 | 0.7117 | 0.7117 | 3,146 |  |
| Address credential verify | 1 | 0.2744 | 0.1607 | 0.1607 | 0.1607 | 0.1607 | 0.1607 | 6,196 |  |
| Address credential verify | 25 | 0.1559 | 0.1488 | 0.1441 | 0.1845 | 0.1894 | 0.1894 | 6,691 |  |
| Duplicate nullifier proof create | 1 | 0.4651 | 0.4060 | 0.4060 | 0.4060 | 0.4060 | 0.4060 | 2,457 | 現行はZK-ready envelopeであり本物のZKP proverではない |
| Duplicate nullifier proof create | 25 | 0.4006 | 0.4609 | 0.3813 | 0.8760 | 0.9341 | 0.9341 | 2,166 | 現行はZK-ready envelopeであり本物のZKP proverではない |
| Duplicate nullifier proof verify | 1 | 0.3671 | 0.0314 | 0.0314 | 0.0314 | 0.0314 | 0.0314 | 31,056 |  |
| Duplicate nullifier proof verify | 100 | 0.0199 | 0.0108 | 0.00960 | 0.0170 | 0.0227 | 0.0228 | 91,684 |  |
| Duplicate nullifier proof verify | 1,000 | 0.0105 | 0.0116 | 0.00920 | 0.0220 | 0.0401 | 0.3307 | 84,747 |  |
| AOID ownership proof create owner-key | 1 | 0.9085 | 0.8066 | 0.8066 | 0.8066 | 0.8066 | 0.8066 | 1,238 | ECDSA key import + sign + issuer HMACを含む |
| AOID ownership proof create owner-key | 25 | 0.6626 | 0.5752 | 0.5291 | 0.8692 | 0.9881 | 0.9881 | 1,736 | ECDSA key import + sign + issuer HMACを含む |
| AOID ownership proof verify owner-key | 1 | 0.8232 | 0.3889 | 0.3889 | 0.3889 | 0.3889 | 0.3889 | 2,564 | ECDSA public key import + verify + issuer HMAC verifyを含む |
| AOID ownership proof verify owner-key | 25 | 0.4444 | 0.5064 | 0.4475 | 0.7988 | 0.9051 | 0.9051 | 1,971 | ECDSA public key import + verify + issuer HMAC verifyを含む |
| Freshness/revocation proof create | 1 | 1.136 | 0.9008 | 0.9008 | 0.9008 | 0.9008 | 0.9008 | 1,109 | 現行は失効リストroot commitment + freshness envelope |
| Freshness/revocation proof create | 25 | 0.9896 | 0.6962 | 0.6190 | 1.198 | 1.327 | 1.327 | 1,435 | 現行は失効リストroot commitment + freshness envelope |
| Freshness/revocation proof verify | 1 | 0.6112 | 0.2163 | 0.2163 | 0.2163 | 0.2163 | 0.2163 | 4,604 |  |
| Freshness/revocation proof verify | 25 | 0.2280 | 0.2604 | 0.2098 | 0.5229 | 0.6499 | 0.6499 | 3,825 |  |

## ui-approx

| Operation | n | cold ms | mean ms | median ms | p95 ms | p99 ms | max ms | ops/sec | note |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| QR SVG render to static markup | 1 | 51.02 | 22.19 | 22.19 | 22.19 | 22.19 | 22.19 | 45 | Canvas paint/toDataURLはブラウザ実測が必要 |
| QR SVG render to static markup | 10 | 22.15 | 20.54 | 20.41 | 22.86 | 22.86 | 22.86 | 49 | Canvas paint/toDataURLはブラウザ実測が必要 |
| QR SVG render to static markup | 100 | 19.85 | 22.63 | 21.16 | 31.74 | 40.28 | 42.20 | 44 | Canvas paint/toDataURLはブラウザ実測が必要 |
| AOID address card React SSR markup | 1 | 0.9820 | 0.1647 | 0.1647 | 0.1647 | 0.1647 | 0.1647 | 6,031 | 実ブラウザのlayout/paintは未計測 |
| AOID address card React SSR markup | 100 | 0.1452 | 0.1195 | 0.1095 | 0.2082 | 0.2651 | 0.5300 | 8,333 | 実ブラウザのlayout/paintは未計測 |
| AOID address card React SSR markup | 1,000 | 0.1244 | 0.1225 | 0.1184 | 0.2180 | 0.3324 | 0.5290 | 8,124 | 実ブラウザのlayout/paintは未計測 |
| IndexedDB payload sanitize fallback | 1 | 0.2034 | 0.00830 | 0.00830 | 0.00830 | 0.00830 | 0.00830 | 111,111 | IndexedDB write latencyそのものではない |
| IndexedDB payload sanitize fallback | 100 | 0.0179 | 0.00106 | 0.00090 | 0.00100 | 0.00230 | 0.0139 | 591,716 | IndexedDB write latencyそのものではない |
| IndexedDB payload sanitize fallback | 1,000 | 0.00320 | 0.00085 | 0.00060 | 0.00100 | 0.0136 | 0.0496 | 899,119 | IndexedDB write latencyそのものではない |
| Sync queue add AOID local-device | 1 | 0.6881 | 0.1861 | 0.1861 | 0.1861 | 0.1861 | 0.1861 | 5,353 |  |
| Sync queue add AOID local-device | 100 | 0.1968 | 0.0894 | 0.0605 | 0.2436 | 0.3330 | 0.4850 | 11,133 |  |
| Sync queue add AOID local-device | 1,000 | 0.0565 | 0.0708 | 0.0610 | 0.1188 | 0.2110 | 3.332 | 14,062 |  |
| AOID sync queue encrypted envelope | 1 | 0.3819 | 0.00400 | 0.00400 | 0.00400 | 0.00400 | 0.00400 | 222,222 |  |
| AOID sync queue encrypted envelope | 100 | 0.00430 | 0.00532 | 0.00480 | 0.00700 | 0.0120 | 0.0125 | 180,343 |  |
| AOID sync queue encrypted envelope | 1,000 | 0.0125 | 0.00348 | 0.00250 | 0.00510 | 0.0153 | 0.0517 | 275,680 |  |
| Worker message structuredClone model | 1 | 0.1249 | 0.00470 | 0.00470 | 0.00470 | 0.00470 | 0.00470 | 200,000 | 実Worker postMessage往復ではない |
| Worker message structuredClone model | 100 | 0.0139 | 0.00292 | 0.00250 | 0.00480 | 0.00730 | 0.0123 | 329,598 | 実Worker postMessage往復ではない |
| Worker message structuredClone model | 1,000 | 0.00310 | 0.00273 | 0.00240 | 0.00450 | 0.00550 | 0.0262 | 348,602 | 実Worker postMessage往復ではない |
| Worker message structuredClone model | 10,000 | 0.00550 | 0.00370 | 0.00270 | 0.00650 | 0.0177 | 0.4036 | 259,373 | 実Worker postMessage往復ではない |
| Worker grid compute model | 1 | 331.55 | 213.09 | 213.09 | 213.09 | 213.09 | 213.09 | 5 | Worker越しの転送・スケジューリングは含まない |
| Worker grid compute model | 100 | 220.84 | 234.13 | 227.14 | 381.84 | 443.51 | 454.91 | 4 | Worker越しの転送・スケジューリングは含まない |

## Strict Reading

The strongest claims should be limited to the rows actually measured above. In particular, do not use these Node.js values to claim mobile Canvas, IndexedDB, Worker round-trip, or real ZKP proving performance.

Highest p99 rows:

- ui-approx / Worker grid compute model / n=100: p99=443.51ms, max=454.91ms
- ui-approx / Worker grid compute model / n=1: p99=213.09ms, max=213.09ms
- ui-approx / QR SVG render to static markup / n=100: p99=40.28ms, max=42.20ms
- ui-approx / QR SVG render to static markup / n=10: p99=22.86ms, max=22.86ms
- ui-approx / QR SVG render to static markup / n=1: p99=22.19ms, max=22.19ms
- crypto / Freshness/revocation proof create / n=25: p99=1.327ms, max=1.327ms
- crypto / AOID ownership proof create owner-key / n=25: p99=0.9881ms, max=0.9881ms
- crypto / Duplicate nullifier proof create / n=25: p99=0.9341ms, max=0.9341ms
- crypto / AOID ownership proof verify owner-key / n=25: p99=0.9051ms, max=0.9051ms
- crypto / Freshness/revocation proof create / n=1: p99=0.9008ms, max=0.9008ms

Unmeasured but required before a strong production claim:

- Browser Canvas QR paint and PNG export (`toDataURL`) on desktop and mobile.
- IndexedDB write/read latency and quota behavior with 1, 100, 1,000, and 10,000 records.
- Real Worker `postMessage` round-trip, transfer costs, and cancellation behavior.
- Low-end mobile cold-start WebCrypto key generation, first proof generation, p95, p99, and max.
- Full ZKP prover/verifier cost after selecting the backend and circuits.
