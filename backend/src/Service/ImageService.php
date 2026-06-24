<?php

declare(strict_types=1);

namespace App\Service;

use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Psr\Log\LoggerInterface;

/**
 * Traitement d'images : resize WebP, watermark, thumbnail.
 *
 * Structure de fichiers :
 *   var/uploads/galleries/{id}/web/{uuid}.webp  → public (symlink)
 *   var/private/galleries/{id}/{uuid}.{ext}      → privé (jamais exposé)
 */
final class ImageService
{
    private const WEB_MAX_WIDTH  = 1200;
    private const WEB_MAX_HEIGHT = 1200;
    private const WEB_QUALITY    = 85;
    private const THUMB_SIZE     = 400;

    private readonly ImageManager $manager;

    public function __construct(
        private readonly string $uploadDir,
        private readonly string $privateDir,
        private readonly LoggerInterface $logger,
    ) {
        $this->manager = new ImageManager(new Driver());
    }

    // ── API publique ──────────────────────────────────────────────

    /**
     * Traitement complet d'un fichier uploadé :
     *  - copie l'original dans var/private/galleries/{galleryId}/
     *  - génère une version web 1200px WebP dans var/uploads/galleries/{galleryId}/web/
     *  - applique le watermark si demandé
     *
     * @return array{webPath: string, fullPath: string, webSize: int, width: int, height: int}
     */
    public function processUpload(
        string $sourcePath,
        int    $galleryId,
        string $originalExtension,
        string $watermarkLevel = 'none',
    ): array {
        $uuid = bin2hex(random_bytes(12));

        // ── Chemins ──
        $privateGalleryDir = $this->privateDir . '/galleries/' . $galleryId;
        $webGalleryDir     = $this->uploadDir  . '/galleries/' . $galleryId . '/web';

        $this->ensureDir($privateGalleryDir);
        $this->ensureDir($webGalleryDir);

        $fullFilename = $uuid . '.' . strtolower($originalExtension);
        $webFilename  = $uuid . '.webp';

        $fullAbsPath = $privateGalleryDir . '/' . $fullFilename;
        $webAbsPath  = $webGalleryDir    . '/' . $webFilename;

        // ── 1. Copie de l'original en privé ──
        copy($sourcePath, $fullAbsPath);

        // ── 2. Version web redimensionnée ──
        $image = $this->manager->read($sourcePath);

        [$origW, $origH] = [$image->width(), $image->height()];

        $image->scaleDown(
            width:  self::WEB_MAX_WIDTH,
            height: self::WEB_MAX_HEIGHT,
        );

        [$webW, $webH] = [$image->width(), $image->height()];

        // ── 3. Watermark ──
        if ($watermarkLevel !== 'none') {
            $this->applyWatermark($image, $watermarkLevel, $webW, $webH);
        }

        // ── 4. Encodage WebP + sauvegarde ──
        $image->toWebp(quality: self::WEB_QUALITY)->save($webAbsPath);

        $webSize = filesize($webAbsPath) ?: 0;

        // Chemins relatifs (à stocker en base)
        $fullRelPath = 'galleries/' . $galleryId . '/' . $fullFilename;
        $webRelPath  = 'galleries/' . $galleryId . '/web/' . $webFilename;

        $this->logger->info('[ImageService] Photo traitée', [
            'gallery'  => $galleryId,
            'webPath'  => $webRelPath,
            'fullPath' => $fullRelPath,
            'origSize' => "{$origW}×{$origH}",
            'webSize'  => "{$webW}×{$webH}",
            'fileSize' => $webSize,
        ]);

        return [
            'webPath'  => $webRelPath,
            'fullPath' => $fullRelPath,
            'webSize'  => $webSize,
            'width'    => $webW,
            'height'   => $webH,
        ];
    }

    /**
     * Régénère la version web d'une photo déjà enregistrée (ex. : changement watermark).
     */
    public function regenerateWebVersion(
        string $fullAbsolutePath,
        int    $galleryId,
        string $existingWebFilename,
        string $watermarkLevel = 'none',
    ): int {
        $webAbsPath = $this->uploadDir . '/galleries/' . $galleryId . '/web/' . $existingWebFilename;

        $image = $this->manager->read($fullAbsolutePath);
        $image->scaleDown(width: self::WEB_MAX_WIDTH, height: self::WEB_MAX_HEIGHT);

        if ($watermarkLevel !== 'none') {
            $this->applyWatermark($image, $watermarkLevel, $image->width(), $image->height());
        }

        $image->toWebp(quality: self::WEB_QUALITY)->save($webAbsPath);

        return filesize($webAbsPath) ?: 0;
    }

    /**
     * Supprime les fichiers physiques d'une photo (web + full).
     */
    public function deletePhotoFiles(string $webRelPath, ?string $fullRelPath): void
    {
        $webAbs = $this->uploadDir . '/' . $webRelPath;
        if (file_exists($webAbs)) {
            unlink($webAbs);
        }

        if ($fullRelPath !== null) {
            $fullAbs = $this->privateDir . '/' . $fullRelPath;
            if (file_exists($fullAbs)) {
                unlink($fullAbs);
            }
        }
    }

    /**
     * Retourne le chemin absolu de l'original privé à partir du fullPath relatif.
     */
    public function getPrivateAbsolutePath(string $fullRelPath): string
    {
        return $this->privateDir . '/' . $fullRelPath;
    }

    // ── Interne ───────────────────────────────────────────────────

    private function applyWatermark(
        \Intervention\Image\Interfaces\ImageInterface $image,
        string $level,
        int    $width,
        int    $height,
    ): void {
        $opacity = match ($level) {
            'strong' => 0.55,
            default  => 0.25,   // subtle
        };

        $fontSize = (int) max(18, min(48, $width / 22));

        // Couleur RGBA : blanc semi-transparent selon l'opacité
        $alphaHex = str_pad(dechex((int) round($opacity * 255)), 2, '0', STR_PAD_LEFT);
        $colorStr  = '#c8c8c8' . $alphaHex; // gris clair + canal alpha

        // Texte répété en grille 3×3 pour couvrir toute l'image
        $step = (int) ($width / 3);
        for ($x = (int)($step / 2); $x < $width; $x += $step) {
            for ($y = (int)($height / 4); $y < $height; $y += (int)($height / 3)) {
                $image->text(
                    'STUDIØ JRMH',
                    (int) $x,
                    (int) $y,
                    function (\Intervention\Image\Typography\FontFactory $font) use ($fontSize, $colorStr) {
                        $font->size($fontSize);
                        $font->color($colorStr);
                        $font->align('center');
                        $font->valign('middle');
                    }
                );
            }
        }
    }

    private function ensureDir(string $path): void
    {
        if (!is_dir($path)) {
            mkdir($path, 0755, true);
        }
    }
}
