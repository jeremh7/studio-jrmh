<?php
namespace App\Entity;
use App\Repository\GalleryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: GalleryRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Gallery
{
    const STATUS_DRAFT    = 'draft';
    const STATUS_ACTIVE   = 'active';
    const STATUS_EXPIRED  = 'expired';
    const STATUS_ARCHIVED = 'archived';

    // deliveryMode
    const DELIVERY_WEB_ONLY = 'web_only';
    const DELIVERY_FULL_HD  = 'full_hd';
    const DELIVERY_MIXED    = 'mixed';

    // watermarkLevel
    const WATERMARK_NONE   = 'none';
    const WATERMARK_SUBTLE = 'subtle';
    const WATERMARK_STRONG = 'strong';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'galleries')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Client $client = null;

    #[ORM\Column(length: 200)]
    private ?string $title = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 20, unique: true)]
    private ?string $accessCode = null;

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_DRAFT;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $sessionDate = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $expiresAt = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $publishedAt = null;

    #[ORM\Column]
    private int $viewCount = 0;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $lastAccessAt = null;

    #[ORM\Column]
    private bool $downloadEnabled = true;

    #[ORM\Column]
    private bool $watermarkEnabled = false;

    // ── Champs V2 ─────────────────────────────────────────────────

    /** web_only | full_hd | mixed */
    #[ORM\Column(length: 20, options: ['default' => 'web_only'])]
    private string $deliveryMode = self::DELIVERY_WEB_ONLY;

    /** Prix de mise à niveau vers la version HD (nullable = non proposé) */
    #[ORM\Column(type: 'decimal', precision: 8, scale: 2, nullable: true)]
    private ?string $upgradePrice = null;

    /** none | subtle | strong */
    #[ORM\Column(length: 20, options: ['default' => 'none'])]
    private string $watermarkLevel = self::WATERMARK_NONE;

    #[ORM\Column(options: ['default' => false])]
    private bool $allowIndividualPurchase = false;

    /** Token de partage public — 32 chars hex, distinct du code d'accès client */
    #[ORM\Column(length: 64, nullable: true, unique: true)]
    private ?string $shareToken = null;

    #[ORM\OneToMany(targetEntity: Photo::class, mappedBy: 'gallery', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['sortOrder' => 'ASC'])]
    private Collection $photos;

    public function __construct() { $this->photos = new ArrayCollection(); }

    public function getId(): ?int { return $this->id; }
    public function getClient(): ?Client { return $this->client; }
    public function setClient(?Client $v): static { $this->client = $v; return $this; }
    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $v): static { $this->title = $v; return $this; }
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $v): static { $this->description = $v; return $this; }
    public function getAccessCode(): ?string { return $this->accessCode; }
    public function setAccessCode(string $v): static { $this->accessCode = strtoupper($v); return $this; }
    public function getStatus(): string { return $this->status; }
    public function setStatus(string $v): static { $this->status = $v; return $this; }
    public function getSessionDate(): ?\DateTimeInterface { return $this->sessionDate; }
    public function setSessionDate(?\DateTimeInterface $v): static { $this->sessionDate = $v; return $this; }
    public function getExpiresAt(): ?\DateTimeImmutable { return $this->expiresAt; }
    public function setExpiresAt(?\DateTimeImmutable $v): static { $this->expiresAt = $v; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getPublishedAt(): ?\DateTimeImmutable { return $this->publishedAt; }
    public function setPublishedAt(?\DateTimeImmutable $v): static { $this->publishedAt = $v; return $this; }
    public function getViewCount(): int { return $this->viewCount; }
    public function incrementViewCount(): static { $this->viewCount++; return $this; }
    public function getLastAccessAt(): ?\DateTimeImmutable { return $this->lastAccessAt; }
    public function setLastAccessAt(?\DateTimeImmutable $v): static { $this->lastAccessAt = $v; return $this; }
    public function isDownloadEnabled(): bool { return $this->downloadEnabled; }
    public function setDownloadEnabled(bool $v): static { $this->downloadEnabled = $v; return $this; }
    public function isWatermarkEnabled(): bool { return $this->watermarkEnabled; }
    public function setWatermarkEnabled(bool $v): static { $this->watermarkEnabled = $v; return $this; }
    public function getDeliveryMode(): string { return $this->deliveryMode; }
    public function setDeliveryMode(string $v): static { $this->deliveryMode = $v; return $this; }
    public function getUpgradePrice(): ?string { return $this->upgradePrice; }
    public function setUpgradePrice(?string $v): static { $this->upgradePrice = $v; return $this; }
    public function getWatermarkLevel(): string { return $this->watermarkLevel; }
    public function setWatermarkLevel(string $v): static { $this->watermarkLevel = $v; return $this; }
    public function isAllowIndividualPurchase(): bool { return $this->allowIndividualPurchase; }
    public function setAllowIndividualPurchase(bool $v): static { $this->allowIndividualPurchase = $v; return $this; }
    public function needsWatermark(): bool { return $this->watermarkLevel !== self::WATERMARK_NONE || $this->watermarkEnabled; }
    public function getShareToken(): ?string { return $this->shareToken; }
    public function setShareToken(?string $v): static { $this->shareToken = $v; return $this; }
    public function generateShareToken(): string { $token = bin2hex(random_bytes(16)); $this->shareToken = $token; return $token; }

    public function getPhotos(): Collection { return $this->photos; }
    public function addPhoto(Photo $p): static { if (!$this->photos->contains($p)) { $this->photos->add($p); $p->setGallery($this); } return $this; }
    public function removePhoto(Photo $p): static { $this->photos->removeElement($p); return $this; }
    public function isExpired(): bool { return $this->expiresAt !== null && $this->expiresAt < new \DateTimeImmutable(); }
    public function isAccessible(): bool { return $this->status === self::STATUS_ACTIVE && !$this->isExpired(); }
    public function getPhotoCount(): int { return $this->photos->count(); }
    public function publish(?int $days = 30): static { $this->status = self::STATUS_ACTIVE; $this->publishedAt = new \DateTimeImmutable(); $this->expiresAt = $days !== null ? new \DateTimeImmutable("+{$days} days") : null; return $this; }

    #[ORM\PrePersist]
    public function onPrePersist(): void { $this->createdAt = new \DateTimeImmutable(); }
}
