<?php

declare(strict_types=1);

namespace App\Service\Storage;

/** Mapping extension → MIME type, sans dépendre de l'extension PHP fileinfo. */
final class MimeTypes
{
    public static function forExtension(string $extension): string
    {
        return match (strtolower($extension)) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png'         => 'image/png',
            'webp'        => 'image/webp',
            'gif'         => 'image/gif',
            'tif', 'tiff' => 'image/tiff',
            default       => 'application/octet-stream',
        };
    }
}
