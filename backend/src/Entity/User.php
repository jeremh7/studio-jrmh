<?php
namespace App\Entity;
use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['email'], message: 'Cet email est déjà utilisé.')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Assert\NotBlank, Assert\Email]
    private ?string $email = null;

    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $firstName = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $lastName = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lastLoginAt = null;

    #[ORM\Column]
    private bool $isActive = true;

    public function getId(): ?int { return $this->id; }
    public function getEmail(): ?string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }
    public function getUserIdentifier(): string { return (string) $this->email; }
    public function getRoles(): array { $r = $this->roles; $r[] = 'ROLE_USER'; return array_unique($r); }
    public function setRoles(array $roles): static { $this->roles = $roles; return $this; }
    public function getPassword(): ?string { return $this->password; }
    public function setPassword(string $password): static { $this->password = $password; return $this; }
    public function eraseCredentials(): void {}
    public function getFirstName(): ?string { return $this->firstName; }
    public function setFirstName(?string $v): static { $this->firstName = $v; return $this; }
    public function getLastName(): ?string { return $this->lastName; }
    public function setLastName(?string $v): static { $this->lastName = $v; return $this; }
    public function getFullName(): string { return trim(($this->firstName ?? '') . ' ' . ($this->lastName ?? '')) ?: $this->email; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getLastLoginAt(): ?\DateTimeImmutable { return $this->lastLoginAt; }
    public function setLastLoginAt(?\DateTimeImmutable $v): static { $this->lastLoginAt = $v; return $this; }
    public function isActive(): bool { return $this->isActive; }
    public function setIsActive(bool $v): static { $this->isActive = $v; return $this; }
    public function isAdmin(): bool { return in_array('ROLE_ADMIN', $this->getRoles()); }

    #[ORM\PrePersist]
    public function onPrePersist(): void { $this->createdAt = new \DateTimeImmutable(); }
}
