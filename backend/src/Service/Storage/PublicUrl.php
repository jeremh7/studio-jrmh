<?php

declare(strict_types=1);

namespace App\Service\Storage;

/**
 * Resout l'URL publique d'une cle de fichier stockee.
 * Utilise R2_PUBLIC_URL si configure (prod), sinon retombe sur /uploads/ (dev local, disque).
 */
final class PublicUrl
{
    public static function resolve(string $key): string
    {
        $base = trim((string) ($_ENV['R2_PUBLIC_URL'] ?? ''));
        $key  = ltrim($key, '/');

        return $base !== ''
            ? rtrim($base, '/') . '/' . $key
            : '/uploads/' . $key;
    }
}
