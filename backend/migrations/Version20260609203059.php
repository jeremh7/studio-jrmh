<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260609203059 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Phase 2 — Gallery V2 (deliveryMode, upgradePrice, watermarkLevel, allowIndividualPurchase) + Photo V2 (webPath, fullPath, webSize, unitPrice, isPurchasable)';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE gallery ADD delivery_mode VARCHAR(20) DEFAULT \'web_only\' NOT NULL');
        $this->addSql('ALTER TABLE gallery ADD upgrade_price NUMERIC(8, 2) DEFAULT NULL');
        $this->addSql('ALTER TABLE gallery ADD watermark_level VARCHAR(20) DEFAULT \'none\' NOT NULL');
        $this->addSql('ALTER TABLE gallery ADD allow_individual_purchase BOOLEAN DEFAULT false NOT NULL');
        $this->addSql('ALTER TABLE photo ADD web_path VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE photo ADD full_path VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE photo ADD web_size INT DEFAULT NULL');
        $this->addSql('ALTER TABLE photo ADD unit_price NUMERIC(8, 2) DEFAULT NULL');
        $this->addSql('ALTER TABLE photo ADD is_purchasable BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE gallery DROP delivery_mode');
        $this->addSql('ALTER TABLE gallery DROP upgrade_price');
        $this->addSql('ALTER TABLE gallery DROP watermark_level');
        $this->addSql('ALTER TABLE gallery DROP allow_individual_purchase');
        $this->addSql('ALTER TABLE photo DROP web_path');
        $this->addSql('ALTER TABLE photo DROP full_path');
        $this->addSql('ALTER TABLE photo DROP web_size');
        $this->addSql('ALTER TABLE photo DROP unit_price');
        $this->addSql('ALTER TABLE photo DROP is_purchasable');
    }
}
