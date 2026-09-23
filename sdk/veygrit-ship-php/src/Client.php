<?php
declare(strict_types=1);

namespace Veygrit\Ship;

final class Client
{
    private readonly TransportInterface $transport;

    public function __construct(private readonly string $apiKey, private readonly string $baseUrl = 'https://api.veygrit.com', private readonly int $timeoutMs = 20000, private readonly int $maxRetries = 2, ?TransportInterface $transport = null)
    {
        if ($apiKey === '') throw new \InvalidArgumentException('apiKey is required');
        $this->transport = $transport ?? new CurlTransport();
    }

    public function createRates(array $input, ?string $idempotencyKey = null): array { return $this->request('POST', '/v1/delivery/rates', $input, $idempotencyKey); }
    public function createShipment(array $input, ?string $idempotencyKey = null): array { return $this->request('POST', '/v1/shipments', $input, $idempotencyKey); }
    public function retrieveShipment(string $ref): array { return $this->request('GET', '/v1/shipments/' . rawurlencode($ref)); }
    public function voidShipment(string $ref, ?string $key = null): array { return $this->request('POST', '/v1/shipments/' . rawurlencode($ref) . '/void', [], $key); }
    public function tracking(string $ref): array { return $this->request('GET', '/v1/shipments/' . rawurlencode($ref) . '/tracking'); }
    public function createOrigin(array $input, ?string $key = null): array { return $this->request('POST', '/v1/shipping-origins', $input, $key); }
    public function createReturn(array $input, ?string $key = null): array { return $this->request('POST', '/v1/returns', $input, $key); }
    public function requestPickup(array $input, ?string $key = null): array { return $this->request('POST', '/v1/pickups', $input, $key); }
    public function createWebhook(array $input, ?string $key = null): array { return $this->request('POST', '/v1/webhooks', $input, $key); }
    public function usage(): array { return $this->request('GET', '/v1/billing/usage'); }

    private function request(string $method, string $path, ?array $body = null, ?string $key = null): array
    {
        $idempotencyKey = $method === 'GET' ? null : ($key ?? bin2hex(random_bytes(16)));
        for ($attempt = 0; ; $attempt++) {
            $headers = ['accept' => 'application/json', 'authorization' => 'Bearer ' . $this->apiKey, 'x-request-id' => bin2hex(random_bytes(16))];
            if ($body !== null) $headers['content-type'] = 'application/json';
            if ($idempotencyKey !== null) $headers['idempotency-key'] = $idempotencyKey;
            $result = $this->transport->send($method, rtrim($this->baseUrl, '/') . $path, $headers, $body === null ? null : json_encode($body, JSON_THROW_ON_ERROR), $this->timeoutMs);
            $payload = json_decode($result['body'], true);
            if ($result['status'] >= 200 && $result['status'] < 300 && is_array($payload)) return $payload;
            $retryable = $result['status'] === 408 || $result['status'] === 429 || $result['status'] >= 500;
            if ($retryable && $attempt < $this->maxRetries) { usleep(min(250000 * (2 ** $attempt), 2000000)); continue; }
            throw new ApiException((string)($payload['message'] ?? 'Veygrit -ship API request failed'), $result['status'], (string)($payload['error'] ?? 'api_request_failed'), $result['headers']['x-request-id'] ?? null, $payload);
        }
    }
}
