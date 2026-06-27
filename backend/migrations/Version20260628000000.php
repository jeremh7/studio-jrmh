<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260628000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Sessions stockées en base (PdoSessionHandler) pour survivre aux redéploiements';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE sessions (
            sess_id VARCHAR(128) NOT NULL PRIMARY KEY,
            sess_data BYTEA NOT NULL,
            sess_lifetime INTEGER NOT NULL,
            sess_time INTEGER NOT NULL
        )');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE sessions');
    }
}
