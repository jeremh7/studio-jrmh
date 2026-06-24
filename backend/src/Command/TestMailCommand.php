<?php

declare(strict_types=1);

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Twig\Environment;

#[AsCommand(
    name: 'app:mail:test',
    description: 'Envoie un email de test pour vérifier la configuration Mailer.',
)]
final class TestMailCommand extends Command
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly Environment    $twig,
        private readonly string $mailerFrom,
        private readonly string $mailerFromName,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('to', null, InputOption::VALUE_REQUIRED,
            'Adresse email de destination', 'test@example.com');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $to = $input->getOption('to');

        $io->title('Test Mailer — Studiø JRMH');
        $io->text([
            'From : ' . $this->mailerFrom,
            'To   : ' . $to,
        ]);

        try {
            // Rendu d'un template existant pour tester Twig en même temps
            $html = $this->twig->render('emails/base.html.twig', []);

            $email = (new Email())
                ->from(sprintf('"%s" <%s>', $this->mailerFromName, $this->mailerFrom))
                ->to($to)
                ->subject('[TEST] Studiø JRMH — ' . date('d/m/Y H:i:s'))
                ->html($html);

            $this->mailer->send($email);

            $io->success('Email envoyé avec succès ! Vérifiez votre boîte (ou Mailtrap).');
            return Command::SUCCESS;

        } catch (\Symfony\Component\Mailer\Exception\TransportExceptionInterface $e) {
            $io->error([
                'Erreur de transport SMTP :',
                $e->getMessage(),
                $e->getDebug(),
            ]);
            return Command::FAILURE;

        } catch (\Twig\Error\Error $e) {
            $io->error(['Erreur de template Twig :', $e->getMessage()]);
            return Command::FAILURE;

        } catch (\Throwable $e) {
            $io->error([$e::class, $e->getMessage()]);
            return Command::FAILURE;
        }
    }
}
