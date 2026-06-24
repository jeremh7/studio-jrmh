<?php
namespace App\Repository;
use App\Entity\Project;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
class ProjectRepository extends ServiceEntityRepository {
    public function __construct(ManagerRegistry $r) { parent::__construct($r, Project::class); }
    public function findPublished(): array {
        return $this->createQueryBuilder('p')
            ->where('p.status = :s')->setParameter('s', Project::STATUS_PUBLISHED)
            ->orderBy('p.sortOrder', 'ASC')->addOrderBy('p.publishedAt', 'DESC')
            ->getQuery()->getResult();
    }
    public function findPublishedByCategory(string $cat): array {
        return $this->createQueryBuilder('p')
            ->where('p.status = :s')->setParameter('s', Project::STATUS_PUBLISHED)
            ->andWhere('p.category = :c')->setParameter('c', $cat)
            ->orderBy('p.sortOrder', 'ASC')
            ->getQuery()->getResult();
    }
}
