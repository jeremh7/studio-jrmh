<?php

namespace App\Service;

use App\Entity\Project;
use App\Entity\ProjectPhoto;
use Doctrine\ORM\EntityManagerInterface;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class ProjectService
{
    // Portfolio : plus grand que les galeries client (1200px) pour la qualité d'affichage
    private const WEB_MAX_SIZE = 2000;
    private const WEB_QUALITY  = 85;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly string $uploadDir,
    ) {}

    public function uploadPhoto(Project $project, UploadedFile $file): ProjectPhoto
    {
        $dir = $this->uploadDir . '/projects/' . $project->getId();
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $base    = sprintf('%d_%s', $project->getId(), uniqid());
        $srcPath = $file->getRealPath();

        // Version web WebP redimensionnée ; si le décodage échoue (format exotique),
        // on retombe sur l'upload brut comme avant.
        try {
            $manager = new ImageManager(new Driver());
            $image   = $manager->read($srcPath);
            $image->scaleDown(width: self::WEB_MAX_SIZE, height: self::WEB_MAX_SIZE);

            $name = $base . '.webp';
            $ext  = 'webp';
            $image->toWebp(quality: self::WEB_QUALITY)->save($dir . '/' . $name);
        } catch (\Throwable) {
            $ext  = strtolower($file->guessExtension() ?? 'jpg');
            $name = $base . '.' . $ext;
            $file->move($dir, $name);
        }

        $rel = sprintf('projects/%d/%s', $project->getId(), $name);

        $photo = new ProjectPhoto();
        $photo->setProject($project);
        $photo->setOriginalFilename($file->getClientOriginalName());
        $photo->setStoredFilename($name);
        $photo->setPath($rel);
        $photo->setExtension($ext);
        $photo->setFileSize(filesize($dir . '/' . $name) ?: 0);
        $photo->setSortOrder($project->getPhotos()->count());

        [$w, $h] = @getimagesize($dir . '/' . $name) ?: [null, null];
        $photo->setWidth($w);
        $photo->setHeight($h);

        // Première photo = cover auto
        if ($project->getPhotoCount() === 0) {
            $photo->setIsCover(true);
            $project->setCoverImage($name);
        }

        $this->em->persist($photo);
        $this->em->flush();

        return $photo;
    }

    public function deletePhoto(ProjectPhoto $photo): void
    {
        $fp = $this->uploadDir . '/' . $photo->getPath();
        if (file_exists($fp)) unlink($fp);
        $this->em->remove($photo);
        $this->em->flush();
    }

    public function setCover(Project $project, ProjectPhoto $photo): void
    {
        foreach ($project->getPhotos() as $p) {
            $p->setIsCover(false);
        }
        $photo->setIsCover(true);
        $project->setCoverImage($photo->getStoredFilename());
        $this->em->flush();
    }

    public function reorderPhotos(Project $project, array $ids): void
    {
        $map = [];
        foreach ($project->getPhotos() as $p) $map[$p->getId()] = $p;
        foreach ($ids as $i => $id) if (isset($map[$id])) $map[$id]->setSortOrder($i);
        $this->em->flush();
    }

    public function reorderProjects(array $ids): void
    {
        $repo = $this->em->getRepository(Project::class);
        foreach ($ids as $i => $id) {
            $project = $repo->find($id);
            if ($project) $project->setSortOrder($i);
        }
        $this->em->flush();
    }
}
