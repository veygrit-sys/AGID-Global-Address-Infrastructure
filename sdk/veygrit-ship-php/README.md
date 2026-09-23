# veygrit/ship

Production PHP 8.1+ SDK for Veygrit -ship. Keep API keys in server-side environment variables.

## Credential Boundary

This package is a server-side SDK. Do not send carrier credentials through this SDK. Public and Guest flows have no credential input, no credential-storage route, and no public carrier-connection route.

Before using sandbox routes, review the repository credential matrix: `docs/ops/veygrit-ship-credential-surface-matrix.md`.
Before release packaging, review the local no-publish checklist: `docs/ops/veygrit-ship-sdk-release-checklist.md`.

- Guest sessions do not create, store, return, or promote carrier credential references.
- Guest route success is not proof of Merchant account ownership, carrier account approval, live labels, or production carrier traffic.

Verification order:

```powershell
npm run verify:veygrit-ship-credential-surfaces
npm run verify:veygrit-ship-sdk-readmes
npm run verify:veygrit-ship-sdk-release-checklist
php sdk/veygrit-ship-php/tests/ClientTest.php
```

```php
$ship = new Veygrit\Ship\Client($_ENV['VEYGRIT_SHIP_API_KEY']);
$rates = $ship->createRates(['originRef' => 'org_...', 'destination' => [], 'packages' => []]);
$shipment = $ship->createShipment(['rateQuoteRef' => $rates['rates'][0]['rateQuoteRef']], 'order-123');
```

The client adds Request IDs and Idempotency Keys, retries 408/429/5xx responses with a bound, and throws `ApiException` with `status`, `errorCode`, and `requestId`.
