<?php
namespace App\Repository;
use App\Entity\Gallery;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
class GalleryRepository extends ServiceEntityRepository {
    public function __construct(ManagerRegistry $r) { parent::__construct($r, Gallery::class); }
}
