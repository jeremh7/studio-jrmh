<?php

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:admin:create', description: 'Crée ou met à jour un administrateur')]
class CreateAdminCommand extends Command
{
    public function __construct(
        private EntityManagerInterface      $em,
        private UserPasswordHasherInterface $hasher,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email    = 'studiojrmh@gmail.com';
        $password = $_ENV['ADMIN_PASSWORD'] ?? '';

        if ($password === '') {
            $io->error('Variable ADMIN_PASSWORD non définie.');
            return Command::FAILURE;
        }

        $repo = $this->em->getRepository(User::class);
        $user = $repo->findOneBy(['email' => $email]);

        if (!$user) {
            $user = new User();
            $user->setEmail($email);
            $user->setFirstName('Jérémy');
            $user->setLastName('Hordé');
            $this->em->persist($user);
        }

        $user->setRoles(['ROLE_ADMIN']);
        $user->setPassword($this->hasher->hashPassword($user, $password));
        $user->setIsActive(true);

        $this->em->flush();

        $io->success("Admin créé/mis à jour : {$email}");

        return Command::SUCCESS;
    }
}
