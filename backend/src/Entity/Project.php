<?php

namespace App\Entity;

use App\Repository\ProjectRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ProjectRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Project
{
    public const CATEGORIES = ['sport', 'portrait', 'studio', 'street', 'evenementiel', 'editorial'];
    public const STATUS_DRAFT     = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED  = 'archived';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 200)]
    #[Assert\NotBlank(message: 'Le titre est requis.')]
    private ?string $title = null;

    /** Slug URL — généré automatiquement depuis le titre */
    #[ORM\Column(length: 220, unique: true)]
    private ?string $slug = null;

    #[ORM\Column(length: 50)]
    #[Assert\Choice(choices: Project::CATEGORIES)]
    private string $category = 'sport';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $eventDate = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $location = null;

    /** Nom de fichier de la photo de couverture */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $coverImage = null;

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_DRAFT;

    /** Ordre d'affichage sur la page Work */
    #[ORM\Column]
    private int $sortOrder = 0;

    #[ORM\Column]
    private bool $featured = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $publishedAt = null;

    /** @var Collection<int, ProjectPhoto> */
    #[ORM\OneToMany(targetEntity: ProjectPhoto::class, mappedBy: 'project', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['sortOrder' => 'ASC'])]
    private Collection $photos;

    public function __construct()
    {
        $this->photos = new ArrayCollection();
    }

    // ── Getters / Setters ──────────────────────────────────────────

    public function getId(): ?int { return $this->id; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $title): static
    {
        $this->title = $title;
        if (!$this->slug) {
            $this->slug = $this->generateSlug($title);
        }
        return $this;
    }

    public function getSlug(): ?string { return $this->slug; }
    public function setSlug(string $slug): static { $this->slug = $slug; return $this; }

    public function getCategory(): string { return $this->category; }
    public function setCategory(string $category): static { $this->category = $category; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getEventDate(): ?\DateTimeInterface { return $this->eventDate; }
    public function setEventDate(?\DateTimeInterface $eventDate): static { $this->eventDate = $eventDate; return $this; }

    public function getLocation(): ?string { return $this->location; }
    public function setLocation(?string $location): static { $this->location = $location; return $this; }

    public function getCoverImage(): ?string { return $this->coverImage; }
    public function setCoverImage(?string $coverImage): static { $this->coverImage = $coverImage; return $this; }
    public function getCoverImageUrl(): ?string { return $this->coverImage ? '/uploads/projects/' . $this->id . '/' . $this->coverImage : null; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getSortOrder(): int { return $this->sortOrder; }
    public function setSortOrder(int $sortOrder): static { $this->sortOrder = $sortOrder; return $this; }

    public function isFeatured(): bool { return $this->featured; }
    public function setFeatured(bool $featured): static { $this->featured = $featured; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getPublishedAt(): ?\DateTimeImmutable { return $this->publishedAt; }
    public function setPublishedAt(?\DateTimeImmutable $publishedAt): static { $this->publishedAt = $publishedAt; return $this; }

    public function getPhotos(): Collection { return $this->photos; }
    public function getPhotoCount(): int { return $this->photos->count(); }

    public function addPhoto(ProjectPhoto $photo): static
    {
        if (!$this->photos->contains($photo)) {
            $this->photos->add($photo);
            $photo->setProject($this);
        }
        return $this;
    }

    public function removePhoto(ProjectPhoto $photo): static
    {
        if ($this->photos->removeElement($photo)) {
            if ($photo->getProject() === $this) $photo->setProject(null);
        }
        return $this;
    }

    public function publish(): static
    {
        $this->status = self::STATUS_PUBLISHED;
        $this->publishedAt = new \DateTimeImmutable();
        return $this;
    }

    public function getCategoryLabel(): string
    {
        return match ($this->category) {
            'sport'         => 'Sport',
            'portrait'      => 'Portrait',
            'studio'        => 'Studio',
            'street'        => 'Street',
            'evenementiel'  => 'Événementiel',
            'editorial'     => 'Éditorial',
            default         => ucfirst($this->category),
        };
    }

    private function generateSlug(string $title): string
    {
        $slug = strtolower($title);
        $slug = iconv('UTF-8', 'ASCII//TRANSLIT', $slug);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        return $slug;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        if (!$this->slug && $this->title) {
            $this->slug = $this->generateSlug($this->title);
        }
    }
}
