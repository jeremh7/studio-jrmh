<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Entity\Gallery;
use App\Repository\ClientRepository;
use App\Repository\ContactMessageRepository;
use App\Repository\GalleryRepository;
use App\Repository\PhotoRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin', name: 'admin_')]
#[IsGranted('ROLE_ADMIN')]
class DashboardController extends AbstractController
{
    public function __construct(
        private readonly GalleryRepository        $galleryRepo,
        private readonly ClientRepository         $clientRepo,
        private readonly PhotoRepository          $photoRepo,
        private readonly ContactMessageRepository $contactRepo,
    ) {}

    #[Route('', name: 'dashboard')]
    public function dashboard(): Response
    {
        return $this->render('admin/dashboard.html.twig', [
            'stats' => [
                'galleries'        => $this->galleryRepo->count([]),
                'active_galleries' => $this->galleryRepo->count(['status' => Gallery::STATUS_ACTIVE]),
                'clients'          => $this->clientRepo->count([]),
                'photos'           => $this->photoRepo->count([]),
                'messages'         => $this->contactRepo->count([]),
                'unread_messages'  => $this->contactRepo->countUnread(),
            ],
            'recentGalleries' => $this->galleryRepo->findBy([], ['createdAt' => 'DESC'], 5),
            'recentClients'   => $this->clientRepo->findBy([], ['createdAt' => 'DESC'], 5),
            'recentMessages'  => $this->contactRepo->findBy([], ['createdAt' => 'DESC'], 5),
        ]);
    }
}
