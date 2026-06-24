<?php

declare(strict_types=1);

namespace App\Twig;

use App\Repository\ContactMessageRepository;
use Twig\Extension\AbstractExtension;
use Twig\Extension\GlobalsInterface;

final class AdminGlobalsExtension extends AbstractExtension implements GlobalsInterface
{
    public function __construct(
        private readonly ContactMessageRepository $contactRepo,
    ) {}

    public function getGlobals(): array
    {
        return [
            'unreadContactCount' => $this->contactRepo->countUnread(),
        ];
    }
}
