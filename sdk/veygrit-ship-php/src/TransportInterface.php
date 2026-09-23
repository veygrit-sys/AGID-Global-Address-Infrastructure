<?php
declare(strict_types=1);

namespace Veygrit\Ship;

interface TransportInterface
{
    /** @return array{status:int,headers:array<string,string>,body:string} */
    public function send(string $method, string $url, array $headers, ?string $body, int $timeoutMs): array;
}
