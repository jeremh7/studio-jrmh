<?php
namespace App\Repository;
use App\Entity\ProjectPhoto;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
class ProjectPhotoRepository extends ServiceEntityRepository {
    public function __construct(ManagerRegistry $r) { parent::__construct($r, ProjectPhoto::class); }
}
