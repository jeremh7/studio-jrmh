<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260609202547 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Client V2 — ajout credits, account_status, email_verified_at, email_verification_token';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE client ADD credits INT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE client ADD account_status VARCHAR(30) DEFAULT \'active\' NOT NULL');
        $this->addSql('ALTER TABLE client ADD email_verified_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE client ADD email_verification_token VARCHAR(64) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE client DROP credits');
        $this->addSql('ALTER TABLE client DROP account_status');
        $this->addSql('ALTER TABLE client DROP email_verified_at');
        $this->addSql('ALTER TABLE client DROP email_verification_token');
    }
}
