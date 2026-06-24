<?php

declare(strict_types=1);

namespace App\Controller\Admin;

use App\Repository\ContactMessageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/contact', name: 'admin_contact_')]
#[IsGranted('ROLE_ADMIN')]
class ContactController extends AbstractController
{
    public function __construct(
        private readonly ContactMessageRepository $repo,
        private readonly EntityManagerInterface   $em,
    ) {}

    #[Route('', name: 'index')]
    public function index(Request $request): Response
    {
        $filter = $request->query->get('filter', 'all'); // all | unread | read
        $q      = $request->query->get('q', '');

        $qb = $this->repo->createQueryBuilder('c')
            ->orderBy('c.createdAt', 'DESC');

        if ($filter === 'unread') {
            $qb->andWhere('c.isRead = false');
        } elseif ($filter === 'read') {
            $qb->andWhere('c.isRead = true');
        }

        if ($q !== '') {
            $qb->andWhere('c.name LIKE :q OR c.email LIKE :q OR c.subject LIKE :q OR c.message LIKE :q')
               ->setParameter('q', "%$q%");
        }

        return $this->render('admin/contact/index.html.twig', [
            'messages' => $qb->getQuery()->getResult(),
            'filter'   => $filter,
            'search'   => $q,
            'unread'   => $this->repo->countUnread(),
        ]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => '\d+'])]
    public function show(int $id): Response
    {
        $contact = $this->repo->find($id);
        if (!$contact) {
            throw $this->createNotFoundException('Message introuvable.');
        }

        if (!$contact->isRead()) {
            $contact->setRead(true);
            $this->em->flush();
        }

        return $this->render('admin/contact/show.html.twig', [
            'contact' => $contact,
            'unread'  => $this->repo->countUnread(),
        ]);
    }

    #[Route('/{id}/delete', name: 'delete', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function delete(int $id, Request $request): Response
    {
        $contact = $this->repo->find($id);
        if (!$contact) {
            throw $this->createNotFoundException();
        }

        if ($this->isCsrfTokenValid('delete_contact_' . $id, $request->request->get('_token'))) {
            $this->em->remove($contact);
            $this->em->flush();
            $this->addFlash('success', 'Message supprimé.');
        }

        return $this->redirectToRoute('admin_contact_index');
    }

    #[Route('/{id}/toggle-read', name: 'toggle_read', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function toggleRead(int $id, Request $request): Response
    {
        $contact = $this->repo->find($id);
        if (!$contact) {
            throw $this->createNotFoundException();
        }

        if ($this->isCsrfTokenValid('toggle_' . $id, $request->request->get('_token'))) {
            $contact->setRead(!$contact->isRead());
            $this->em->flush();
        }

        return $this->redirectToRoute('admin_contact_show', ['id' => $id]);
    }
}
