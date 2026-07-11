<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Project;
use App\Entity\ProjectPhoto;
use Doctrine\ORM\EntityManagerInterface;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Convertit les photos de projets existantes (JPEG/PNG bruts) en WebP 2000px.
 * Idempotent : les photos déjà en WebP sont ignorées — peut tourner à chaque boot.
 */
#[AsCommand(
    name: 'app:optimize-project-photos',
    description: 'Convertit les photos Work existantes en WebP 2000px (idempotent)',
)]
final class OptimizeProjectPhotosCommand extends Command
{
    private const MAX_SIZE = 2000;
    private const QUALITY  = 85;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly string $uploadDir,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        ini_set('memory_limit', '512M');
        $io = new SymfonyStyle($input, $output);

        $photos = $this->em->getRepository(ProjectPhoto::class)->findAll();
        $todo   = array_filter(
            $photos,
            static fn (ProjectPhoto $p) => in_array(strtolower($p->getExtension() ?? ''), ['jpg', 'jpeg', 'png'], true)
        );

        if ($todo === []) {
            $io->success('Rien à convertir — toutes les photos sont déjà optimisées.');
            return Command::SUCCESS;
        }

        $io->title(sprintf('Conversion de %d photo(s) en WebP %dpx', count($todo), self::MAX_SIZE));

        $manager   = new ImageManager(new Driver());
        $converted = 0;
        $errors    = 0;

        foreach ($todo as $photo) {
            $oldName = $photo->getStoredFilename();
            $oldPath = $this->uploadDir . '/' . $photo->getPath();

            if (!is_file($oldPath)) {
                $io->warning(sprintf('Fichier manquant, ignoré : %s', $photo->getPath()));
                continue;
            }

            $newName = pathinfo($oldName, PATHINFO_FILENAME) . '.webp';
            $newPath = dirname($oldPath) . '/' . $newName;
            $newRel  = dirname($photo->getPath()) . '/' . $newName;

            try {
                $image = $manager->read($oldPath);
                $image->scaleDown(width: self::MAX_SIZE, height: self::MAX_SIZE);
                $image->toWebp(quality: self::QUALITY)->save($newPath);

                $photo->setStoredFilename($newName);
                $photo->setPath($newRel);
                $photo->setExtension('webp');
                $photo->setFileSize(filesize($newPath) ?: 0);
                $photo->setWidth($image->width());
                $photo->setHeight($image->height());

                // Répercute sur la cover du projet si elle pointait sur l'ancien fichier
                $project = $photo->getProject();
                if ($project instanceof Project && $project->getCoverImage() === $oldName) {
                    $project->setCoverImage($newName);
                }

                $this->em->flush();
                @unlink($oldPath);

                $converted++;
                $io->writeln(sprintf('  ✓ %s → %s', $oldName, $newName));
            } catch (\Throwable $e) {
                $errors++;
                $io->warning(sprintf('Échec %s : %s', $oldName, $e->getMessage()));
                @unlink($newPath); // pas de fichier orphelin à moitié écrit
            }
        }

        $io->success(sprintf('%d photo(s) converties, %d erreur(s).', $converted, $errors));

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
