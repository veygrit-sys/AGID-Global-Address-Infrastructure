<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/TransportInterface.php';
require_once __DIR__ . '/../src/ApiException.php';
require_once __DIR__ . '/../src/CurlTransport.php';
require_once __DIR__ . '/../src/Client.php';

use Veygrit\Ship\Client;
use Veygrit\Ship\TransportInterface;

final class CaptureTransport implements TransportInterface {
    public array $last = [];
    public function send(string $method, string $url, array $headers, ?string $body, int $timeoutMs): array {
        $this->last = compact('method','url','headers','body','timeoutMs');
        return ['status'=>201,'headers'=>['x-request-id'=>'req_php_1'],'body'=>'{"shipment":{"shipmentRef":"shp_1"}}'];
    }
}

$transport = new CaptureTransport();
$client = new Client('server-key', 'https://api.veygrit.test', 5000, 0, $transport);
$result = $client->createShipment(['rateQuoteRef'=>'rate_1'], 'order_1');
assert($result['shipment']['shipmentRef'] === 'shp_1');
assert($transport->last['url'] === 'https://api.veygrit.test/v1/shipments');
assert($transport->last['headers']['authorization'] === 'Bearer server-key');
assert($transport->last['headers']['idempotency-key'] === 'order_1');
echo "veygrit/ship PHP SDK tests passed\n";
