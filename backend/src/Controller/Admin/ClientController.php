<?php

namespace App\Controller\Admin;

use App\Entity\Client;
use App\Repository\ClientRepository;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/admin/clients', name: 'admin_clients_')]
#[IsGranted('ROLE_ADMIN')]
class ClientController extends AbstractController
{
    public function __construct(
        private readonly ClientRepository $clientRepo,
        private readonly NotificationService $notificationService,
        private readonly EntityManagerInterface $em,
        private readonly ValidatorInterface $validator,
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('', name: 'index')]
    public function index(Request $request): Response
    {
        $qb = $this->clientRepo->createQueryBuilder('c')
            ->orderBy('c.createdAt', 'DESC');
        
        if ($q = $request->query->get('q')) {
            $qb->where('c.firstName LIKE :q OR c.lastName LIKE :q OR c.email LIKE :q')
               ->setParameter('q', "%$q%");
        }
        
        return $this->render('admin/clients/index.html.twig', [
            'clients' => $qb->getQuery()->getResult(),
            'search' => $q ?? null,
        ]);
    }

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request): Response
    {
        $client = new Client();
        
        if ($request->isMethod('POST')) {
            $client->setFirstName($request->request->get('first_name'))
                   ->setLastName($request->request->get('last_name'))
                   ->setEmail($request->request->get('email'))
                   ->setPhone($request->request->get('phone'))
                   ->setNotes($request->request->get('notes'));

            $errors = $this->validator->validate($client);
            if (count($errors) > 0) {
                foreach ($errors as $error) {
                    $this->addFlash('error', $error->getMessage());
                }
                return $this->render('admin/clients/new.html.twig', ['client' => $client]);
            }

            // Génère le token d'invitation (72h)
            $client->generatePasswordSetToken();
            $client->setAccountStatus('pending_verification');

            $this->em->persist($client);
            $this->em->flush();

            // Envoi de l'email d'invitation avec lien de création de mot de passe
            try {
                $this->notificationService->clientInvitation($client);
                $this->logger->info('[ClientController] Invitation envoyée', [
                    'client_id' => $client->getId(),
                    'email' => $client->getEmail(),
                ]);
                $this->addFlash('success', sprintf(
                    'Client "%s" créé ! Un email d\'invitation a été envoyé à %s pour qu\'il crée son mot de passe.',
                    $client->getFullName(),
                    $client->getEmail()
                ));
            } catch (\Throwable $e) {
                $this->logger->error('[ClientController] Erreur envoi invitation', [
                    'client_id' => $client->getId(),
                    'error' => $e->getMessage(),
                ]);
                $this->addFlash('warning', sprintf(
                    'Client "%s" créé, mais l\'email d\'invitation n\'a pas pu être envoyé : %s',
                    $client->getFullName(),
                    $e->getMessage()
                ));
            }

            return $this->redirectToRoute('admin_clients_show', ['id' => $client->getId()]);
        }
        
        return $this->render('admin/clients/new.html.twig', ['client' => $client]);
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => '\d+'])]
    public function show(Client $client): Response
    {
        return $this->render('admin/clients/show.html.twig', ['client' => $client]);
    }

    #[Route('/{id}/edit', name: 'edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
    public function edit(Client $client, Request $request): Response
    {
        if ($request->isMethod('POST')) {
            // Mise à jour des données
            $client->setFirstName($request->request->get('first_name'))
                   ->setLastName($request->request->get('last_name'))
                   ->setEmail($request->request->get('email'))
                   ->setPhone($request->request->get('phone'))
                   ->setNotes($request->request->get('notes'));
            
            // Validation
            $errors = $this->validator->validate($client);
            if (count($errors) > 0) {
                foreach ($errors as $error) {
                    $this->addFlash('error', $error->getMessage());
                }
                return $this->render('admin/clients/edit.html.twig', ['client' => $client]);
            }
            
            $this->em->flush();
            
            // ✅ ENVOI DE L'EMAIL DE MISE À JOUR
            try {
                $this->notificationService->clientUpdated($client);
                $this->logger->info('[ClientController] Email de mise à jour envoyé', [
                    'client_id' => $client->getId(),
                    'email' => $client->getEmail(),
                ]);
                $this->addFlash('success', sprintf(
                    'Client "%s" mis à jour ! Email de confirmation envoyé.',
                    $client->getFullName()
                ));
            } catch (\Throwable $e) {
                $this->logger->error('[ClientController] Erreur envoi email mise à jour', [
                    'client_id' => $client->getId(),
                    'error' => $e->getMessage(),
                ]);
                $this->addFlash('warning', sprintf(
                    'Client "%s" mis à jour, mais l\'email n\'a pas pu être envoyé.',
                    $client->getFullName()
                ));
            }
            
            return $this->redirectToRoute('admin_clients_show', ['id' => $client->getId()]);
        }
        
        return $this->render('admin/clients/edit.html.twig', ['client' => $client]);
    }

    #[Route('/{id}/resend-invitation', name: 'resend_invitation', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function resendInvitation(Client $client): Response
    {
        $client->generatePasswordSetToken();
        $this->em->flush();

        try {
            $this->notificationService->clientInvitation($client);
            $this->addFlash('success', sprintf(
                'Invitation renvoyée à %s (lien valable 72h).',
                $client->getEmail()
            ));
        } catch (\Throwable $e) {
            $this->logger->error('[ClientController] Erreur renvoi invitation', [
                'client_id' => $client->getId(),
                'error' => $e->getMessage(),
            ]);
            $this->addFlash('error', 'Impossible d\'envoyer l\'email : ' . $e->getMessage());
        }

        return $this->redirectToRoute('admin_clients_show', ['id' => $client->getId()]);
    }

    #[Route('/{id}/delete', name: 'delete', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function delete(Client $client): Response
    {
        $clientName = $client->getFullName();
        $clientEmail = $client->getEmail();
        $clientId = $client->getId();
        
        // ✅ ENVOI DE L'EMAIL AVANT SUPPRESSION (on a encore les données)
        try {
            $this->notificationService->clientDeleted($clientName, $clientEmail);
            $this->logger->info('[ClientController] Email de suppression envoyé', [
                'client_id' => $clientId,
                'email' => $clientEmail,
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('[ClientController] Erreur envoi email suppression', [
                'client_id' => $clientId,
                'error' => $e->getMessage(),
            ]);
            // On continue quand même la suppression
        }
        
        // Suppression du client
        $this->em->remove($client);
        $this->em->flush();
        
        $this->addFlash('success', sprintf('Client "%s" supprimé avec succès.', $clientName));
        
        return $this->redirectToRoute('admin_clients_index');
    }
}