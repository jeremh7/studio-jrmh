<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\Client;
use App\Entity\Gallery;
use App\Entity\Photo;
use App\Repository\GalleryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api', name: 'api_')]
final class GalleryController extends AbstractController
{
    public function __construct(
        private readonly GalleryRepository      $galleryRepository,
        private readonly EntityManagerInterface $em,
        private readonly string                 $uploadDir,
        private readonly string                 $privateDir,
    ) {}

    // POST /api/gallery/access — accès par code (public)
    #[Route('/gallery/access', name: 'gallery_access', methods: ['POST'])]
    public function access(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $code = strtoupper(trim((string) ($data['code'] ?? '')));

        if ($code === '') {
            return $this->json(['error' => 'Code requis.'], Response::HTTP_BAD_REQUEST);
        }

        $gallery = $this->galleryRepository->findOneBy(['accessCode' => $code]);

        if ($gallery === null) {
            return $this->json(['error' => 'Code incorrect.'], Response::HTTP_NOT_FOUND);
        }
        if ($gallery->getStatus() !== Gallery::STATUS_ACTIVE) {
            return $this->json(['error' => 'Galerie non disponible.'], Response::HTTP_FORBIDDEN);
        }
        if ($gallery->isExpired()) {
            return $this->json(['error' => 'Accès expiré. Contactez votre photographe.'], Response::HTTP_GONE);
        }

        $gallery->incrementViewCount();
        $gallery->setLastAccessAt(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json([
            'id'              => $gallery->getId(),
            'title'           => $gallery->getTitle(),
            'description'     => $gallery->getDescription(),
            'code'            => $gallery->getAccessCode(),
            'photoCount'      => $gallery->getPhotoCount(),
            'downloadEnabled' => $gallery->isDownloadEnabled(),
            'deliveryMode'    => $gallery->getDeliveryMode(),
            'expiresAt'       => $gallery->getExpiresAt()?->format('d/m/Y'),
            'sessionDate'     => $gallery->getSessionDate()?->format('d F Y'),
            'client'          => ['name' => $gallery->getClient()->getFullName()],
        ]);
    }

    // GET /api/gallery/{code}/photos — liste photos (public par code, vérifie ownership si JWT présent)
    #[Route('/gallery/{code}/photos', name: 'gallery_photos', methods: ['GET'])]
    public function photos(string $code): JsonResponse
    {
        $gallery = $this->galleryRepository->findOneBy(['accessCode' => strtoupper($code)]);

        if ($gallery === null || !$gallery->isAccessible()) {
            return $this->json(['error' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        // Si un JWT est présent, il doit appartenir au propriétaire
        $currentUser = $this->getUser();
        if ($currentUser instanceof Client) {
            if ($gallery->getClient()->getId() !== $currentUser->getId()) {
                return $this->json(
                    ['error' => 'Cette galerie ne vous appartient pas.'],
                    Response::HTTP_FORBIDDEN
                );
            }
        }

        $photos = array_map(
            fn(Photo $p) => $this->serializePhoto($p),
            $gallery->getPhotos()->toArray()
        );

        return $this->json([
            'gallery' => [
                'id'              => $gallery->getId(),
                'title'           => $gallery->getTitle(),
                'downloadEnabled' => $gallery->isDownloadEnabled(),
                'deliveryMode'    => $gallery->getDeliveryMode(),
                'watermarkLevel'  => $gallery->getWatermarkLevel(),
            ],
            'photos' => $photos,
            'total'  => count($photos),
        ]);
    }

    // GET /api/client/gallery/{id}/photos — photos d'une galerie par ID (JWT requis + ownership)
    #[Route('/client/gallery/{id}/photos', name: 'client_gallery_photos', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function clientGalleryPhotos(int $id): JsonResponse
    {
        /** @var Client $client */
        $client = $this->getUser();
        if (!$client instanceof Client) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $gallery = $this->galleryRepository->find($id);

        if ($gallery === null) {
            return $this->json(['error' => 'Galerie introuvable.'], Response::HTTP_NOT_FOUND);
        }
        if ($gallery->getClient()->getId() !== $client->getId()) {
            return $this->json(['error' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }
        if (!$gallery->isAccessible()) {
            return $this->json(['error' => 'Galerie non disponible.'], Response::HTTP_FORBIDDEN);
        }

        $photos = array_map(
            fn(Photo $p) => $this->serializePhoto($p),
            $gallery->getPhotos()->toArray()
        );

        return $this->json([
            'gallery' => [
                'id'              => $gallery->getId(),
                'title'           => $gallery->getTitle(),
                'description'     => $gallery->getDescription(),
                'accessCode'      => $gallery->getAccessCode(),
                'shareToken'      => $gallery->getShareToken(),
                'downloadEnabled' => $gallery->isDownloadEnabled(),
                'deliveryMode'    => $gallery->getDeliveryMode(),
                'watermarkLevel'  => $gallery->getWatermarkLevel(),
                'expiresAt'       => $gallery->getExpiresAt()?->format('Y-m-d'),
                'sessionDate'     => $gallery->getSessionDate()?->format('Y-m-d'),
                'photoCount'      => $gallery->getPhotoCount(),
            ],
            'photos' => $photos,
            'total'  => count($photos),
        ]);
    }

    // POST /api/client/gallery/{id}/share — génère un token de partage (JWT requis)
    #[Route('/client/gallery/{id}/share', name: 'client_gallery_share_generate', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function generateShareToken(int $id): JsonResponse
    {
        /** @var Client $client */
        $client = $this->getUser();
        if (!$client instanceof Client) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $gallery = $this->galleryRepository->find($id);

        if ($gallery === null || $gallery->getClient()->getId() !== $client->getId()) {
            return $this->json(['error' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }
        if (!$gallery->isAccessible()) {
            return $this->json(['error' => 'La galerie doit être publiée pour être partagée.'], Response::HTTP_FORBIDDEN);
        }

        $token = $gallery->generateShareToken();
        $this->em->flush();

        return $this->json(['shareToken' => $token]);
    }

    // POST /api/client/gallery/{id}/share/revoke — révoque le token (JWT requis)
    #[Route('/client/gallery/{id}/share/revoke', name: 'client_gallery_share_revoke', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function revokeShareToken(int $id): JsonResponse
    {
        /** @var Client $client */
        $client = $this->getUser();
        if (!$client instanceof Client) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $gallery = $this->galleryRepository->find($id);

        if ($gallery === null || $gallery->getClient()->getId() !== $client->getId()) {
            return $this->json(['error' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $gallery->setShareToken(null);
        $this->em->flush();

        return $this->json(['ok' => true]);
    }

    // GET /api/gallery/share/{token} — accès public par token de partage
    #[Route('/gallery/share/{token}', name: 'gallery_share_view', methods: ['GET'])]
    public function shareView(string $token): JsonResponse
    {
        $gallery = $this->galleryRepository->findOneBy(['shareToken' => $token]);

        if ($gallery === null) {
            return $this->json(['error' => 'Lien de partage invalide ou révoqué.'], Response::HTTP_NOT_FOUND);
        }
        if (!$gallery->isAccessible()) {
            return $this->json(['error' => 'Cette galerie n\'est plus disponible.'], Response::HTTP_GONE);
        }

        $photos = array_map(
            fn(Photo $p) => $this->serializePhoto($p),
            $gallery->getPhotos()->toArray()
        );

        return $this->json([
            'gallery' => [
                'id'          => $gallery->getId(),
                'title'       => $gallery->getTitle(),
                'description' => $gallery->getDescription(),
                'photoCount'  => $gallery->getPhotoCount(),
                'sessionDate' => $gallery->getSessionDate()?->format('Y-m-d'),
                'expiresAt'   => $gallery->getExpiresAt()?->format('Y-m-d'),
            ],
            'photos' => $photos,
            'total'  => count($photos),
        ]);
    }

    // GET /api/client/gallery/{id}/download — télécharge toute la galerie en ZIP
    #[Route('/client/gallery/{id}/download', name: 'client_gallery_download', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function download(int $id): Response
    {
        /** @var Client $client */
        $client = $this->getUser();
        if (!$client instanceof Client) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $gallery = $this->galleryRepository->find($id);

        if ($gallery === null) {
            return $this->json(['error' => 'Galerie introuvable.'], Response::HTTP_NOT_FOUND);
        }
        if ($gallery->getClient()->getId() !== $client->getId()) {
            return $this->json(['error' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }
        if (!$gallery->isAccessible()) {
            return $this->json(['error' => 'Galerie non disponible.'], Response::HTTP_FORBIDDEN);
        }
        if (!$gallery->isDownloadEnabled()) {
            return $this->json(['error' => 'Le téléchargement n\'est pas autorisé pour cette galerie.'], Response::HTTP_FORBIDDEN);
        }

        $photos = $gallery->getPhotos()->toArray();
        if (empty($photos)) {
            return $this->json(['error' => 'Aucune photo à télécharger.'], Response::HTTP_NOT_FOUND);
        }

        // Crée le ZIP en mémoire
        $zipPath = sys_get_temp_dir() . '/jrmh_gallery_' . $gallery->getId() . '_' . uniqid() . '.zip';
        $zip = new \ZipArchive();

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return $this->json(['error' => 'Impossible de créer l\'archive.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        $added = 0;
        foreach ($photos as $photo) {
            $fullRelPath = $photo->getFullPath();
            $srcPath     = $fullRelPath ? $this->privateDir . '/' . $fullRelPath : null;

            if (!$srcPath || !file_exists($srcPath)) continue;

            $added++;
            $ext   = strtolower(pathinfo($srcPath, PATHINFO_EXTENSION) ?: 'jpg');
            $label = sprintf('%03d_photo-studiojrmh.%s', $added, $ext);
            $zip->addFile($srcPath, $label);
        }

        $zip->close();

        if ($added === 0) {
            @unlink($zipPath);
            return $this->json(['error' => 'Aucun fichier trouvé sur le serveur.'], Response::HTTP_NOT_FOUND);
        }

        $gallerySlug = preg_replace('/[^a-z0-9]+/', '-', strtolower($gallery->getTitle()));
        $gallerySlug = trim($gallerySlug, '-');
        $filename    = 'studiojrmh-' . $gallerySlug . '.zip';

        $response = new StreamedResponse(function () use ($zipPath) {
            $handle = fopen($zipPath, 'rb');
            while (!feof($handle)) {
                echo fread($handle, 8192);
                flush();
            }
            fclose($handle);
            @unlink($zipPath);
        });

        $response->headers->set('Content-Type', 'application/zip');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $response->headers->set('Content-Length', (string) filesize($zipPath));
        $response->headers->set('Cache-Control', 'no-cache, no-store');

        return $response;
    }

    // GET /api/client/galleries — galeries du client connecté (JWT requis via security.yaml)
    #[Route('/client/galleries', name: 'client_galleries', methods: ['GET'])]
    public function clientGalleries(): JsonResponse
    {
        /** @var Client $client */
        $client = $this->getUser();

        if (!$client instanceof Client) {
            return $this->json(['error' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        $galleries = array_map(fn(Gallery $g) => [
            'id'           => $g->getId(),
            'title'        => $g->getTitle(),
            'status'       => $g->getStatus(),
            'photoCount'   => $g->getPhotoCount(),
            'accessCode'   => $g->getAccessCode(),
            'deliveryMode' => $g->getDeliveryMode(),
            'expiresAt'    => $g->getExpiresAt()?->format('Y-m-d'),
            'publishedAt'  => $g->getPublishedAt()?->format('Y-m-d'),
            'sessionDate'  => $g->getSessionDate()?->format('Y-m-d'),
            'isExpired'    => $g->isExpired(),
            'isAccessible' => $g->isAccessible(),
        ], $client->getGalleries()->toArray());

        return $this->json(['galleries' => $galleries, 'total' => count($galleries)]);
    }

    private function serializePhoto(Photo $p): array
    {
        return [
            'id'             => $p->getId(),
            'url'            => $p->getPublicUrl(),
            'hasFullVersion' => $p->hasFullVersion(),
            'caption'        => $p->getCaption(),
            'width'          => $p->getWidth(),
            'height'         => $p->getHeight(),
            'filename'       => $p->getOriginalFilename(),
            'fileSize'       => $p->getFileSizeFormatted(),
            'webSize'        => $p->getWebSize(),
            'featured'       => $p->isFeatured(),
            'isPurchasable'  => $p->isPurchasable(),
            'unitPrice'      => $p->getUnitPrice(),
        ];
    }
}
