<?php

namespace App\Controller\Api;

use App\Entity\Project;
use App\Repository\ProjectRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/work', name: 'api_work_')]
class WorkController extends AbstractController
{
    public function __construct(
        private readonly ProjectRepository $projectRepo,
    ) {}

    /**
     * GET /api/work
     * Retourne tous les projets publiés (avec cover)
     * ?category=sport  pour filtrer
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $category = $request->query->get('category');

        $projects = $category
            ? $this->projectRepo->findPublishedByCategory($category)
            : $this->projectRepo->findPublished();

        return $this->json([
            'projects' => array_map(fn($p) => $this->serializeProject($p), $projects),
            'total'    => count($projects),
            'categories' => Project::CATEGORIES,
        ]);
    }

    /**
     * GET /api/work/{slug}
     * Retourne un projet complet avec toutes ses photos
     */
    #[Route('/{slug}', name: 'show', methods: ['GET'])]
    public function show(string $slug): JsonResponse
    {
        $project = $this->projectRepo->findOneBy(['slug' => $slug, 'status' => Project::STATUS_PUBLISHED]);

        if (!$project) {
            return $this->json(['error' => 'Projet introuvable.'], 404);
        }

        $photos = array_map(fn($photo) => [
            'id'        => $photo->getId(),
            'url'       => $photo->getPublicUrl(),
            'caption'   => $photo->getCaption(),
            'width'     => $photo->getWidth(),
            'height'    => $photo->getHeight(),
            'cover'     => $photo->isCover(),
            'sortOrder' => $photo->getSortOrder(),
        ], $project->getPhotos()->toArray());

        return $this->json([
            ...$this->serializeProject($project),
            'photos' => $photos,
        ]);
    }

    private function serializeProject(Project $p): array
    {
        return [
            'id'           => $p->getId(),
            'title'        => $p->getTitle(),
            'slug'         => $p->getSlug(),
            'category'     => $p->getCategory(),
            'categoryLabel'=> $p->getCategoryLabel(),
            'description'  => $p->getDescription(),
            'location'     => $p->getLocation(),
            'eventDate'    => $p->getEventDate()?->format('d F Y'),
            'coverImage'   => $p->getCoverImageUrl(),
            'photoCount'   => $p->getPhotoCount(),
            'featured'     => $p->isFeatured(),
            'publishedAt'  => $p->getPublishedAt()?->format('Y-m-d'),
        ];
    }
}
