<?php

declare(strict_types=1);

namespace App\Service\Storage;

use Aws\S3\Exception\S3Exception;
use Aws\S3\S3Client;
use Psr\Log\LoggerInterface;

/**
 * Stockage objet Cloudflare R2 (API compatible S3).
 *
 * Deux buckets :
 *  - "public"  → photos web optimisées (WebP), exposées via l'URL publique R2.
 *  - "private" → originaux full résolution, jamais exposés, uniquement via l'API (ZIP).
 *
 * Si les identifiants R2 ne sont pas configurés (dev local), `isEnabled()` retourne false
 * et les services appelants retombent sur le stockage disque local — aucune config requise
 * pour développer en local.
 */
final class R2Storage
{
    private readonly ?S3Client $client;
    public readonly bool $enabled;

    public function __construct(
        ?string $accountId,
        ?string $accessKeyId,
        ?string $secretAccessKey,
        private readonly ?string $publicBucket,
        private readonly ?string $privateBucket,
        private readonly ?string $publicBaseUrl,
        private readonly LoggerInterface $logger,
    ) {
        $this->enabled = (bool) ($accountId && $accessKeyId && $secretAccessKey && $publicBucket && $privateBucket);

        $this->client = $this->enabled ? new S3Client([
            'version'     => 'latest',
            'region'      => 'auto',
            'endpoint'    => "https://{$accountId}.r2.cloudflarestorage.com",
            'credentials' => [
                'key'    => $accessKeyId,
                'secret' => $secretAccessKey,
            ],
        ]) : null;
    }

    public function uploadPublic(string $localPath, string $key, string $contentType): void
    {
        $this->put($this->publicBucket, $localPath, $key, $contentType);
    }

    public function uploadPrivate(string $localPath, string $key, string $contentType): void
    {
        $this->put($this->privateBucket, $localPath, $key, $contentType);
    }

    public function deletePublic(string $key): void
    {
        $this->delete($this->publicBucket, $key);
    }

    public function deletePrivate(string $key): void
    {
        $this->delete($this->privateBucket, $key);
    }

    /**
     * Télécharge un objet privé vers un fichier temporaire local (pour construction de ZIP).
     * Retourne null si l'objet est introuvable.
     */
    public function downloadPrivateToTemp(string $key): ?string
    {
        return $this->downloadToTemp($this->privateBucket, $key);
    }

    /** Idem pour le bucket public (fallback si l'original privé a été perdu). */
    public function downloadPublicToTemp(string $key): ?string
    {
        return $this->downloadToTemp($this->publicBucket, $key);
    }

    public function publicUrl(string $key): string
    {
        return rtrim((string) $this->publicBaseUrl, '/') . '/' . ltrim($key, '/');
    }

    // ── Interne ───────────────────────────────────────────────────

    private function put(?string $bucket, string $localPath, string $key, string $contentType): void
    {
        try {
            $this->client->putObject([
                'Bucket'      => $bucket,
                'Key'         => $key,
                'SourceFile'  => $localPath,
                'ContentType' => $contentType,
                'CacheControl' => 'public, max-age=31536000, immutable',
            ]);
        } catch (S3Exception $e) {
            $this->logger->error('[R2Storage] Échec upload', ['bucket' => $bucket, 'key' => $key, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function delete(?string $bucket, string $key): void
    {
        try {
            $this->client->deleteObject(['Bucket' => $bucket, 'Key' => $key]);
        } catch (S3Exception $e) {
            $this->logger->warning('[R2Storage] Échec suppression', ['bucket' => $bucket, 'key' => $key, 'error' => $e->getMessage()]);
        }
    }

    private function downloadToTemp(?string $bucket, string $key): ?string
    {
        $tmp = sys_get_temp_dir() . '/jrmh_r2_' . bin2hex(random_bytes(8));
        try {
            $this->client->getObject(['Bucket' => $bucket, 'Key' => $key, 'SaveAs' => $tmp]);
            return $tmp;
        } catch (S3Exception $e) {
            $this->logger->warning('[R2Storage] Échec téléchargement', ['bucket' => $bucket, 'key' => $key, 'error' => $e->getMessage()]);
            @unlink($tmp);
            return null;
        }
    }
}
