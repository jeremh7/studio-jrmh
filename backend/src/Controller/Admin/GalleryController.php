<?php

namespace App\Controller\Admin;

use App\Entity\Gallery;
use App\Entity\Photo;
use App\Repository\GalleryRepository;
use App\Repository\ClientRepository;
use App\Service\GalleryService;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/galleries', name: 'admin_galleries_')]
#[IsGranted('ROLE_ADMIN')]
class GalleryController extends AbstractController
{
    public function __construct(
        private readonly GalleryService $galleryService,
        private readonly NotificationService $notificationService,
        private readonly GalleryRepository $galleryRepo,
        private readonly ClientRepository $clientRepo,
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('', name: 'index')]
    public function index(Request $request): Response
    {
        $qb = $this->galleryRepo->createQueryBuilder('g')
            ->leftJoin('g.client', 'c')
            ->addSelect('c')
            ->orderBy('g.createdAt', 'DESC');
        
        if ($status = $request->query->get('status')) {
            $qb->andWhere('g.status = :status')
               ->setParameter('status', $status);
        }
        
        if ($q = $request->query->get('q')) {
            $qb->andWhere('g.title LIKE :q OR c.firstName LIKE :q OR c.lastName LIKE :q')
               ->setParameter('q', "%$q%");
        }
        
        return $this->render('admin/galleries/index.html.twig', [
            'galleries' => $qb->getQuery()->getResult(),
            'status' => $status ?? null,
            'search' => $q ?? null,
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request): Response
    {
        $clients = $this->clientRepo->findBy([], ['lastName' => 'ASC']);
        
        if ($request->isMethod('POST')) {
            $client = $this->clientRepo->find($request->request->get('client_id'));
            
            if (!$client) {
                $this->addFlash('error', 'Client introuvable.');
                return $this->redirectToRoute('admin_galleries_new');
            }
            
            // Création de la galerie
            $gallery = new Gallery();
            $gallery->setClient($client)
                    ->setTitle($request->request->get('title'))
                    ->setDescription($request->request->get('description'))
                    ->setAccessCode($this->galleryService->generateUniqueCode())
                    ->setDownloadEnabled((bool)$request->request->get('download_enabled', true));

            if ($sessionDate = $request->request->get('session_date')) {
                $gallery->setSessionDate(new \DateTime($sessionDate));
            }
            
            $this->em->persist($gallery);
            $this->em->flush();
            
            $this->addFlash('success', sprintf(
                'Galerie "%s" créée avec succès ! Code d\'accès : %s',
                $gallery->getTitle(),
                $gallery->getAccessCode()
            ));
            
            return $this->redirectToRoute('admin_galleries_show', ['id' => $gallery->getId()]);
        }
        
        return $this->render('admin/galleries/new.html.twig', ['clients' => $clients]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => '\d+'])]
    public function show(Gallery $gallery): Response
    {
        return $this->render('admin/galleries/show.html.twig', ['gallery' => $gallery]);
    }

    #[Route('/{id}/edit', name: 'edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
    public function edit(Gallery $gallery, Request $request): Response
    {
        $clients = $this->clientRepo->findBy([], ['lastName' => 'ASC']);
        
        if ($request->isMethod('POST')) {
            $gallery->setTitle($request->request->get('title'))
                    ->setDescription($request->request->get('description'))
                    ->setDownloadEnabled((bool)$request->request->get('download_enabled'));

            if ($sessionDate = $request->request->get('session_date')) {
                $gallery->setSessionDate(new \DateTime($sessionDate));
            }

            if ($clientId = $request->request->get('client_id')) {
                $client = $this->clientRepo->find($clientId);
                if ($client) {
                    $gallery->setClient($client);
                }
            }

            // Modification manuelle de la date d'expiration (prolongation)
            $expiresAtRaw = $request->request->get('expires_at');
            if ($expiresAtRaw === 'unlimited') {
                $gallery->setExpiresAt(null);
            } elseif ($expiresAtRaw) {
                try {
                    $gallery->setExpiresAt(new \DateTimeImmutable($expiresAtRaw . ' 23:59:59'));
                } catch (\Exception) {}
            }

            $this->em->flush();

            $this->addFlash('success', sprintf('Galerie "%s" mise à jour.', $gallery->getTitle()));

            return $this->redirectToRoute('admin_galleries_show', ['id' => $gallery->getId()]);
        }
        
        return $this->render('admin/galleries/edit.html.twig', [
            'gallery' => $gallery,
            'clients' => $clients,
        ]);
    }

    #[Route('/{id}/upload', name: 'upload', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function upload(Gallery $gallery, Request $request): JsonResponse
    {
        $files = $request->files->get('photos', []);
        if (!is_array($files)) {
            $files = [$files];
        }
        
        $uploaded = [];
        $errors = [];
        
        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            // Fichier rejeté par PHP (dépassement upload_max_filesize, etc.)
            if (!$file->isValid()) {
                $errors[] = $file->getClientOriginalName() . ' — ' . $file->getErrorMessage();
                continue;
            }

            // Vérification du type MIME (après isValid pour éviter les chemins vides)
            $mime = $file->getMimeType() ?? $file->getClientMimeType();
            if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'])) {
                $errors[] = $file->getClientOriginalName() . ' — format non supporté (' . $mime . ').';
                continue;
            }

            try {
                $photo = $this->galleryService->uploadPhoto($gallery, $file);
                $uploaded[] = [
                    'id' => $photo->getId(),
                    'name' => $photo->getOriginalFilename(),
                    'size' => $photo->getFileSizeFormatted(),
                    'url' => $photo->getPublicUrl(),
                ];
            } catch (\Exception $e) {
                $errors[] = $file->getClientOriginalName() . ' — ' . $e->getMessage();
            }
        }
        
