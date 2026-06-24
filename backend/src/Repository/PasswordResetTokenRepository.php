<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Client;
use App\Entity\PasswordResetToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PasswordResetToken>
 */
final class PasswordResetTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PasswordResetToken::class);
    }

    /**
     * Invalide tous les tokens non utilisés d'un client
     * (appelé avant d'en créer un nouveau)
     */
    public function invalidateForClient(Client $client): void
    {
        $this->createQueryBuilder('t')
            ->update()
            ->set('t.used', ':used')
            ->where('t.client = :client')
            ->andWhere('t.used = false')
            ->setParameter('used', true)
            ->setParameter('client', $client)
            ->getQuery()
            ->execute();
    }

    /**
     * Supprime tous les tokens expirés de la base (à appeler via une commande/cron)
     */
    public function purgeExpired(): int
    {
        return $this->createQueryBuilder('t')
            ->delete()
            ->where('t.expiresAt < :now')
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->execute();
    }
}