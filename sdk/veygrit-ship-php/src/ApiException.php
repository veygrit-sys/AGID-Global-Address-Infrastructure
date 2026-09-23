<?php
declare(strict_types=1);

namespace Veygrit\Ship;

final class ApiException extends \RuntimeException
{
    public function __construct(string $message, public readonly int $status, public readonly string $errorCode, public readonly ?string $requestId = null, public readonly mixed $details = null)
    {
        parent::__construct($message, $status);
    }
}
