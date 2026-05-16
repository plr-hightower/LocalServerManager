CREATE TABLE IF NOT EXISTS game_servers (
  id           VARCHAR(36)  NOT NULL,
  name         VARCHAR(255) NOT NULL,
  container_id VARCHAR(255) NULL,
  ram_alloc_mb INT          NOT NULL,
  status       VARCHAR(50)  NOT NULL DEFAULT 'stopped',
  host_port    INT          NOT NULL,
  created_by   VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
);