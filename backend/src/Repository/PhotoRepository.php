<?php
namespace App\Repository;
use App\Entity\Photo;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
class PhotoRepository extends ServiceEntityRepository {
    public function __construct(ManagerRegistry $r) { parent::__construct($r, Photo::class); }
}
