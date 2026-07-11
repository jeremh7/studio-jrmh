<?php

/**
 * Router pour le serveur PHP intégré (Railway).
 *
 * - /uploads/* : servis avec Cache-Control immutable (noms de fichiers uniques)
 * - chemins cachés (/.sessions, /.private…) : bloqués
 * - le reste : Symfony (index.php)
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// Jamais de dotfiles/dossiers cachés (sessions, fichiers privés…)
if (str_contains($uri, '/.')) {
    http_response_code(404);
    exit;
}

$file = __DIR__ . $uri;

if ($uri !== '/' && is_file($file)) {
    if (str_starts_with($uri, '/uploads/')) {
        $types = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'webp' => 'image/webp',
            'gif'  => 'image/gif',
            'avif' => 'image/avif',
        ];
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));

        header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . (string) filesize($file));
        header('Cache-Control: public, max-age=31536000, immutable');
        header('Accept-Ranges: none');

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') {
            readfile($file);
        }
        exit;
    }

    // Autres fichiers statiques (css/js admin…) : serveur intégré
    return false;
}

// Route applicative → front controller Symfony
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/index.php';
require __DIR__ . '/index.php';
