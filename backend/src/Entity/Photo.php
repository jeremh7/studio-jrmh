<?php
namespace App\Entity;
use App\Repository\PhotoRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PhotoRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Photo
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'photos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Gallery $gallery = null;

    #[ORM\Column(length: 255)]
    private ?string $originalFilename = null;

    #[ORM\Column(length: 255)]
    private ?string $storedFilename = null;

    #[ORM\Column(length: 500)]
    private ?string $path = null;

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $extension = null;

    #[ORM\Column(nullable: true)]
    private ?int $fileSize = null;

    #[ORM\Column(nullable: true)]
    private ?int $width = null;

    #[ORM\Column(nullable: true)]
    private ?int $height = null;

    #[ORM\Column(length: 200, nullable: true)]
    private ?string $caption = null;

    #[ORM\Column]
    private int $sortOrder = 0;

    #[ORM\Column]
    private bool $isFeatured = false;

    // ── Champs V2 ─────────────────────────────────────────────────

    /** Chemin relatif de la version web (1200px WebP) dans var/uploads/ */
    #[ORM\Column(length: 500, nullable: true)]
    private ?string $webPath = null;

    /** Chemin relatif de l'original dans var/private/ (jamais exposé publiquement) */
    #[ORM\Column(length: 500, nullable: true)]
    private ?string $fullPath = null;

    /** Taille de la version web en octets */
    #[ORM\Column(nullable: true)]
    private ?int $webSize = null;

    /** Prix unitaire pour achat à la photo (null = non vendable à l'unité) */
    #[ORM\Column(type: 'decimal', precision: 8, scale: 2, nullable: true)]
    private ?string $unitPrice = null;

    #[ORM\Column(options: ['default' => false])]
    private bool $isPurchasable = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function getId(): ?int { return $this->id; }
    public function getGallery(): ?Gallery { return $this->gallery; }
    public function setGallery(?Gallery $v): static { $this->gallery = $v; return $this; }
    public function getOriginalFilename(): ?string { return $this->originalFilename; }
    public function setOriginalFilename(string $v): static { $this->originalFilename = $v; return $this; }
    public function getStoredFilename(): ?string { return $this->storedFilename; }
    public function setStoredFilename(string $v): static { $this->storedFilename = $v; return $this; }
    public function getPath(): ?string { return $this->path; }
    public function setPath(string $v): static { $this->path = $v; return $this; }
    public function getExtension(): ?string { return $this->extension; }
    public function setExtension(?string $v): static { $this->extension = $v; return $this; }
    public function getFileSize(): ?int { return $this->fileSize; }
    public function setFileSize(?int $v): static { $this->fileSize = $v; return $this; }
    public function getWidth(): ?int { return $this->width; }
    public function setWidth(?int $v): static { $this->width = $v; return $this; }
    public function getHeight(): ?int { return $this->height; }
    public function setHeight(?int $v): static { $this->height = $v; return $this; }
    public function getCaption(): ?string { return $this->caption; }
    public function setCaption(?string $v): static { $this->caption = $v; return $this; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function setSortOrder(int $v): static { $this->sortOrder = $v; return $this; }
    public function isFeatured(): bool { return $this->isFeatured; }
    public function setIsFeatured(bool $v): static { $this->isFeatured = $v; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    public function getWebPath(): ?string { return $this->webPath; }
    public function setWebPath(?string $v): static { $this->webPath = $v; return $this; }
    public function getFullPath(): ?string { return $this->fullPath; }
    public function setFullPath(?string $v): static { $this->fullPath = $v; return $this; }
    public function getWebSize(): ?int { return $this->webSize; }
    public function setWebSize(?int $v): static { $this->webSize = $v; return $this; }
    public function getUnitPrice(): ?string { return $this->unitPrice; }
    public function setUnitPrice(?string $v): static { $this->unitPrice = $v; return $this; }
    public function isPurchasable(): bool { return $this->isPurchasable; }
    public function setIsPurchasable(bool $v): static { $this->isPurchasable = $v; return $this; }
    public function hasFullVersion(): bool { return $this->fullPath !== null; }

    /** URL publique : utilise webPath en V2, path en V1 (compatibilité ascendante) */
    public function getPublicUrl(): string { return '/uploads/' . ($this->webPath ?? $this->path); }
    public function getFileSizeFormatted(): string {
        if ($this->fileSize === null) return '—';
        $kb = $this->fileSize / 1024;
        return $kb > 1024 ? round($kb / 1024, 1) . ' MB' : round($kb) . ' KB';
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void { $this->createdAt = new \DateTimeImmutable(); }
}
