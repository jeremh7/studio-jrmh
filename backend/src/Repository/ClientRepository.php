<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Client;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Security\User\UserLoaderInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class ClientRepository extends ServiceEntityRepository implements UserLoaderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Client::class);
    }

    public function loadUserByIdentifier(string $identifier): ?UserInterface
    {
        return $this->findOneBy(['email' => $identifier]);
    }

    public function findByEmailVerificationToken(string $token): ?Client
    {
        return $this->findOneBy(['emailVerificationToken' => $token]);
    }

    /**
     * Recherche un client actif et non suspendu par email.
     */
    public function findActiveByEmail(string $email): ?Client
    {
        return $this->createQueryBuilder('c')
            ->where('c.email = :email')
            ->andWhere('c.isActive = true')
            ->setParameter('email', $email)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
