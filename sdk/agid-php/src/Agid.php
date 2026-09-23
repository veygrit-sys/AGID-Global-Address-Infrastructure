<?php

namespace Agid;

final class Agid
{
    public const BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    public const PREFIX_LENGTH = 2;
    public const HASH_LENGTH = 10;
    public const TOTAL_LENGTH = 12;

    public static function encode(float $lat, float $lon): array
    {
        throw new \RuntimeException('wire this package to the AGID reference implementation');
    }

    public static function decode(string $id): ?array
    {
        return null;
    }

    public static function cellBounds(string $id): array
    {
        throw new \RuntimeException('wire this package to the AGID reference implementation');
    }
}
