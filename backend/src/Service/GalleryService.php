<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Gallery;
use App\Entity\Photo;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class GalleryService
{
    private const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'];
    private const MAX_BYTES    = 50 * 1024 * 1024; // 50 MB (originaux haute résolution)

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ImageService           $imageService,
        private readonly string                 $uploadDir,
    ) {}

    // ── Code d'accès ──────────────────────────────────────────────

    public function generateUniqueCode(): string
    {
        $repo = $this->em->getRepository(Gallery::class);
        do {
            $code = 'JRMH' . strtoupper(
                substr(base_convert((string) random_int(100000, 999999), 10, 36), 0, 4)
            );
        } while ($repo->findOneBy(['accessCode' => $code]) !== null);

        return $code;
    }

    // ── Publication ───────────────────────────────────────────────

    public function publish(Gallery $gallery, ?int $days = 30): void
    {
        $gallery->publish($days);
        $this->em->flush();
    }

    // ── Upload dual (web + full) ───────────────────────────────────

    /**
     * Upload d'une photo avec double sauvegarde :
     *  - original → var/private/galleries/{id}/ (jamais public)
     *  - web 1200px WebP → var/uploads/galleries/{id}/web/ (public via symlink)
     */
    public function uploadPhoto(Gallery $gallery, UploadedFile $file): Photo
    {
        // Validation
        if (!in_array($file->getMimeType(), self::ALLOWED_MIME, true)) {
            throw new \InvalidArgumentException(
                $file->getClientOriginalName() . ' — format non supporté.'
            );
        }
        if ($file->getSize() > self::MAX_BYTES) {
            throw new \InvalidArgumentException(
                $file->getClientOriginalName() . ' — trop lourd (max 50 MB).'
            );
        }

        // Dépose le fichier uploadé dans un temp local propre
        $tmpPath = sys_get_temp_dir() . '/' . uniqid('jrmh_', true);
        $file->move(sys_get_temp_dir(), basename($tmpPath));
        $tmpPath = sys_get_temp_dir() . '/' . basename($tmpPath);

        $ext            = strtolower($file->getClientOriginalExtension() ?: ($file->guessExtension() ?? 'jpg'));
        $watermarkLevel = 'none'; // Filigranes désactivés — fonctionnalité future

        try {
            $result = $this->imageService->processUpload(
                sourcePath:        $tmpPath,
                galleryId:         $gallery->getId(),
                originalExtension: $ext,
                watermarkLevel:    $watermarkLevel,
            );
        } finally {
            if (file_exists($tmpPath)) {
                unlink($tmpPath);
            }
        }

        $photo = new Photo();
        $photo->setGallery($gallery);
        $photo->setOriginalFilename($file->getClientOriginalName());
        $photo->setStoredFilename(basename($result['webPath']));
        $photo->setExtension($ext);
        $photo->setSortOrder($gallery->getPhotos()->count());

        // Champs V1 (compat ascendante)
        $photo->setPath($result['webPath']);
        $photo->setFileSize($result['webSize']);
        $photo->setWidth($result['width']);
        $photo->setHeight($result['height']);

        // Champs V2
        $photo->setWebPath($result['webPath']);
        $photo->setFullPath($result['fullPath']);
        $photo->setWebSize($result['webSize']);

        $this->em->persist($photo);
        $this->em->flush();

        return $photo;
    }

    // ── Suppression ───────────────────────────────────────────────

    public function deletePhoto(Photo $photo): void
    {
        // Suppression des fichiers physiques (web + full)
        if ($photo->getWebPath()) {
            $this->imageService->deletePhotoFiles(
                $photo->getWebPath(),
                $photo->getFullPath(),
            );
        } else {
            // Ancienne photo V1 (un seul fichier)
            $legacy = $this->uploadDir . '/' . $photo->getPath();
            if ($photo->getPath() && file_exists($legacy)) {
                unlink($legacy);
            }
        }

        $this->em->remove($photo);
        $this->em->flush();
    }

    // ── Réordonnancement ─────────────────────────────────────────

    public function reorderPhotos(Gallery $gallery, array $ids): void
    {
        $map = [];
        foreach ($gallery->getPhotos() as $p) {
            $map[$p->getId()] = $p;
        }
        foreach ($ids as $i => $id) {
            if (isset($map[$id])) {
                $map[$id]->setSortOrder($i);
            }
        }
        $this->em->flush();
    }
}
