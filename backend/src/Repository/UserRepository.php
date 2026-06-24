<?php
namespace App\Repository;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface {
    public function __construct(ManagerRegistry $r) { parent::__construct($r, User::class); }
    public function upgradePassword(PasswordAuthenticatedUserInterface $u, string $p): void {
        if (!$u instanceof User) throw new UnsupportedUserException();
        $u->setPassword($p); $this->getEntityManager()->flush();
    }
}