        return $this->json([
            'uploaded' => $uploaded,
            'errors' => $errors,
            'total' => $gallery->getPhotoCount(),
        ]);
    }

    #[Route('/{id}/publish', name: 'publish', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function publish(Gallery $gallery, Request $request): Response
    {
        $daysRaw   = $request->request->get('days_valid', '30');
        $daysValid = ($daysRaw === 'unlimited') ? null : (int)$daysRaw;
        $sendEmail = (bool)$request->request->get('send_email', false);

        $this->galleryService->publish($gallery, $daysValid);

        if ($sendEmail) {
            try {
                $this->notificationService->galleryPublished($gallery);
                $this->addFlash('success', sprintf(
                    'Galerie "%s" publiée ! Email envoyé à %s.',
                    $gallery->getTitle(),
                    $gallery->getClient()->getEmail()
                ));
            } catch (\Throwable $e) {
                $this->logger->error('[GalleryController] Erreur email publication', ['error' => $e->getMessage()]);
                $this->addFlash('warning', sprintf(
                    'Galerie publiée, mais l\'email n\'a pas pu être envoyé : %s', $e->getMessage()
                ));
            }
        } else {
            $this->addFlash('success', sprintf('Galerie "%s" publiée.', $gallery->getTitle()));
        }

        return $this->redirectToRoute('admin_galleries_show', ['id' => $gallery->getId()]);
    }

    #[Route('/{id}/resend-notification', name: 'resend_notification', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function resendNotification(Gallery $gallery): Response
    {
        try {
            $this->notificationService->galleryPublished($gallery);
            $this->addFlash('success', sprintf(
                'Email renvoyé à %s.', $gallery->getClient()->getEmail()
            ));
        } catch (\Throwable $e) {
            $this->addFlash('error', 'Erreur lors de l\'envoi : ' . $e->getMessage());
        }

        return $this->redirectToRoute('admin_galleries_show', ['id' => $gallery->getId()]);
    }

    #[Route('/{id}/extend', name: 'extend', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function extend(Gallery $gallery, Request $request): Response
    {
        $daysRaw = $request->request->get('days_valid', '30');

        if ($daysRaw === 'unlimited') {
            $gallery->setExpiresAt(null);
            $this->addFlash('success', 'Accès prolongé indéfiniment.');
        } else {
            $days = (int)$daysRaw;
            $from = max(new \DateTimeImmutable(), $gallery->getExpiresAt() ?? new \DateTimeImmutable());
            $gallery->setExpiresAt(\DateTimeImmutable::createFromInterface($from)->modify("+{$days} days"));
            $this->addFlash('success', sprintf('Accès prolongé de %d jour(s).', $days));
        }

        $this->em->flush();

        return $this->redirectToRoute('admin_galleries_show', ['id' => $gallery->getId()]);
    }

    #[Route('/{id}/regenerate-code', name: 'regenerate_code', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function regenerateCode(Gallery $gallery): Response
    {
        $newCode = $this->galleryService->generateUniqueCode();
        $gallery->setAccessCode($newCode);
        $this->em->flush();
        
        $this->addFlash('success', sprintf('Nouveau code d\'accès : %s', $newCode));
        
        return $this->redirectToRoute('admin_galleries_show', ['id' => $gallery->getId()]);
    }

    #[Route('/{id}/reorder', name: 'reorder', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function reorder(Gallery $gallery, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $photoIds = $data['ids'] ?? [];
        
        $this->galleryService->reorderPhotos($gallery, $photoIds);
        
        return $this->json(['ok' => true]);
    }

    #[Route('/{id}/delete', name: 'delete', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function delete(Gallery $gallery): Response
    {
        $galleryTitle = $gallery->getTitle();
        $galleryId = $gallery->getId();
        $clientEmail = $gallery->getClient()->getEmail();
        
        // ✅ ENVOI DE L'EMAIL AVANT SUPPRESSION (on a encore accès aux données)
        try {
            $this->notificationService->galleryDeleted($gallery);
            $this->logger->info('[GalleryController] Email de suppression envoyé', [
                'gallery_id' => $galleryId,
                'client_email' => $clientEmail,
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('[GalleryController] Erreur envoi email suppression', [
                'gallery_id' => $galleryId,
                'error' => $e->getMessage(),
            ]);
            // On continue quand même la suppression
        }
        
        // Suppression de la galerie
        $this->em->remove($gallery);
        $this->em->flush();
        
        $this->addFlash('success', sprintf('Galerie "%s" supprimée avec succès.', $galleryTitle));
        
        return $this->redirectToRoute('admin_galleries_index');
    }

    #[Route('/photos/{id}/delete', name: 'photo_delete', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function deletePhoto(Photo $photo): JsonResponse
    {
        $galleryId = $photo->getGallery()->getId();
        
        $this->galleryService->deletePhoto($photo);
        
        return $this->json([
            'ok' => true,
            'gallery_id' => $galleryId,
        ]);
    }
}