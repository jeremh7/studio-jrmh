<?php

namespace App\Service;

use App\Entity\Project;
use App\Entity\ProjectPhoto;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class ProjectService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly string $uploadDir,
    ) {}

    public function uploadPhoto(Project $project, UploadedFile $file): ProjectPhoto
    {
        $dir = $this->uploadDir . '/projects/' . $project->getId();
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $ext  = $file->guessExtension() ?? 'jpg';
        $name = sprintf('%d_%s.%s', $project->getId(), uniqid(), $ext);
        $rel  = sprintf('projects/%d/%s', $project->getId(), $name);

        $file->move($dir, $name);

        $photo = new ProjectPhoto();
        $photo->setProject($project);
        $photo->setOriginalFilename($file->getClientOriginalName());
        $photo->setStoredFilename($name);
        $photo->setPath($rel);
        $photo->setExtension($ext);
        $photo->setFileSize(filesize($dir . '/' . $name) ?: 0);
        $photo->setSortOrder($project->getPhotos()->count());

        if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
            [$w, $h] = @getimagesize($dir . '/' . $name) ?: [null, null];
            $photo->setWidth($w);
            $photo->setHeight($h);
        }

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
