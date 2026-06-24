<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\Client;
use App\Entity\PasswordResetToken;
use App\Repository\ClientRepository;
use App\Repository\PasswordResetTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Service\NotificationService;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth', name: 'api_auth_')]
final class AuthController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface       $em,
        private readonly UserPasswordHasherInterface  $hasher,
        private readonly JWTTokenManagerInterface     $jwtManager,
        private readonly ValidatorInterface           $validator,
        private readonly NotificationService          $notifier,
        private readonly ClientRepository             $clientRepository,
        private readonly PasswordResetTokenRepository $resetTokenRepository,
    ) {}

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────────────────────
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $data = $this->decodeJson($request);
        if ($data === null) {
            return $this->jsonError('JSON invalide.', Response::HTTP_BAD_REQUEST);
        }

        $email    = trim((string) ($data['email']    ?? ''));
        $password = trim((string) ($data['password'] ?? ''));

        if ($email === '' || $password === '') {
            return $this->jsonError(
                'Email et mot de passe requis.',
                Response::HTTP_BAD_REQUEST
            );
        }

        $client = $this->clientRepository->findOneBy(['email' => $email]);

        // Message générique volontaire (ne pas révéler si l'email existe)
        // getPassword() peut être null si le client n'a pas encore finalisé son invitation
        if ($client === null || $client->getPassword() === null || !$this->hasher->isPasswordValid($client, $password)) {
            return $this->jsonError(
                'Identifiants invalides.',
                Response::HTTP_UNAUTHORIZED
            );
        }

        if (!$client->isActive()) {
            return $this->jsonError(
                'Votre compte est désactivé. Contactez le studio.',
                Response::HTTP_FORBIDDEN
            );
        }

        // Mise à jour de la date de dernière connexion
        $client->setLastLoginAt(new \DateTimeImmutable());
        $this->em->flush();

        $token = $this->jwtManager->create($client);

        return $this->json([
            'token'  => $token,
            'client' => $this->serializeClient($client),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/forgot-password
    // ─────────────────────────────────────────────────────────────
    #[Route('/forgot-password', name: 'forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        $data  = $this->decodeJson($request);
        $email = trim((string) ($data['email'] ?? ''));

        // Réponse identique que l'email existe ou non (sécurité anti-énumération)
        $genericResponse = $this->json([
            'message' => 'Si cet email existe, un lien de réinitialisation vous a été envoyé.',
        ]);

        if ($email === '') {
            return $genericResponse;
        }

        $client = $this->clientRepository->findOneBy(['email' => $email]);
        if ($client === null || !$client->isActive()) {
            return $genericResponse;
        }

        // Invalider les anciens tokens non utilisés
        $this->resetTokenRepository->invalidateForClient($client);

        $resetToken = PasswordResetToken::generate($client);
        $this->em->persist($resetToken);
        $this->em->flush();

        $this->notifier->clientPasswordReset($client, $resetToken->getToken());

        return $genericResponse;
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/reset-password
    // ─────────────────────────────────────────────────────────────
    #[Route('/reset-password', name: 'reset_password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        $data     = $this->decodeJson($request);
        $tokenStr = trim((string) ($data['token']    ?? ''));
        $password = trim((string) ($data['password'] ?? ''));

        if ($tokenStr === '' || $password === '') {
            return $this->jsonError(
                'Token et nouveau mot de passe requis.',
                Response::HTTP_BAD_REQUEST
            );
        }

        $resetToken = $this->resetTokenRepository->findOneBy(['token' => $tokenStr]);

        if ($resetToken === null || !$resetToken->isValid()) {
            return $this->jsonError(
                'Token invalide ou expiré.',
                Response::HTTP_BAD_REQUEST
            );
        }

        if (!$this->isPasswordStrong($password)) {
            return $this->jsonError(
                'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.',
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $client = $resetToken->getClient();
        $client->setPassword($this->hasher->hashPassword($client, $password));

        $resetToken->setUsed(true);

        $this->em->flush();

        // Confirmation de sécurité (silent)
        $this->notifier->clientPasswordChanged($client);

        return $this->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/set-password  — invitation admin, premier mot de passe
    // ─────────────────────────────────────────────────────────────
    #[Route('/set-password', name: 'set_password', methods: ['POST'])]
    public function setPassword(Request $request): JsonResponse
    {
        $data     = $this->decodeJson($request);
        $tokenStr = trim((string) ($data['token']    ?? ''));
        $password = trim((string) ($data['password'] ?? ''));

        if ($tokenStr === '' || $password === '') {
            return $this->jsonError('Token et mot de passe requis.', Response::HTTP_BAD_REQUEST);
        }

        $client = $this->clientRepository->findOneBy(['passwordSetToken' => $tokenStr]);

        if ($client === null || !$client->isPasswordSetTokenValid()) {
            return $this->jsonError('Lien invalide ou expiré.', Response::HTTP_BAD_REQUEST);
        }

        if (!$this->isPasswordStrong($password)) {
            return $this->jsonError(
                'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.',
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $client->setPassword($this->hasher->hashPassword($client, $password));
        $client->clearPasswordSetToken();
        $client->setIsVerified(true);
        $client->setAccountStatus('active');

        $this->em->flush();

        // Bienvenue officiel : compte maintenant actif (non bloquant)
        try {
            $this->notifier->clientCreated($client);
        } catch (\Throwable) {}

        $jwtToken = $this->jwtManager->create($client);

        return $this->json([
            'message' => 'Mot de passe créé avec succès.',
            'token'   => $jwtToken,
            'client'  => $this->serializeClient($client),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/auth/verify-email?token=xxx  — lien cliqué depuis email
    // ─────────────────────────────────────────────────────────────
    #[Route('/verify-email', name: 'verify_email', methods: ['GET'])]
    public function verifyEmail(Request $request): JsonResponse
    {
        $token = trim((string) $request->query->get('token', ''));

        if ($token === '') {
            return $this->jsonError('Token manquant.', Response::HTTP_BAD_REQUEST);
        }

        $client = $this->clientRepository->findOneBy(['emailVerificationToken' => $token]);

        if ($client === null) {
            return $this->jsonError('Token invalide ou déjà utilisé.', Response::HTTP_BAD_REQUEST);
        }

        if ($client->isVerified()) {
            return $this->json(['message' => 'Adresse email déjà vérifiée.']);
        }

        $client->markEmailAsVerified();
        $client->setAccountStatus('active');
        $this->em->flush();

        return $this->json(['message' => 'Adresse email confirmée avec succès.']);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/auth/resend-verification  — renvoyer l'email de vérification
    // ─────────────────────────────────────────────────────────────
    #[Route('/resend-verification', name: 'resend_verification', methods: ['POST'])]
    public function resendVerification(Request $request): JsonResponse
    {
        $data  = $this->decodeJson($request);
        $email = trim((string) ($data['email'] ?? ''));

        // Réponse générique anti-énumération
        $genericResponse = $this->json([
            'message' => 'Si ce compte existe et n\'est pas encore vérifié, un nouvel email a été envoyé.',
        ]);

        if ($email === '') {
            return $genericResponse;
        }

        $client = $this->clientRepository->findOneBy(['email' => $email]);

        if ($client === null || $client->isVerified() || !$client->isActive()) {
            return $genericResponse;
        }

        $client->generateEmailVerificationToken();
        $this->em->flush();

        $this->notifier->clientEmailVerify($client);

        return $genericResponse;
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/auth/me  — route protégée, nécessite JWT valide
    // ─────────────────────────────────────────────────────────────
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var Client $client */
        $client = $this->getUser();

        if (!$client instanceof Client) {
            return $this->jsonError('Non authentifié.', Response::HTTP_UNAUTHORIZED);
        }

        return $this->json(['client' => $this->serializeClient($client)]);
    }

    // ─────────────────────────────────────────────────────────────
    // Méthodes privées
    // ─────────────────────────────────────────────────────────────

    private function decodeJson(Request $request): ?array
    {
        if (empty($request->getContent())) {
            return [];
        }

        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        return is_array($data) ? $data : null;
    }

    private function jsonError(string $message, int $status): JsonResponse
    {
        return $this->json(['error' => $message], $status);
    }

    private function jsonValidationErrors(\Symfony\Component\Validator\ConstraintViolationListInterface $errors): JsonResponse
    {
        $messages = [];
        foreach ($errors as $error) {
            $messages[$error->getPropertyPath()] = $error->getMessage();
        }

        return $this->json(['errors' => $messages], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    private function isPasswordStrong(string $password): bool
    {
        return strlen($password) >= 8
            && preg_match('/[A-Z]/', $password)
            && preg_match('/[0-9]/', $password);
    }

    private function serializeClient(Client $client): array
    {
        return [
            'id'              => $client->getId(),
            'email'           => $client->getEmail(),
            'firstName'       => $client->getFirstName(),
            'lastName'        => $client->getLastName(),
            'fullName'        => $client->getFullName(),
            'phone'           => $client->getPhone(),
            'credits'         => $client->getCredits(),
            'accountStatus'   => $client->getAccountStatus(),
            'isVerified'      => $client->isVerified(),
            'emailVerifiedAt' => $client->getEmailVerifiedAt()?->format(\DateTimeInterface::ATOM),
            'createdAt'       => $client->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'lastLoginAt'     => $client->getLastLoginAt()?->format(\DateTimeInterface::ATOM),
        ];
    }

}