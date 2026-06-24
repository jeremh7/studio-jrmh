<?php

namespace App\Controller\Admin;

use App\Entity\Project;
use App\Entity\ProjectPhoto;
use App\Repository\ProjectRepository;
use App\Service\ProjectService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/work', name: 'admin_work_')]
#[IsGranted('ROLE_ADMIN')]
class ProjectController extends AbstractController
{
    public function __construct(
        private readonly ProjectService $projectService,
        private readonly ProjectRepository $projectRepo,
        private readonly EntityManagerInterface $em,
        private readonly string $frontendUrl,
    ) {}

    // ── Liste ────────────────────────────────────────────────────

    #[Route('', name: 'index')]
    public function index(Request $request): Response
    {
        $cat    = $request->query->get('category');
        $status = $request->query->get('status');

        $qb = $this->projectRepo->createQueryBuilder('p')->orderBy('p.sortOrder', 'ASC')->addOrderBy('p.createdAt', 'DESC');
        if ($cat)    $qb->andWhere('p.category = :cat')->setParameter('cat', $cat);
        if ($status) $qb->andWhere('p.status = :status')->setParameter('status', $status);

        return $this->render('admin/work/index.html.twig', [
            'projects'   => $qb->getQuery()->getResult(),
            'categories' => Project::CATEGORIES,
            'category'   => $cat,
            'status'     => $status,
        ]);
    }

    // ── Créer ────────────────────────────────────────────────────

    #[Route('/new', name: 'new', methods: ['GET', 'POST'])]
    public function new(Request $request): Response
    {
        if ($request->isMethod('POST')) {
            $project = new Project();
            $project->setTitle($request->request->get('title'));
            $project->setCategory($request->request->get('category', 'sport'));
            $project->setDescription($request->request->get('description'));
            $project->setLocation($request->request->get('location'));
            $project->setFeatured((bool) $request->request->get('featured', false));
            if ($d = $request->request->get('event_date')) $project->setEventDate(new \DateTime($d));

            $this->em->persist($project);
            $this->em->flush();

            $this->addFlash('success', 'Projet "' . $project->getTitle() . '" créé.');
            return $this->redirectToRoute('admin_work_show', ['id' => $project->getId()]);
        }

        return $this->render('admin/work/new.html.twig', ['categories' => Project::CATEGORIES]);
    }

    // ── Voir / Upload ─────────────────────────────────────────────

    #[Route('/{id}', name: 'show', requirements: ['id' => '\d+'])]
    public function show(Project $project): Response
    {
        return $this->render('admin/work/show.html.twig', [
            'project'     => $project,
            'frontendUrl' => $this->frontendUrl,
        ]);
    }

    // ── Éditer ───────────────────────────────────────────────────

    #[Route('/{id}/edit', name: 'edit', requirements: ['id' => '\d+'], methods: ['GET', 'POST'])]
    public function edit(Project $project, Request $request): Response
    {
        if ($request->isMethod('POST')) {
            $project->setTitle($request->request->get('title'));
            $project->setCategory($request->request->get('category', 'sport'));
            $project->setDescription($request->request->get('description'));
            $project->setLocation($request->request->get('location'));
            $project->setFeatured((bool) $request->request->get('featured', false));
            if ($d = $request->request->get('event_date')) $project->setEventDate(new \DateTime($d));

            $this->em->flush();
            $this->addFlash('success', 'Projet mis à jour.');
            return $this->redirectToRoute('admin_work_show', ['id' => $project->getId()]);
        }

        return $this->render('admin/work/edit.html.twig', [
            'project'    => $project,
            'categories' => Project::CATEGORIES,
        ]);
    }

    // ── Publier / Dépublier ───────────────────────────────────────

    #[Route('/{id}/publish', name: 'publish', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function publish(Project $project): Response
    {
        $project->publish();
        $this->em->flush();
        $this->addFlash('success', 'Projet publié.');
        return $this->redirectToRoute('admin_work_show', ['id' => $project->getId()]);
    }

    #[Route('/{id}/unpublish', name: 'unpublish', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function unpublish(Project $project): Response
    {
        $project->setStatus(Project::STATUS_DRAFT);
        $this->em->flush();
        $this->addFlash('success', 'Projet repassé en brouillon.');
        return $this->redirectToRoute('admin_work_show', ['id' => $project->getId()]);
    }

    // ── Upload photos ─────────────────────────────────────────────

    #[Route('/{id}/upload', name: 'upload', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function upload(Project $project, Request $request): JsonResponse
    {
        $files = $request->files->get('photos', []);
        if (!is_array($files)) $files = [$files];

        $uploaded = [];
        $errors   = [];

        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) continue;
            if (!in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'])) {
                $errors[] = $file->getClientOriginalName() . ' — format non supporté.';
                continue;
            }
            if ($file->getSize() > 30 * 1024 * 1024) {
                $errors[] = $file->getClientOriginalName() . ' — trop lourd (max 30 MB).';
                continue;
            }
            try {
                $photo = $this->projectService->uploadPhoto($project, $file);
                $uploaded[] = [
                    'id'    => $photo->getId(),
                    'name'  => $photo->getOriginalFilename(),
                    'size'  => $photo->getFileSizeFormatted(),
                    'url'   => $photo->getPublicUrl(),
                    'cover' => $photo->isCover(),
                ];
            } catch (\Exception $e) {
                $errors[] = $file->getClientOriginalName() . ' — ' . $e->getMessage();
            }
        }

        return $this->json(['uploaded' => $uploaded, 'errors' => $errors, 'total' => $project->getPhotoCount()]);
    }

    // ── Définir cover ─────────────────────────────────────────────

    #[Route('/photos/{id}/cover', name: 'photo_cover', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function setCover(ProjectPhoto $photo): JsonResponse
    {
        $this->projectService->setCover($photo->getProject(), $photo);
        return $this->json(['ok' => true, 'photoId' => $photo->getId()]);
    }

    // ── Supprimer photo ───────────────────────────────────────────

    #[Route('/photos/{id}/delete', name: 'photo_delete', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function deletePhoto(ProjectPhoto $photo): JsonResponse
    {
        $pid = $photo->getProject()->getId();
        $this->projectService->deletePhoto($photo);
        return $this->json(['ok' => true, 'project_id' => $pid]);
    }

    // ── Réordonner photos ─────────────────────────────────────────

    #[Route('/{id}/reorder-photos', name: 'reorder_photos', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function reorderPhotos(Project $project, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->projectService->reorderPhotos($project, $data['ids'] ?? []);
        return $this->json(['ok' => true]);
    }

    // ── Réordonner projets ────────────────────────────────────────

    #[Route('/reorder', name: 'reorder', methods: ['POST'])]
    public function reorder(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $this->projectService->reorderProjects($data['ids'] ?? []);
        return $this->json(['ok' => true]);
    }

    // ── Supprimer projet ──────────────────────────────────────────

    #[Route('/{id}/delete', name: 'delete', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function delete(Project $project): Response
    {
        $this->em->remove($project);
        $this->em->flush();
        $this->addFlash('success', 'Projet supprimé.');
        return $this->redirectToRoute('admin_work_index');
    }
}
