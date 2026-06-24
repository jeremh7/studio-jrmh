<?php

namespace App\Entity;

use App\Repository\ProjectPhotoRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProjectPhotoRepository::class)]
#[ORM\HasLifecycleCallbacks]
class ProjectPhoto
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'photos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Project $project = null;

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

    /** Photo mise en avant dans la grille du projet */
    #[ORM\Column]
    private bool $isCover = false;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    public function getId(): ?int { return $this->id; }
    public function getProject(): ?Project { return $this->project; }
    public function setProject(?Project $project): static { $this->project = $project; return $this; }
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
    public function isCover(): bool { return $this->isCover; }
    public function setIsCover(bool $v): static { $this->isCover = $v; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getPublicUrl(): string { return '/uploads/' . $this->path; }
    public function getFileSizeFormatted(): string
    {
        if (!$this->fileSize) return '—';
        $kb = $this->fileSize / 1024;
        return $kb > 1024 ? round($kb / 1024, 1) . ' MB' : round($kb) . ' KB';
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void { $this->createdAt = new \DateTimeImmutable(); }
}
