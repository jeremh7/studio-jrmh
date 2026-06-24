<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ClientRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ClientRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['email'], message: 'Cet email est déjà utilisé.')]
class Client implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le prénom est requis.')]
    #[Assert\Length(max: 100)]
    private ?string $firstName = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le nom est requis.')]
    #[Assert\Length(max: 100)]
    private ?string $lastName = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank(message: "L'email est requis.")]
    #[Assert\Email(message: "L'email n'est pas valide.")]
    private ?string $email = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Assert\Length(max: 20)]
    private ?string $phone = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    // ── Champs Auth ──────────────────────────────────────────────

    #[ORM\Column(nullable: true)]
    private ?string $password = null;

    #[ORM\Column]
    private array $roles = ['ROLE_CLIENT'];

    #[ORM\Column(options: ['default' => 0])]
    private int $credits = 0;

    /**
     * Valeurs : 'active' | 'suspended' | 'pending_verification'
     */
    #[ORM\Column(length: 30, options: ['default' => 'active'])]
    private string $accountStatus = 'active';

    #[ORM\Column]
    private bool $isActive = true;

    #[ORM\Column]
    private bool $isVerified = false;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $emailVerifiedAt = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $emailVerificationToken = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lastLoginAt = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $passwordSetToken = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $passwordSetTokenExpiresAt = null;

    // ── Timestamps ───────────────────────────────────────────────

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    // ── Relations ────────────────────────────────────────────────

    #[ORM\OneToMany(
        targetEntity: Gallery::class,
        mappedBy: 'client',
        cascade: ['persist', 'remove']
    )]
    #[ORM\OrderBy(['createdAt' => 'DESC'])]
    private Collection $galleries;

    #[ORM\OneToMany(
        targetEntity: PasswordResetToken::class,
        mappedBy: 'client',
        cascade: ['persist', 'remove'],
        orphanRemoval: true
    )]
    private Collection $passwordResetTokens;

    public function __construct()
    {
        $this->galleries           = new ArrayCollection();
        $this->passwordResetTokens = new ArrayCollection();
    }

    // ── UserInterface ─────────────────────────────────────────────

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles   = $this->roles;
        $roles[] = 'ROLE_CLIENT';

        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function eraseCredentials(): void
    {
        // Pas de plainPassword stocké en propriété, rien à effacer
    }

    // ── Getters / Setters ─────────────────────────────────────────

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;

        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;

        return $this;
    }

    public function getFullName(): string
    {
        return trim($this->firstName . ' ' . $this->lastName);
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;

        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

        return $this;
    }

    public function getCredits(): int
    {
        return $this->credits;
    }

    public function setCredits(int $credits): static
    {
        $this->credits = max(0, $credits);

        return $this;
    }

    public function addCredits(int $amount): static
    {
        return $this->setCredits($this->credits + $amount);
    }

    public function getAccountStatus(): string
    {
        return $this->accountStatus;
    }

    public function setAccountStatus(string $status): static
    {
        $this->accountStatus = $status;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function isVerified(): bool
    {
        return $this->isVerified;
    }

    public function setIsVerified(bool $isVerified): static
    {
        $this->isVerified = $isVerified;

        return $this;
    }

    public function getEmailVerifiedAt(): ?\DateTimeImmutable
    {
        return $this->emailVerifiedAt;
    }

    public function setEmailVerifiedAt(?\DateTimeImmutable $emailVerifiedAt): static
    {
        $this->emailVerifiedAt = $emailVerifiedAt;

        return $this;
    }

    public function getEmailVerificationToken(): ?string
    {
        return $this->emailVerificationToken;
    }

    public function generateEmailVerificationToken(): string
    {
        $this->emailVerificationToken = bin2hex(random_bytes(32));

        return $this->emailVerificationToken;
    }

    public function clearEmailVerificationToken(): static
    {
        $this->emailVerificationToken = null;

        return $this;
    }

    public function markEmailAsVerified(): static
    {
        $this->isVerified      = true;
        $this->emailVerifiedAt = new \DateTimeImmutable();
        $this->emailVerificationToken = null;

        return $this;
    }

    public function getLastLoginAt(): ?\DateTimeImmutable
    {
        return $this->lastLoginAt;
    }

    public function setLastLoginAt(?\DateTimeImmutable $lastLoginAt): static
    {
        $this->lastLoginAt = $lastLoginAt;

        return $this;
    }

    public function getPasswordSetToken(): ?string
    {
        return $this->passwordSetToken;
    }

    public function generatePasswordSetToken(): string
    {
        $this->passwordSetToken = bin2hex(random_bytes(32));
        $this->passwordSetTokenExpiresAt = new \DateTimeImmutable('+72 hours');

        return $this->passwordSetToken;
    }

    public function clearPasswordSetToken(): static
    {
        $this->passwordSetToken = null;
        $this->passwordSetTokenExpiresAt = null;

        return $this;
    }

    public function isPasswordSetTokenValid(): bool
    {
        return $this->passwordSetToken !== null
            && $this->passwordSetTokenExpiresAt !== null
            && $this->passwordSetTokenExpiresAt > new \DateTimeImmutable();
    }

    public function getPasswordSetTokenExpiresAt(): ?\DateTimeImmutable
    {
        return $this->passwordSetTokenExpiresAt;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    // ── Relations ─────────────────────────────────────────────────

    public function getGalleries(): Collection
    {
        return $this->galleries;
    }

    public function addGallery(Gallery $gallery): static
    {
        if (!$this->galleries->contains($gallery)) {
            $this->galleries->add($gallery);
            $gallery->setClient($this);
        }

        return $this;
    }

    public function removeGallery(Gallery $gallery): static
    {
        $this->galleries->removeElement($gallery);

        return $this;
    }

    public function getPasswordResetTokens(): Collection
    {
        return $this->passwordResetTokens;
    }

    // ── Lifecycle Callbacks ───────────────────────────────────────

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}