START TRANSACTION;

ALTER TABLE servers CHANGE COLUMN file_password manager_password VARCHAR(255) NULL;
ALTER TABLE servers ADD COLUMN env_visibility JSON NULL;

COMMIT;
