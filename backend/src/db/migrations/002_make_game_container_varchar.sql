START TRANSACTION;

-- game_container was a SQL ENUM tied to a hardcoded game list, requiring a new
-- migration every time a game was added at the app level (GameEnum in
-- shared/src/server.schema.ts). Zod already validates this value on every
-- write, so the DB doesn't need its own copy of the list — a plain VARCHAR
-- keeps the column enum-agnostic going forward.
ALTER TABLE servers
    MODIFY COLUMN game_container VARCHAR(50) NOT NULL;

COMMIT;
