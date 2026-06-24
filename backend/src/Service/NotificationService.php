<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Client;
use App\Entity\Gallery;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Twig\Environment;
use Twig\Error\Error as TwigError;

final class NotificationService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly Environment    $twig,
        private readonly LoggerInterface $logger,
        private readonly string $adminEmail,
        private readonly string $mailerFrom,
        private readonly string $mailerFromName,
        private readonly string $frontendUrl,
        private readonly string $mailerRedirectTo = '',
    ) {}

    // ── Clients — Admin ───────────────────────────────────────────

    public function clientInvitation(Client $client): void
    {
        $vars = [
            'client'      => $client,
            'setPasswordUrl' => sprintf(
                '%s/set-password?token=%s',
                $this->frontendUrl,
                $client->getPasswordSetToken()
            ),
            'expiresAt' => $client->getPasswordSetTokenExpiresAt(),
        ];

        $this->send($client->getEmail(), $client->getFullName(),
            'Votre accès Studiø JRMH — Créez votre mot de passe',
            'emails/client_invitation.html.twig', $vars);

        $this->send($this->adminEmail, 'Admin JRMH',
            '[Admin] Invitation envoyée — ' . $client->getFullName(),
            'emails/client_invitation_admin.html.twig', $vars);
    }

    public function clientCreated(Client $client): void
    {
        $vars = [
            'client'    => $client,
            'accessUrl' => $this->frontendUrl . '/client',
        ];

        $this->send($client->getEmail(), $client->getFullName(),
            'Bienvenue chez Studiø JRMH',
            'emails/client_created_client.html.twig', $vars);

        $this->send($this->adminEmail, 'Admin JRMH',
            '[Admin] Nouveau client — ' . $client->getFullName(),
            'emails/client_created_admin.html.twig', $vars);
    }

    public function clientUpdated(Client $client): void
    {
        $vars = ['client' => $client];

        $this->send($client->getEmail(), $client->getFullName(),
            'Vos informations ont été mises à jour — Studiø JRMH',
            'emails/client_updated_client.html.twig', $vars);

        $this->send($this->adminEmail, 'Admin JRMH',
            '[Admin] Client modifié — ' . $client->getFullName(),
            'emails/client_updated_admin.html.twig', $vars);
    }

    public function clientDeleted(string $clientName, string $clientEmail): void
    {
        $vars = ['clientName' => $clientName, 'clientEmail' => $clientEmail];

        $this->send($clientEmail, $clientName,
            'Votre espace client a été supprimé — Studiø JRMH',
            'emails/client_deleted_client.html.twig', $vars);

        $this->send($this->adminEmail, 'Admin JRMH',
            '[Admin] Client supprimé — ' . $clientName,
            'emails/client_deleted_admin.html.twig', $vars);
    }

    // ── Auth — inscription et mot de passe ────────────────────────

    /**
     * Email de vérification d'adresse email après inscription.
     */
    public function clientEmailVerify(Client $client): void
    {
        $vars = [
            'client'    => $client,
            'verifyUrl' => sprintf(
                '%s/client/verify-email?token=%s',
                $this->frontendUrl,
                $client->getEmailVerificationToken()
            ),
        ];

        $this->send($client->getEmail(), $client->getFullName(),
            'Confirmez votre adresse email — Studiø JRMH',
            'emails/client_email_verify.html.twig', $vars,
            silent: true);
    }

    /**
     * Email de réinitialisation de mot de passe.
     */
    public function clientPasswordReset(Client $client, string $token): void
    {
        $vars = [
            'client'   => $client,
            'resetUrl' => sprintf('%s/reset-password?token=%s', $this->frontendUrl, $token),
        ];

        $this->send($client->getEmail(), $client->getFullName(),
            'Réinitialisation de votre mot de passe — Studiø JRMH',
            'emails/client_password_reset.html.twig', $vars);
    }

    // ── Galeries ──────────────────────────────────────────────────

    public function galleryPublished(Gallery $gallery): void
    {
        $client = $gallery->getClient();
        $vars   = [
            'gallery'   => $gallery,
            'client'    => $client,
            'accessUrl' => $this->frontendUrl . '/client/gallery/' . $gallery->getId(),
        ];

        $this->send($client->getEmail(), $client->getFullName(),
            'Votre galerie "' . $gallery->getTitle() . '" est disponible — Studiø JRMH',
            'emails/gallery_published_client.html.twig', $vars);

        $this->send($this->adminEmail, 'Admin JRMH',
            '[Admin] Galerie publiée — ' . $gallery->getTitle(),
            'emails/gallery_published_admin.html.twig', $vars);
    }

    public function galleryDeleted(Gallery $gallery): void
    {
        $client = $gallery->getClient();
        $vars   = [
            'gallery'      => $gallery,
            'galleryTitle' => $gallery->getTitle(),
            'client'       => $client,
        ];

        $this->send($client->getEmail(), $client->getFullName(),
            'Votre galerie "' . $gallery->getTitle() . '" a été supprimée',
            'emails/gallery_deleted_client.html.twig', $vars);

        $this->send($this->adminEmail, 'Admin JRMH',
            '[Admin] Galerie supprimée — ' . $gallery->getTitle(),
            'emails/gallery_deleted_admin.html.twig', $vars);
    }

    // ── Sécurité — mot de passe ──────────────────────────────────

    public function clientPasswordChanged(Client $client): void
    {
        $vars = [
            'client'   => $client,
            'loginUrl' => $this->frontendUrl . '/login',
        ];

        $this->send($client->getEmail(), $client->getFullName(),
            'Votre mot de passe a été modifié — Studiø JRMH',
            'emails/client_password_changed.html.twig', $vars,
            silent: true);
    }

    // ── Contact public ───────────────────────────────────────────

    public function contactMessage(string $senderName, string $senderEmail, string $subject, string $message): void
    {
        $vars = [
            'senderName'  => $senderName,
            'senderEmail' => $senderEmail,
            'subject'     => $subject,
            'message'     => $message,
        ];

        $this->send($this->adminEmail, 'Studiø JRMH',
            '[Contact] ' . ($subject ?: 'Nouveau message') . ' — ' . $senderName,
            'emails/contact_message.html.twig', $vars);

        // Accusé de réception à l'expéditeur (silent)
        $confirmVars = [
            'senderName'   => $senderName,
            'subject'      => $subject,
            'message'      => $message,
            'portfolioUrl' => $this->frontendUrl . '/work',
        ];

        $this->send($senderEmail, $senderName,
            'Message bien reçu — Studiø JRMH',
            'emails/contact_confirmation.html.twig', $confirmVars,
            silent: true);
    }

    // ── Envoi interne ─────────────────────────────────────────────

    /**
     * @param bool $silent  Si true, les erreurs sont loguées sans relancer l'exception.
     */
    private function send(
        string $to,
        string $toName,
        string $subject,
        string $template,
        array  $vars   = [],
        bool   $silent = false,
    ): void {
        try {
            $html = $this->twig->render($template, $vars);

            // Redirection dev : si MAILER_REDIRECT_TO est défini, tous les emails
            // partent vers cette adresse (Resend sans domaine vérifié).
            $actualTo   = $this->mailerRedirectTo !== '' ? $this->mailerRedirectTo : $to;
            $actualName = $this->mailerRedirectTo !== '' ? 'Studio JRMH (dev)' : $toName;

            $email = (new Email())
                ->from(sprintf('"%s" <%s>', $this->mailerFromName, $this->mailerFrom))
                ->to(sprintf('"%s" <%s>', $actualName, $actualTo))
                ->subject($subject)
                ->html($html);

            $this->mailer->send($email);

            $this->logger->info('[Mailer] Envoyé', [
                'to'      => $actualTo,
                'original_to' => $to,
                'subject' => $subject,
            ]);

        } catch (TransportExceptionInterface $e) {
            $this->logger->error('[Mailer] Erreur transport', [
                'to'      => $to,
                'subject' => $subject,
                'error'   => $e->getMessage(),
                'debug'   => $e->getDebug(),
            ]);
            if (!$silent) {
                throw $e;
            }
        } catch (TwigError $e) {
            $this->logger->error('[Mailer] Erreur template Twig', [
                'template' => $template,
                'error'    => $e->getMessage(),
            ]);
            if (!$silent) {
                throw $e;
            }
        } catch (\Throwable $e) {
            $this->logger->error('[Mailer] Erreur inattendue', [
                'to'    => $to,
                'type'  => $e::class,
                'error' => $e->getMessage(),
            ]);
            if (!$silent) {
                throw $e;
            }
        }
    }
}
