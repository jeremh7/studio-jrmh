<?php

namespace App\Service;

use App\Entity\Project;
use App\Entity\ProjectPhoto;
use App\Service\Storage\MimeTypes;
use App\Service\Storage\R2Storage;
use Doctrine\ORM\EntityManagerInterface;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class ProjectService
{
    // Portfolio : plus grand que les galeries client (1200px) pour la qualite d'affichage
    private const WEB_MAX_SIZE = 2000;
    private const WEB_QUALITY  = 85;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly string $uploadDir,
        private readonly R2Storage $storage,
    ) {}

    public function uploadPhoto(Project $project, UploadedFile $file): ProjectPhoto
    {
        $base    = sprintf('%d_%s', $project->getId(), uniqid());
        $srcPath = $file->getRealPath();
        $tmpDir  = sys_get_temp_dir();

        // Version web WebP redimensionnee ; si le decodage echoue (format exotique),
        // on retombe sur l'upload brut comme avant.
        try {
            $manager = new ImageManager(new Driver());
            $image   = $manager->read($srcPath);
            $image->scaleDown(width: self::WEB_MAX_SIZE, height: self::WEB_MAX_SIZE);

            $name    = $base . '.webp';
            $ext     = 'webp';
            $tmpPath = $tmpDir . '/jrmh_proj_' . $name;
            $image->toWebp(quality: self::WEB_QUALITY)->save($tmpPath);
            [$w, $h] = [$image->width(), $image->height()];
        } catch (\Throwable) {
            $ext     = strtolower($file->guessExtension() ?? 'jpg');
            $name    = $base . '.' . $ext;
            $tmpPath = $tmpDir . '/jrmh_proj_' . $name;
            copy($srcPath, $tmpPath);
            [$w, $h] = @getimagesize($tmpPath) ?: [null, null];
        }

        $rel  = sprintf('projects/%d/%s', $project->getId(), $name);
        $size = filesize($tmpPath) ?: 0;

        if ($this->storage->enabled) {
            $this->storage->uploadPublic($tmpPath, $rel, MimeTypes::forExtension($ext));
            @unlink($tmpPath);
        } else {
            $dir = $this->uploadDir . '/projects/' . $project->getId();
            if (!is_dir($dir)) mkdir($dir, 0755, true);
            rename($tmpPath, $dir . '/' . $name);
        }

        $photo = new ProjectPhoto();
        $photo->setProject($project);
        $photo->setOriginalFilename($file->getClientOriginalName());
        $photo->setStoredFilename($name);
        $photo->setPath($rel);
        $photo->setExtension($ext);
        $photo->setFileSize($size);
        $photo->setSortOrder($project->getPhotoCount());
        $photo->setWidth($w);
        $photo->setHeight($h);

        // Premiere photo = cover auto
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
        if ($this->storage->enabled) {
            $this->storage->deletePublic($photo->getPath());
        } else {
            $fp = $this->uploadDir . '/' . $photo->getPath();
            if (file_exists($fp)) unlink($fp);
        }
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
