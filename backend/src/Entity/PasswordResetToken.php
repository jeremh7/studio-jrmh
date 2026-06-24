<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\PasswordResetTokenRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PasswordResetTokenRepository::class)]
#[ORM\HasLifecycleCallbacks]
class PasswordResetToken
{
    // Durée de validité du token : 1 heure
    public const TTL_SECONDS = 3600;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'passwordResetTokens')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Client $client = null;

    #[ORM\Column(length: 100, unique: true)]
    private ?string $token = null;

    #[ORM\Column]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column]
    private bool $used = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    // ── Getters / Setters ─────────────────────────────────────────

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getClient(): ?Client
    {
        return $this->client;
    }

    public function setClient(?Client $client): static
    {
        $this->client = $client;

        return $this;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(string $token): static
    {
        $this->token = $token;

        return $this;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;

        return $this;
    }

    public function isUsed(): bool
    {
        return $this->used;
    }

    public function setUsed(bool $used): static
    {
        $this->used = $used;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    // ── Méthodes métier ───────────────────────────────────────────

    public function isExpired(): bool
    {
        return $this->expiresAt < new \DateTimeImmutable();
    }

    public function isValid(): bool
    {
        return !$this->used && !$this->isExpired();
    }

    public static function generate(Client $client): self
    {
        $token = new self();
        $token->setClient($client);
        $token->setToken(bin2hex(random_bytes(32)));
        $token->setExpiresAt(
            new \DateTimeImmutable('+' . self::TTL_SECONDS . ' seconds')
        );

        return $token;
    }

    // ── Lifecycle Callbacks ───────────────────────────────────────

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }
}