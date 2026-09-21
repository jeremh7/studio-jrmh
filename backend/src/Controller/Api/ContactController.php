<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\ContactMessage;
use App\Service\NotificationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/contact', name: 'api_contact_', methods: ['POST', 'OPTIONS'])]
final class ContactController extends AbstractController
{
    public function __construct(
        private readonly NotificationService    $notifier,
        private readonly EntityManagerInterface $em,
        private readonly RateLimiterFactory     $contactFormLimiter,
    ) {}

    #[Route('', name: 'send', methods: ['POST'])]
    public function send(Request $request): JsonResponse
    {
        $limiter = $this->contactFormLimiter->create($request->getClientIp());
        if (!$limiter->consume(1)->isAccepted()) {
            return $this->json(['error' => 'Trop de messages envoyés. Réessayez plus tard.'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $data = json_decode($request->getContent(), true);
        if ($data === null) {
            return $this->json(['error' => 'JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        // Honeypot : champ invisible pour les humains, rempli uniquement par les bots.
        // On répond succès sans rien envoyer ni sauvegarder, pour ne pas révéler le piège.
        if (trim((string) ($data['website'] ?? '')) !== '') {
            return $this->json(['success' => true]);
        }

        $name    = trim((string) ($data['name']    ?? ''));
        $email   = trim((string) ($data['email']   ?? ''));
        $subject = trim((string) ($data['subject'] ?? ''));
        $message = trim((string) ($data['message'] ?? ''));

        if ($name === '' || $email === '' || $message === '') {
            return $this->json(['error' => 'Champs requis manquants.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'Email invalide.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (mb_strlen($message) < 10) {
            return $this->json(['error' => 'Message trop court.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $contact = (new ContactMessage())
            ->setName($name)
            ->setEmail($email)
            ->setSubject($subject !== '' ? $subject : null)
            ->setMessage($message);

        $this->em->persist($contact);
        $this->em->flush();

        try {
            $this->notifier->contactMessage($name, $email, $subject, $message);
        } catch (\Throwable) {
            // Email non-bloquant : le message est déjà sauvegardé en BDD
        }

        return $this->json(['success' => true]);
    }
}
